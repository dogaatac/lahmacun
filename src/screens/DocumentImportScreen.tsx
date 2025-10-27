import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  ImportedDocument,
  DocumentProcessingProgress,
} from "../types";
import DocumentService from "../services/DocumentService";

export const DocumentImportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [documents, setDocuments] = useState<ImportedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState<
    Map<string, DocumentProcessingProgress>
  >(new Map());

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [])
  );

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await DocumentService.getDocuments();
      setDocuments(docs);
    } catch (error: any) {
      Alert.alert("Error", `Failed to load documents: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleImport = async () => {
    try {
      const doc = await DocumentService.pickDocument();
      if (doc) {
        await loadDocuments();
        await processDocument(doc.id);
      }
    } catch (error: any) {
      Alert.alert("Import Error", error.message);
    }
  };

  const processDocument = async (documentId: string) => {
    const unsubscribe = DocumentService.subscribeToProgress(
      documentId,
      (progress) => {
        setProcessingDocuments((prev) => {
          const newMap = new Map(prev);
          newMap.set(documentId, progress);
          return newMap;
        });

        if (progress.status === "completed" || progress.status === "failed") {
          loadDocuments();
        }
      }
    );

    try {
      await DocumentService.processDocument(documentId);
    } catch (error: any) {
      Alert.alert("Processing Error", error.message);
    } finally {
      unsubscribe();
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await DocumentService.deleteDocument(documentId);
              await loadDocuments();
            } catch (error: any) {
              Alert.alert("Error", `Failed to delete: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleDocumentPress = (doc: ImportedDocument) => {
    if (doc.status === "completed") {
      navigation.navigate("DocumentDetail" as never, { documentId: doc.id } as never);
    } else if (doc.status === "pending") {
      Alert.alert(
        "Process Document",
        "This document hasn't been processed yet. Process it now?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Process",
            onPress: () => processDocument(doc.id),
          },
        ]
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "processing":
        return "#2196F3";
      case "failed":
        return "#F44336";
      case "paused":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderDocument = ({ item }: { item: ImportedDocument }) => {
    const progress = processingDocuments.get(item.id);

    return (
      <TouchableOpacity
        style={styles.documentItem}
        onPress={() => handleDocumentPress(item)}
        onLongPress={() => handleDeleteDocument(item.id)}
      >
        <View style={styles.documentIcon}>
          <Text style={styles.documentIconText}>
            {item.type === "pdf" ? "📄" : item.type === "docx" ? "📝" : "🖼️"}
          </Text>
        </View>

        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.documentMeta}>
            {formatFileSize(item.size)}
            {item.pageCount ? ` • ${item.pageCount} pages` : ""}
          </Text>

          {progress && progress.status === "processing" && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress.progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {progress.currentPage && progress.totalPages
                  ? `${progress.currentPage}/${progress.totalPages}`
                  : `${Math.round(progress.progress)}%`}
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Documents</Text>
        <TouchableOpacity style={styles.importButton} onPress={handleImport}>
          <Text style={styles.importButtonText}>+ Import</Text>
        </TouchableOpacity>
      </View>

      {documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>No documents yet</Text>
          <Text style={styles.emptySubtext}>
            Tap Import to add PDFs, Word documents, or images
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleImport}
          >
            <Text style={styles.emptyButtonText}>Import Document</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderDocument}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  importButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  importButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 24,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 14,
    color: "#666",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2196F3",
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
