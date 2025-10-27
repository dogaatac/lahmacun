import DocumentPicker, {
  DocumentPickerResponse,
} from "react-native-document-picker";
import RNFS from "react-native-fs";
import RNBlobUtil from "react-native-blob-util";
import mammoth from "mammoth";
import {
  ImportedDocument,
  DocumentChunk,
  DocumentProcessingProgress,
  DocumentProcessingStatus,
  DocumentSummary,
  DocumentQuiz,
} from "../types";
import StorageService from "./StorageService";
import PDFProcessor from "../utils/PDFProcessor";
import PerformanceMonitor from "../utils/PerformanceMonitor";
import PermissionsHelper from "../utils/PermissionsHelper";
import BackgroundTaskManager from "../utils/BackgroundTaskManager";

const DOCUMENTS_STORAGE_KEY = "imported_documents";
const DOCUMENT_CHUNKS_KEY = "document_chunks";
const CHUNK_SIZE = 2000;
const MAX_TOKENS_PER_CHUNK = 3000;

export class DocumentService {
  private progressListeners: Map<
    string,
    (progress: DocumentProcessingProgress) => void
  > = new Map();
  private processingQueue: Map<string, AbortController> = new Map();

  async pickDocument(): Promise<ImportedDocument | null> {
    try {
      const hasPermission = await PermissionsHelper.ensureStoragePermission();
      if (!hasPermission) {
        throw new Error("Storage permission is required to import documents");
      }

      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.docx,
          DocumentPicker.types.images,
        ],
        copyTo: "documentDirectory",
      });

      if (result && result.length > 0) {
        return await this.createDocumentFromPicker(result[0]);
      }

      return null;
    } catch (error: any) {
      if (DocumentPicker.isCancel(error)) {
        return null;
      }
      throw new Error(`Failed to pick document: ${error.message}`);
    }
  }

  async importDocument(
    uri: string,
    name: string,
    type: "pdf" | "docx" | "image"
  ): Promise<ImportedDocument> {
    const doc: ImportedDocument = {
      id: this.generateId(),
      name,
      type,
      uri,
      size: 0,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    try {
      const stat = await RNFS.stat(uri);
      doc.size = parseInt(stat.size as any, 10);
    } catch (error) {
      console.warn("Failed to get file size:", error);
    }

    await this.saveDocument(doc);
    return doc;
  }

  async processDocument(
    documentId: string,
    options?: { resume?: boolean }
  ): Promise<void> {
    const doc = await this.getDocument(documentId);
    if (!doc) {
      throw new Error("Document not found");
    }

    if (doc.status === "completed" && !options?.resume) {
      return;
    }

    const abortController = new AbortController();
    this.processingQueue.set(documentId, abortController);

    BackgroundTaskManager.registerTask(
      documentId,
      `Processing ${doc.name}`,
      async () => {
        await this.processDocument(documentId, { resume: true });
      },
      async () => {
        await this.pauseProcessing(documentId);
      }
    );

    try {
      await this.updateDocumentStatus(documentId, "processing", 0);

      let extractedText = "";
      let pageCount = 0;

      if (doc.type === "pdf") {
        const result = await this.extractTextFromPDF(
          doc.uri,
          documentId,
          abortController.signal
        );
        extractedText = result.text;
        pageCount = result.pageCount;
      } else if (doc.type === "docx") {
        extractedText = await this.extractTextFromDocx(doc.uri);
        pageCount = 1;
      } else if (doc.type === "image") {
        extractedText = await this.extractTextFromImage(doc.uri);
        pageCount = 1;
      }

      if (abortController.signal.aborted) {
        await this.updateDocumentStatus(documentId, "paused", 0);
        BackgroundTaskManager.updateTaskStatus(documentId, "paused");
        return;
      }

      const chunks = await this.chunkDocument(
        documentId,
        extractedText,
        pageCount
      );

      doc.extractedText = extractedText;
      doc.chunks = chunks;
      doc.pageCount = pageCount;
      doc.status = "completed";
      doc.updatedAt = Date.now();

      await this.saveDocument(doc);
      await this.saveDocumentChunks(documentId, chunks);
      await this.updateDocumentStatus(documentId, "completed", 100);
      BackgroundTaskManager.updateTaskStatus(documentId, "completed");
    } catch (error: any) {
      await this.updateDocumentStatus(
        documentId,
        "failed",
        0,
        error.message
      );
      BackgroundTaskManager.updateTaskStatus(documentId, "failed");
      throw error;
    } finally {
      this.processingQueue.delete(documentId);
      BackgroundTaskManager.removeTask(documentId);
    }
  }

  async pauseProcessing(documentId: string): Promise<void> {
    const controller = this.processingQueue.get(documentId);
    if (controller) {
      controller.abort();
      await this.updateDocumentStatus(documentId, "paused", 0);
    }
  }

  async getDocuments(): Promise<ImportedDocument[]> {
    const docs = await StorageService.get<ImportedDocument[]>(
      DOCUMENTS_STORAGE_KEY
    );
    return docs || [];
  }

  async getDocument(documentId: string): Promise<ImportedDocument | null> {
    const docs = await this.getDocuments();
    return docs.find((d) => d.id === documentId) || null;
  }

  async deleteDocument(documentId: string): Promise<void> {
    const doc = await this.getDocument(documentId);
    if (!doc) {return;}

    try {
      if (await RNFS.exists(doc.uri)) {
        await RNFS.unlink(doc.uri);
      }
    } catch (error) {
      console.warn("Failed to delete file:", error);
    }

    await StorageService.remove(`${DOCUMENT_CHUNKS_KEY}_${documentId}`);
    PDFProcessor.unloadDocument(documentId);

    const docs = await this.getDocuments();
    const filteredDocs = docs.filter((d) => d.id !== documentId);
    await StorageService.set(DOCUMENTS_STORAGE_KEY, filteredDocs);
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    const chunks = await StorageService.get<DocumentChunk[]>(
      `${DOCUMENT_CHUNKS_KEY}_${documentId}`
    );
    return chunks || [];
  }

  async generateSummary(
    documentId: string,
    geminiService: any
  ): Promise<DocumentSummary> {
    const doc = await this.getDocument(documentId);
    if (!doc || !doc.extractedText) {
      throw new Error("Document not found or not processed");
    }

    const chunks = await this.getDocumentChunks(documentId);
    const summaries: string[] = [];

    for (const chunk of chunks.slice(0, 5)) {
      const response = await geminiService.chat(
        `Summarize the following text in 2-3 sentences:\n\n${chunk.text}`
      );
      summaries.push(response.text);
    }

    const fullSummary = summaries.join(" ");
    const keyPointsResponse = await geminiService.chat(
      `Extract 5 key points from this summary:\n\n${fullSummary}`
    );

    const keyPoints = keyPointsResponse.text
      .split("\n")
      .filter((line: string) => line.trim())
      .slice(0, 5);

    const summary: DocumentSummary = {
      id: this.generateId(),
      documentId,
      summary: fullSummary,
      keyPoints,
      generatedAt: Date.now(),
    };

    return summary;
  }

  async generateQuiz(
    documentId: string,
    geminiService: any,
    questionCount: number = 5
  ): Promise<DocumentQuiz> {
    const doc = await this.getDocument(documentId);
    if (!doc || !doc.extractedText) {
      throw new Error("Document not found or not processed");
    }

    const chunks = await this.getDocumentChunks(documentId);
    const textSample = chunks
      .slice(0, 3)
      .map((c) => c.text)
      .join("\n\n");

    const response = await geminiService.chat(
      `Generate ${questionCount} quiz questions based on this text. Format each question as:
Q: [question]
A: [answer]
Options: [option1], [option2], [option3], [option4] (if multiple choice)

Text:
${textSample}`
    );

    const questions = this.parseQuizResponse(response.text, questionCount);

    const quiz: DocumentQuiz = {
      id: this.generateId(),
      documentId,
      questions,
      generatedAt: Date.now(),
    };

    return quiz;
  }

  subscribeToProgress(
    documentId: string,
    listener: (progress: DocumentProcessingProgress) => void
  ): () => void {
    this.progressListeners.set(documentId, listener);
    return () => {
      this.progressListeners.delete(documentId);
    };
  }

  private async createDocumentFromPicker(
    file: DocumentPickerResponse
  ): Promise<ImportedDocument> {
    let type: "pdf" | "docx" | "image" = "pdf";

    if (file.type?.includes("pdf")) {
      type = "pdf";
    } else if (
      file.type?.includes("wordprocessingml") ||
      file.name?.endsWith(".docx")
    ) {
      type = "docx";
    } else if (file.type?.includes("image")) {
      type = "image";
    }

    const uri = file.fileCopyUri || file.uri;

    return await this.importDocument(uri, file.name || "Untitled", type);
  }

  private async extractTextFromPDF(
    uri: string,
    documentId: string,
    signal: AbortSignal
  ): Promise<{ text: string; pageCount: number }> {
    return PerformanceMonitor.measureAsync(
      "extract_pdf_text",
      async () => {
        const fileContent = await RNFS.readFile(uri, "base64");
        const pdfDoc = await PDFProcessor.processPDF(documentId, fileContent, {
          chunkSize: 5,
          lazyLoad: false,
        });

        let allText = "";
        let processedPages = 0;

        for (let i = 1; i <= pdfDoc.totalPages; i++) {
          if (signal.aborted) {
            throw new Error("Processing aborted");
          }

          const page = await PDFProcessor.loadPage(documentId, i);
          if (page) {
            allText += page.content + "\n\n";
            processedPages++;

            const progress = (processedPages / pdfDoc.totalPages) * 100;
            await this.updateDocumentStatus(
              documentId,
              "processing",
              progress,
              undefined,
              processedPages,
              pdfDoc.totalPages
            );
          }
        }

        return { text: allText.trim(), pageCount: pdfDoc.totalPages };
      }
    );
  }

  private async extractTextFromDocx(uri: string): Promise<string> {
    return PerformanceMonitor.measureAsync(
      "extract_docx_text",
      async () => {
        const buffer = await RNBlobUtil.fs.readFile(uri, "base64");
        const arrayBuffer = this.base64ToArrayBuffer(buffer);
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      }
    );
  }

  private async extractTextFromImage(uri: string): Promise<string> {
    return `[Image content - OCR not yet implemented for ${uri}]`;
  }

  private async chunkDocument(
    documentId: string,
    text: string,
    pageCount: number
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const words = text.split(/\s+/);
    const totalWords = words.length;
    const wordsPerChunk = Math.ceil(totalWords / Math.ceil(totalWords / CHUNK_SIZE));

    let chunkIndex = 0;
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      const chunkWords = words.slice(i, i + wordsPerChunk);
      const chunkText = chunkWords.join(" ");

      chunks.push({
        id: `${documentId}_chunk_${chunkIndex}`,
        documentId,
        chunkIndex,
        text: chunkText,
        startPage: Math.floor((i / totalWords) * pageCount) + 1,
        endPage: Math.ceil(((i + wordsPerChunk) / totalWords) * pageCount),
        tokenCount: this.estimateTokenCount(chunkText),
      });

      chunkIndex++;
    }

    return chunks;
  }

  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private parseQuizResponse(text: string, count: number): any[] {
    const questions: any[] = [];
    const lines = text.split("\n").filter((l) => l.trim());

    let currentQuestion: any = null;

    for (const line of lines) {
      if (line.startsWith("Q:")) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          id: this.generateId(),
          question: line.replace("Q:", "").trim(),
          options: [],
          answer: "",
        };
      } else if (line.startsWith("A:") && currentQuestion) {
        currentQuestion.answer = line.replace("A:", "").trim();
      } else if (line.startsWith("Options:") && currentQuestion) {
        const options = line
          .replace("Options:", "")
          .split(",")
          .map((o) => o.trim())
          .filter((o) => o);
        currentQuestion.options = options;
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions.slice(0, count);
  }

  private async saveDocument(doc: ImportedDocument): Promise<void> {
    const docs = await this.getDocuments();
    const index = docs.findIndex((d) => d.id === doc.id);

    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.push(doc);
    }

    await StorageService.set(DOCUMENTS_STORAGE_KEY, docs);
  }

  private async saveDocumentChunks(
    documentId: string,
    chunks: DocumentChunk[]
  ): Promise<void> {
    await StorageService.set(`${DOCUMENT_CHUNKS_KEY}_${documentId}`, chunks);
  }

  private async updateDocumentStatus(
    documentId: string,
    status: DocumentProcessingStatus,
    progress: number,
    error?: string,
    currentPage?: number,
    totalPages?: number
  ): Promise<void> {
    const doc = await this.getDocument(documentId);
    if (doc) {
      doc.status = status;
      doc.updatedAt = Date.now();
      await this.saveDocument(doc);
    }

    BackgroundTaskManager.updateTaskProgress(documentId, progress);

    const progressUpdate: DocumentProcessingProgress = {
      documentId,
      status,
      progress,
      currentPage,
      totalPages,
      error,
    };

    const listener = this.progressListeners.get(documentId);
    if (listener) {
      listener(progressUpdate);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default new DocumentService();
