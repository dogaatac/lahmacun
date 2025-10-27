import PerformanceMonitor from "./PerformanceMonitor";

export interface PDFPage {
  pageNumber: number;
  content: string;
  images?: string[];
}

export interface PDFDocument {
  id: string;
  totalPages: number;
  pages: Map<number, PDFPage>;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
}

export interface PDFProcessingOptions {
  chunkSize?: number;
  lazyLoad?: boolean;
  maxConcurrentPages?: number;
}

class PDFProcessor {
  private documents: Map<string, PDFDocument> = new Map();
  private loadedPages: Set<string> = new Set();

  async processPDF(
    documentId: string,
    data: string,
    options?: PDFProcessingOptions
  ): Promise<PDFDocument> {
    const chunkSize = options?.chunkSize || 5;
    const lazyLoad = options?.lazyLoad !== false;

    PerformanceMonitor.startMeasure(`pdf_process_${documentId}`);

    try {
      const totalPages = this.estimatePageCount(data);

      const document: PDFDocument = {
        id: documentId,
        totalPages,
        pages: new Map(),
        metadata: this.extractMetadata(data),
      };

      if (!lazyLoad) {
        await this.loadAllPages(document, data, chunkSize);
      } else {
        await this.loadInitialPages(document, data, chunkSize);
      }

      this.documents.set(documentId, document);

      PerformanceMonitor.endMeasure(`pdf_process_${documentId}`, {
        totalPages,
        lazyLoad,
      });

      return document;
    } catch (error) {
      PerformanceMonitor.endMeasure(`pdf_process_${documentId}`, {
        error: (error as Error).message,
      });
      throw new Error(`Failed to process PDF: ${(error as Error).message}`);
    }
  }

  async loadPage(
    documentId: string,
    pageNumber: number
  ): Promise<PDFPage | null> {
    const document = this.documents.get(documentId);
    if (!document) {
      console.warn(`[PDFProcessor] Document not found: ${documentId}`);
      return null;
    }

    const cacheKey = `${documentId}_${pageNumber}`;
    if (this.loadedPages.has(cacheKey)) {
      return document.pages.get(pageNumber) || null;
    }

    PerformanceMonitor.startMeasure(`pdf_load_page_${pageNumber}`);

    try {
      const page = await this.loadPageFromData(documentId, pageNumber);
      if (page) {
        document.pages.set(pageNumber, page);
        this.loadedPages.add(cacheKey);
      }

      PerformanceMonitor.endMeasure(`pdf_load_page_${pageNumber}`, {
        documentId,
        pageNumber,
      });

      return page;
    } catch (error) {
      PerformanceMonitor.endMeasure(`pdf_load_page_${pageNumber}`, {
        error: (error as Error).message,
      });
      return null;
    }
  }

  async loadPageRange(
    documentId: string,
    startPage: number,
    endPage: number
  ): Promise<PDFPage[]> {
    const pages: PDFPage[] = [];

    for (let i = startPage; i <= endPage; i++) {
      const page = await this.loadPage(documentId, i);
      if (page) {
        pages.push(page);
      }
    }

    return pages;
  }

  unloadPage(documentId: string, pageNumber: number): void {
    const document = this.documents.get(documentId);
    if (!document) {
      return;
    }

    document.pages.delete(pageNumber);
    this.loadedPages.delete(`${documentId}_${pageNumber}`);
  }

  unloadPageRange(
    documentId: string,
    startPage: number,
    endPage: number
  ): void {
    for (let i = startPage; i <= endPage; i++) {
      this.unloadPage(documentId, i);
    }
  }

  getDocument(documentId: string): PDFDocument | null {
    return this.documents.get(documentId) || null;
  }

  unloadDocument(documentId: string): void {
    const document = this.documents.get(documentId);
    if (!document) {
      return;
    }

    for (let i = 1; i <= document.totalPages; i++) {
      this.loadedPages.delete(`${documentId}_${i}`);
    }

    this.documents.delete(documentId);
  }

  getLoadedPageCount(documentId: string): number {
    const document = this.documents.get(documentId);
    return document ? document.pages.size : 0;
  }

  getMemoryUsage(): { documents: number; pages: number } {
    let totalPages = 0;
    this.documents.forEach((doc) => {
      totalPages += doc.pages.size;
    });

    return {
      documents: this.documents.size,
      pages: totalPages,
    };
  }

  private estimatePageCount(data: string): number {
    const avgCharsPerPage = 2000;
    return Math.ceil(data.length / avgCharsPerPage);
  }

  private extractMetadata(data: string): PDFDocument["metadata"] {
    return {
      title: "Document",
      author: "Unknown",
      creationDate: new Date(),
    };
  }

  private async loadInitialPages(
    document: PDFDocument,
    data: string,
    chunkSize: number
  ): Promise<void> {
    const pagesToLoad = Math.min(chunkSize, document.totalPages);

    for (let i = 1; i <= pagesToLoad; i++) {
      await this.simulatePageLoad(document, i, data);
    }
  }

  private async loadAllPages(
    document: PDFDocument,
    data: string,
    chunkSize: number
  ): Promise<void> {
    const chunks = Math.ceil(document.totalPages / chunkSize);

    for (let chunk = 0; chunk < chunks; chunk++) {
      const startPage = chunk * chunkSize + 1;
      const endPage = Math.min((chunk + 1) * chunkSize, document.totalPages);

      const promises: Promise<void>[] = [];
      for (let i = startPage; i <= endPage; i++) {
        promises.push(this.simulatePageLoad(document, i, data));
      }

      await Promise.all(promises);
    }
  }

  private async loadPageFromData(
    documentId: string,
    pageNumber: number
  ): Promise<PDFPage | null> {
    await new Promise((resolve) => setTimeout(resolve, 10));

    return {
      pageNumber,
      content: `Content of page ${pageNumber}`,
      images: [],
    };
  }

  private async simulatePageLoad(
    document: PDFDocument,
    pageNumber: number,
    data: string
  ): Promise<void> {
    const chunkSize = Math.ceil(data.length / document.totalPages);
    const startIndex = (pageNumber - 1) * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, data.length);

    const page: PDFPage = {
      pageNumber,
      content: data.substring(startIndex, endIndex),
      images: [],
    };

    document.pages.set(pageNumber, page);
    this.loadedPages.add(`${document.id}_${pageNumber}`);
  }
}

export default new PDFProcessor();
