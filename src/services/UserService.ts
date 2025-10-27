import StorageService from "./StorageService";
import { UserProfile, APIKey } from "../types";

export class UserService {
  private readonly STORAGE_KEY_PROFILE = "user_profile";
  private readonly STORAGE_KEY_API_KEY = "user_api_key";

  async getProfile(): Promise<UserProfile | null> {
    return await StorageService.get<UserProfile>(this.STORAGE_KEY_PROFILE);
  }

  async createProfile(
    name: string,
    email: string,
    goals: string[],
    subjects: string[]
  ): Promise<UserProfile> {
    const profile: UserProfile = {
      id: this.generateUserId(),
      name,
      email,
      goals,
      subjects,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await StorageService.set(this.STORAGE_KEY_PROFILE, profile);
    return profile;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const currentProfile = await this.getProfile();
    if (!currentProfile) {
      throw new Error("No profile found");
    }

    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: Date.now(),
    };

    await StorageService.set(this.STORAGE_KEY_PROFILE, updatedProfile);
    return updatedProfile;
  }

  async updateGoals(goals: string[]): Promise<UserProfile> {
    return await this.updateProfile({ goals });
  }

  async updateSubjects(subjects: string[]): Promise<UserProfile> {
    return await this.updateProfile({ subjects });
  }

  async getAPIKey(): Promise<APIKey | null> {
    return await StorageService.get<APIKey>(this.STORAGE_KEY_API_KEY);
  }

  async generateAPIKey(): Promise<APIKey> {
    const apiKey: APIKey = {
      key: this.generateRandomKey(),
      createdAt: Date.now(),
    };

    await StorageService.set(this.STORAGE_KEY_API_KEY, apiKey);
    return apiKey;
  }

  async rotateAPIKey(): Promise<APIKey> {
    return await this.generateAPIKey();
  }

  async updateAPIKeyUsage(): Promise<void> {
    const apiKey = await this.getAPIKey();
    if (apiKey) {
      apiKey.lastUsed = Date.now();
      await StorageService.set(this.STORAGE_KEY_API_KEY, apiKey);
    }
  }

  async deleteProfile(): Promise<void> {
    await StorageService.remove(this.STORAGE_KEY_PROFILE);
    await StorageService.remove(this.STORAGE_KEY_API_KEY);
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateRandomKey(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "sk_";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }
}

export default new UserService();
