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
  status: "active" | "expired" | "cancelled" | "grace_period";
  startDate?: number;
  endDate?: number;
  autoRenew: boolean;
  productId?: string;
  transactionId?: string;
  originalTransactionId?: string;
  purchaseToken?: string;
  isInGracePeriod?: boolean;
  gracePeriodEndDate?: number;
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

export interface IAPProduct {
  productId: string;
  price: string;
  currency: string;
  localizedPrice: string;
  title: string;
  description: string;
  type: "subscription" | "iap";
}

export interface PurchaseReceipt {
  transactionId: string;
  transactionDate: number;
  productId: string;
  transactionReceipt: string;
  purchaseToken?: string;
  dataAndroid?: string;
  signatureAndroid?: string;
  originalTransactionDateIOS?: string;
  originalTransactionIdentifierIOS?: string;
}

export interface EntitlementCheck {
  isEntitled: boolean;
  tier: "free" | "premium" | "pro";
  expiryDate?: number;
  isInGracePeriod: boolean;
}
