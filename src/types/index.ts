export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  goals: string[];
  subjects: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  theme: "light" | "dark" | "auto";
  language: string;
  notificationsEnabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  privacyMode: boolean;
  analyticsConsent: boolean;
  teacherMode: boolean;
  autoBackup: boolean;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  features: string[];
  price?: string;
}

export interface UserSubscription {
  tier: "free" | "premium" | "pro";
  status: "active" | "expired" | "cancelled";
  startDate?: number;
  endDate?: number;
  autoRenew: boolean;
}

export interface APIKey {
  key: string;
  createdAt: number;
  lastUsed?: number;
  expiresAt?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: number;
}

export interface MasterySnapshot {
  totalProblems: number;
  totalQuizzes: number;
  averageAccuracy: number;
  streak: number;
  level: number;
  xp: number;
  subjects: Record<string, number>; // subject -> mastery percentage
}
