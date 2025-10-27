import AsyncStorage from "@react-native-async-storage/async-storage";
import StorageService from "./StorageService";
import { TeacherProfile } from "../types";

class TeacherModeService {
  private teacherModeKey = "teacher_mode_active";
  private teacherPinKey = "teacher_pin";
  private teacherProfileKey = "teacher_profile";

  async isTeacherModeActive(): Promise<boolean> {
    const active = await StorageService.get<boolean>(this.teacherModeKey);
    return active === true;
  }

  async setTeacherModeActive(active: boolean): Promise<void> {
    await StorageService.set(this.teacherModeKey, active);
  }

  async hasPin(): Promise<boolean> {
    const pin = await StorageService.get<string>(this.teacherPinKey);
    return pin !== null;
  }

  async setPin(pin: string): Promise<void> {
    const hash = this.hashPin(pin);
    await StorageService.set(this.teacherPinKey, hash);
  }

  async verifyPin(pin: string): Promise<boolean> {
    const storedHash = await StorageService.get<string>(this.teacherPinKey);
    if (!storedHash) {
      return false;
    }
    const inputHash = this.hashPin(pin);
    return inputHash === storedHash;
  }

  async createTeacherProfile(
    name: string,
    email: string,
    pin: string
  ): Promise<TeacherProfile> {
    const profile: TeacherProfile = {
      id: this.generateId(),
      name,
      email,
      pinHash: this.hashPin(pin),
      biometricEnabled: false,
      students: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.setPin(pin);
    await StorageService.set(this.teacherProfileKey, profile);
    return profile;
  }

  async getTeacherProfile(): Promise<TeacherProfile | null> {
    return await StorageService.get<TeacherProfile>(this.teacherProfileKey);
  }

  async updateTeacherProfile(
    updates: Partial<TeacherProfile>
  ): Promise<TeacherProfile> {
    const profile = await this.getTeacherProfile();
    if (!profile) {
      throw new Error("Teacher profile not found");
    }

    const updated: TeacherProfile = {
      ...profile,
      ...updates,
      id: profile.id,
      createdAt: profile.createdAt,
      updatedAt: Date.now(),
    };

    await StorageService.set(this.teacherProfileKey, updated);
    return updated;
  }

  async enableTeacherMode(pin: string): Promise<boolean> {
    const isValid = await this.verifyPin(pin);
    if (isValid) {
      await this.setTeacherModeActive(true);
      return true;
    }
    return false;
  }

  async disableTeacherMode(): Promise<void> {
    await this.setTeacherModeActive(false);
  }

  async addStudent(studentId: string): Promise<void> {
    const profile = await this.getTeacherProfile();
    if (!profile) {
      throw new Error("Teacher profile not found");
    }

    if (!profile.students.includes(studentId)) {
      profile.students.push(studentId);
      await this.updateTeacherProfile({ students: profile.students });
    }
  }

  async removeStudent(studentId: string): Promise<void> {
    const profile = await this.getTeacherProfile();
    if (!profile) {
      throw new Error("Teacher profile not found");
    }

    profile.students = profile.students.filter((id) => id !== studentId);
    await this.updateTeacherProfile({ students: profile.students });
  }

  private hashPin(pin: string): string {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  private generateId(): string {
    return `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new TeacherModeService();
