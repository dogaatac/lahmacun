import DocumentService from "../DocumentService";
import StorageService from "../StorageService";
import { ImportedDocument } from "../../types";

jest.mock("react-native-document-picker", () => ({
  pick: jest.fn(),
  types: {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    images: "image/*",
  },
  isCancel: jest.fn(),
}));

jest.mock("react-native-fs", () => ({
  stat: jest.fn(),
  exists: jest.fn(),
  unlink: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock("react-native-blob-util", () => ({
  fs: {
    readFile: jest.fn(),
  },
}));

jest.mock("mammoth", () => ({
  extractRawText: jest.fn(),
}));

jest.mock("../StorageService");
jest.mock("../../utils/PermissionsHelper", () => ({
  ensureStoragePermission: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../utils/BackgroundTaskManager", () => ({
  registerTask: jest.fn(),
  updateTaskProgress: jest.fn(),
  updateTaskStatus: jest.fn(),
  removeTask: jest.fn(),
}));

describe("DocumentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("importDocument", () => {
    it("should create a new document", async () => {
      const mockDoc: ImportedDocument = {
        id: "test-id",
        name: "Test Document",
        type: "pdf",
        uri: "file://test.pdf",
        size: 1024,
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      (StorageService.get as jest.Mock).mockResolvedValue([]);
      (StorageService.set as jest.Mock).mockResolvedValue(undefined);

      const doc = await DocumentService.importDocument(
        "file://test.pdf",
        "Test Document",
        "pdf"
      );

      expect(doc).toBeDefined();
      expect(doc.name).toBe("Test Document");
      expect(doc.type).toBe("pdf");
      expect(doc.status).toBe("pending");
    });
  });

  describe("getDocuments", () => {
    it("should return empty array when no documents exist", async () => {
      (StorageService.get as jest.Mock).mockResolvedValue(null);

      const docs = await DocumentService.getDocuments();

      expect(docs).toEqual([]);
    });

    it("should return stored documents", async () => {
      const mockDocs: ImportedDocument[] = [
        {
          id: "1",
          name: "Doc 1",
          type: "pdf",
          uri: "file://doc1.pdf",
          size: 1024,
          status: "completed",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastAccessedAt: Date.now(),
        },
      ];

      (StorageService.get as jest.Mock).mockResolvedValue(mockDocs);

      const docs = await DocumentService.getDocuments();

      expect(docs).toEqual(mockDocs);
      expect(docs).toHaveLength(1);
    });
  });

  describe("getDocument", () => {
    it("should return a specific document", async () => {
      const mockDoc: ImportedDocument = {
        id: "1",
        name: "Doc 1",
        type: "pdf",
        uri: "file://doc1.pdf",
        size: 1024,
        status: "completed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      (StorageService.get as jest.Mock).mockResolvedValue([mockDoc]);

      const doc = await DocumentService.getDocument("1");

      expect(doc).toEqual(mockDoc);
    });

    it("should return null for non-existent document", async () => {
      (StorageService.get as jest.Mock).mockResolvedValue([]);

      const doc = await DocumentService.getDocument("non-existent");

      expect(doc).toBeNull();
    });
  });

  describe("deleteDocument", () => {
    it("should delete a document", async () => {
      const mockDoc: ImportedDocument = {
        id: "1",
        name: "Doc 1",
        type: "pdf",
        uri: "file://doc1.pdf",
        size: 1024,
        status: "completed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      (StorageService.get as jest.Mock).mockResolvedValue([mockDoc]);
      (StorageService.set as jest.Mock).mockResolvedValue(undefined);
      (StorageService.remove as jest.Mock).mockResolvedValue(undefined);

      const RNFS = require("react-native-fs");
      RNFS.exists.mockResolvedValue(true);
      RNFS.unlink.mockResolvedValue(undefined);

      await DocumentService.deleteDocument("1");

      expect(StorageService.remove).toHaveBeenCalled();
      expect(StorageService.set).toHaveBeenCalled();
    });
  });

  describe("subscribeToProgress", () => {
    it("should subscribe and unsubscribe to progress updates", () => {
      const listener = jest.fn();

      const unsubscribe = DocumentService.subscribeToProgress("1", listener);

      expect(typeof unsubscribe).toBe("function");

      unsubscribe();
    });
  });
});
