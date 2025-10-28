import AsyncStorage from "@react-native-async-storage/async-storage";
import { Resource, BookmarkedResource, ResourceType, ResourceSource } from "../types";
import NetInfo from "@react-native-community/netinfo";

class ResourceService {
  private BOOKMARKS_KEY = "@bookmarked_resources";
  private TEACHER_RESOURCES_KEY = "@teacher_resources";
  private CACHED_RESOURCES_KEY = "@cached_resources";

  async bookmarkResource(resource: Resource, notes?: string, tags?: string[]): Promise<BookmarkedResource> {
    const bookmarked: BookmarkedResource = {
      ...resource,
      bookmarkedAt: Date.now(),
      notes,
      tags,
    };

    const bookmarks = await this.getBookmarkedResources();
    const updated = [...bookmarks.filter(b => b.id !== resource.id), bookmarked];
    
    await AsyncStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(updated));
    return bookmarked;
  }

  async unbookmarkResource(resourceId: string): Promise<void> {
    const bookmarks = await this.getBookmarkedResources();
    const updated = bookmarks.filter(b => b.id !== resourceId);
    await AsyncStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(updated));
  }

  async getBookmarkedResources(): Promise<BookmarkedResource[]> {
    try {
      const data = await AsyncStorage.getItem(this.BOOKMARKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load bookmarked resources:", error);
      return [];
    }
  }

  async isBookmarked(resourceId: string): Promise<boolean> {
    const bookmarks = await this.getBookmarkedResources();
    return bookmarks.some(b => b.id === resourceId);
  }

  async addTeacherResource(
    title: string,
    type: ResourceType,
    url: string,
    summary: string,
    subject?: string,
    difficulty?: "easy" | "medium" | "hard",
    metadata?: any
  ): Promise<Resource> {
    const resource: Resource = {
      id: `teacher_${Date.now()}`,
      title,
      type,
      url,
      summary,
      subject,
      difficulty,
      source: "teacher" as ResourceSource,
      createdAt: Date.now(),
      metadata,
    };

    const resources = await this.getTeacherResources();
    resources.push(resource);
    await AsyncStorage.setItem(this.TEACHER_RESOURCES_KEY, JSON.stringify(resources));
    
    return resource;
  }

  async getTeacherResources(): Promise<Resource[]> {
    try {
      const data = await AsyncStorage.getItem(this.TEACHER_RESOURCES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load teacher resources:", error);
      return [];
    }
  }

  async deleteTeacherResource(resourceId: string): Promise<void> {
    const resources = await this.getTeacherResources();
    const updated = resources.filter(r => r.id !== resourceId);
    await AsyncStorage.setItem(this.TEACHER_RESOURCES_KEY, JSON.stringify(updated));
  }

  async cacheResources(contextId: string, resources: Resource[]): Promise<void> {
    try {
      const cached = await this.getCachedResources();
      cached[contextId] = {
        resources,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(this.CACHED_RESOURCES_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error("Failed to cache resources:", error);
    }
  }

  async getCachedResourcesForContext(contextId: string): Promise<Resource[] | null> {
    try {
      const cached = await this.getCachedResources();
      const entry = cached[contextId];
      
      if (!entry) {return null;}
      
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - entry.cachedAt > ONE_WEEK) {
        return null;
      }
      
      return entry.resources;
    } catch (error) {
      console.error("Failed to get cached resources:", error);
      return null;
    }
  }

  private async getCachedResources(): Promise<Record<string, { resources: Resource[]; cachedAt: number }>> {
    try {
      const data = await AsyncStorage.getItem(this.CACHED_RESOURCES_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  async mergeWithTeacherResources(
    aiResources: Resource[],
    subject?: string,
    difficulty?: "easy" | "medium" | "hard"
  ): Promise<Resource[]> {
    const teacherResources = await this.getTeacherResources();
    
    const filtered = teacherResources.filter(r => {
      if (subject && r.subject && r.subject !== subject) {return false;}
      if (difficulty && r.difficulty && r.difficulty !== difficulty) {return false;}
      return true;
    });
    
    return [...aiResources, ...filtered];
  }

  convertToResource(
    rawResource: {
      title: string;
      type: string;
      url: string;
      summary: string;
      citation?: string;
    },
    subject?: string,
    difficulty?: "easy" | "medium" | "hard"
  ): Resource {
    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: rawResource.title,
      type: this.normalizeResourceType(rawResource.type),
      url: rawResource.url,
      summary: rawResource.summary,
      subject,
      difficulty,
      source: "ai" as ResourceSource,
      authorCitation: rawResource.citation,
      createdAt: Date.now(),
    };
  }

  private normalizeResourceType(type: string): ResourceType {
    const normalized = type.toLowerCase();
    if (["textbook", "book"].includes(normalized)) {return "textbook";}
    if (["video", "youtube", "tutorial"].includes(normalized)) {return "video";}
    if (["website", "site", "web"].includes(normalized)) {return "website";}
    if (["article", "blog", "post"].includes(normalized)) {return "article";}
    if (["course", "mooc", "class"].includes(normalized)) {return "course";}
    return "website";
  }
}

export default new ResourceService();
