import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Resource } from "../types";
import ResourceService from "../services/ResourceService";
import AnalyticsService from "../services/AnalyticsService";

interface ResourcePanelProps {
  resources: Resource[];
  contextId?: string;
  subject?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export const ResourcePanel: React.FC<ResourcePanelProps> = ({
  resources,
  contextId,
  subject,
  difficulty,
}) => {
  const [allResources, setAllResources] = useState<Resource[]>(resources);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(true);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadResources();
    checkOnlineStatus();
  }, [resources, subject, difficulty]);

  const loadResources = async () => {
    const merged = await ResourceService.mergeWithTeacherResources(
      resources,
      subject,
      difficulty
    );
    setAllResources(merged);
    
    const bookmarks = await ResourceService.getBookmarkedResources();
    const ids = new Set(bookmarks.map(b => b.id));
    setBookmarkedIds(ids);
    
    if (contextId) {
      await ResourceService.cacheResources(contextId, merged);
    }
  };

  const checkOnlineStatus = async () => {
    const online = await ResourceService.isOnline();
    setIsOnline(online);
  };

  const handleOpenResource = async (resource: Resource) => {
    if (!isOnline && resource.url) {
      Alert.alert(
        "Offline Mode",
        "You're currently offline. Resource links require an internet connection.",
        [{ text: "OK" }]
      );
      return;
    }

    if (resource.url) {
      try {
        const supported = await Linking.canOpenURL(resource.url);
        if (supported) {
          await Linking.openURL(resource.url);
          AnalyticsService.track("resource_opened", {
            resource_id: resource.id,
            resource_type: resource.type,
            source: resource.source,
          });
        } else {
          Alert.alert("Error", "Cannot open this URL");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to open resource");
      }
    } else if (resource.authorCitation) {
      Alert.alert(
        "Citation",
        resource.authorCitation,
        [{ text: "OK" }]
      );
    }
  };

  const handleToggleBookmark = async (resource: Resource) => {
    const isBookmarked = bookmarkedIds.has(resource.id);
    
    if (isBookmarked) {
      await ResourceService.unbookmarkResource(resource.id);
      setBookmarkedIds(prev => {
        const updated = new Set(prev);
        updated.delete(resource.id);
        return updated;
      });
      AnalyticsService.track("resource_unbookmarked", {
        resource_id: resource.id,
      });
    } else {
      await ResourceService.bookmarkResource(resource);
      setBookmarkedIds(prev => new Set(prev).add(resource.id));
      AnalyticsService.track("resource_bookmarked", {
        resource_id: resource.id,
      });
    }
  };

  const toggleExpanded = (resourceId: string) => {
    setExpandedResources(prev => {
      const updated = new Set(prev);
      if (updated.has(resourceId)) {
        updated.delete(resourceId);
      } else {
        updated.add(resourceId);
      }
      return updated;
    });
  };

  const getResourceIcon = (type: string): string => {
    switch (type) {
      case "textbook": return "📚";
      case "video": return "🎥";
      case "website": return "🌐";
      case "article": return "📄";
      case "course": return "🎓";
      default: return "📖";
    }
  };

  const getSourceBadge = (source: string): string => {
    return source === "teacher" ? "👨‍🏫 Teacher" : "🤖 AI";
  };

  if (allResources.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 Recommended Resources</Text>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {allResources.map((resource) => {
          const isExpanded = expandedResources.has(resource.id);
          const isBookmarked = bookmarkedIds.has(resource.id);
          
          return (
            <View key={resource.id} style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceIcon}>
                  {getResourceIcon(resource.type)}
                </Text>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle} numberOfLines={2}>
                    {resource.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.resourceType}>
                      {resource.type.toUpperCase()}
                    </Text>
                    <Text style={styles.sourceBadge}>
                      {getSourceBadge(resource.source)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleBookmark(resource)}
                  style={styles.bookmarkButton}
                  testID={`bookmark-${resource.id}`}
                >
                  <Text style={styles.bookmarkIcon}>
                    {isBookmarked ? "⭐" : "☆"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => toggleExpanded(resource.id)}
                style={styles.summaryContainer}
              >
                <Text
                  style={styles.resourceSummary}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {resource.summary}
                </Text>
                <Text style={styles.expandText}>
                  {isExpanded ? "Show less" : "Show more"}
                </Text>
              </TouchableOpacity>

              {resource.authorCitation && (
                <Text style={styles.citation} numberOfLines={1}>
                  📝 {resource.authorCitation}
                </Text>
              )}

              {resource.url && (
                <TouchableOpacity
                  style={[styles.openButton, !isOnline && styles.openButtonDisabled]}
                  onPress={() => handleOpenResource(resource)}
                  testID={`open-${resource.id}`}
                >
                  <Text style={styles.openButtonText}>
                    {isOnline ? "Open Resource →" : "Offline - View Later"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  offlineBadge: {
    backgroundColor: "#FFE0B2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offlineText: {
    fontSize: 12,
    color: "#F57C00",
    fontWeight: "600",
  },
  scrollView: {
    maxHeight: 400,
  },
  resourceCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  resourceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  resourceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resourceType: {
    fontSize: 11,
    color: "#666",
    backgroundColor: "#e8f4fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "600",
  },
  sourceBadge: {
    fontSize: 11,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bookmarkButton: {
    padding: 4,
  },
  bookmarkIcon: {
    fontSize: 24,
  },
  summaryContainer: {
    marginBottom: 8,
  },
  resourceSummary: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  expandText: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 4,
    fontWeight: "600",
  },
  citation: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 8,
  },
  openButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  openButtonDisabled: {
    backgroundColor: "#ccc",
  },
  openButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
