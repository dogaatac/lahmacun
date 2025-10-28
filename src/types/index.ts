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
  remindersEnabled?: boolean;
  calendarSyncEnabled?: boolean;
  reminderSettings?: ReminderSettings;
}

export interface ReminderSettings {
  defaultReminderTime: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  reminderDays: number[];
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

export interface StudySession {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  startTime: number;
  endTime: number;
  notificationId?: string;
  calendarEventId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReminderNotification {
  id: string;
  sessionId: string;
  scheduledTime: number;
  notificationId: string;
  status: "scheduled" | "sent" | "cancelled";
  createdAt: number;
}

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: "granted" | "denied" | "undetermined";
}

export interface StudentSession {
  id: string;
  studentId: string;
  studentName: string;
  problemId: string;
  problemTitle: string;
  subject?: string;
  difficulty?: "easy" | "medium" | "hard";
  startTime: number;
  endTime?: number;
  completed: boolean;
  accuracy?: number;
  flaggedDifficulties: string[];
  solution?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SessionAnnotation {
  id: string;
  sessionId: string;
  teacherId: string;
  type: "text" | "highlight" | "note" | "correction";
  content: string;
  position?: { x: number; y: number };
  sharedWithStudent: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TeacherFeedback {
  id: string;
  sessionId: string;
  teacherId: string;
  type: "audio" | "video" | "text";
  content?: string;
  filePath?: string;
  duration?: number;
  sharedWithStudent: boolean;
  createdAt: number;
}

export interface FollowUpTask {
  id: string;
  sessionId: string;
  studentId: string;
  title: string;
  description: string;
  subject?: string;
  difficulty?: "easy" | "medium" | "hard";
  dueDate?: number;
  completed: boolean;
  assignedBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface StudyPlan {
  id: string;
  studentId: string;
  tasks: FollowUpTask[];
  createdAt: number;
  updatedAt: number;
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  pinHash?: string;
  biometricEnabled: boolean;
  students: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ImportedDocument {
  id: string;
  name: string;
  type: "pdf" | "docx" | "image";
  uri: string;
  size: number;
  pageCount?: number;
  status: DocumentProcessingStatus;
  extractedText?: string;
  chunks?: DocumentChunk[];
  thumbnailUri?: string;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  startPage?: number;
  endPage?: number;
  tokenCount?: number;
}

export type DocumentProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "paused";

export interface DocumentProcessingProgress {
  documentId: string;
  status: DocumentProcessingStatus;
  progress: number;
  currentPage?: number;
  totalPages?: number;
  error?: string;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: Date;
  modificationDate?: Date;
}

export interface DocumentSummary {
  id: string;
  documentId: string;
  summary: string;
  keyPoints: string[];
  generatedAt: number;
}

export interface DocumentQuiz {
  id: string;
  documentId: string;
  questions: QuizQuestion[];
  generatedAt: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export type ResourceType = "textbook" | "video" | "website" | "article" | "course";

export type ResourceSource = "ai" | "teacher";

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  summary: string;
  subject?: string;
  difficulty?: "easy" | "medium" | "hard";
  source: ResourceSource;
  authorCitation?: string;
  createdAt: number;
  metadata?: {
    duration?: string;
    pageCount?: number;
    language?: string;
    [key: string]: any;
  };
}

export interface BookmarkedResource extends Resource {
  bookmarkedAt: number;
  notes?: string;
  tags?: string[];
}

export interface ResourceRecommendations {
  id: string;
  problemId?: string;
  contextId?: string;
  resources: Resource[];
  generatedAt: number;
  cached: boolean;
}

export type ExplanationMode = "eli5" | "standard" | "advanced";
export type ExplanationDepth = "brief" | "normal" | "detailed";
export type ExplanationTone = "casual" | "formal" | "technical";

export interface ExplanationPreferences {
  mode: ExplanationMode;
  depth?: ExplanationDepth;
  tone?: ExplanationTone;
}

export interface CachedExplanation {
  content: string;
  mode: ExplanationMode;
  depth?: ExplanationDepth;
  tone?: ExplanationTone;
  generatedAt: number;
}
