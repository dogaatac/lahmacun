import StorageService from "./StorageService";
import IAPService from "./IAPService";
import { UserSubscription, SubscriptionTier, IAPProduct } from "../types";

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "free",
    name: "Free",
    description: "Basic features for casual learners",
    features: [
      "5 problems per day",
      "Basic step-by-step solutions",
      "Access to community forum",
    ],
  },
  {
    id: "premium",
    name: "Pro Monthly",
    description: "Enhanced learning experience",
    price: "$9.99/month",
    features: [
      "Unlimited problems",
      "Detailed explanations",
      "Practice quizzes",
      "Progress tracking",
      "No ads",
    ],
  },
  {
    id: "pro",
    name: "Tutor Pack",
    description: "Complete learning platform with AI tutor",
    price: "$19.99/month",
    features: [
      "All Pro Monthly features",
      "AI Tutor chat (unlimited)",
      "Teacher mode",
      "Advanced analytics",
      "Export capabilities",
      "API access",
      "Priority support",
    ],
  },
];

const PRODUCT_ID_TO_TIER: Record<string, "free" | "premium" | "pro"> = {
  "com.studymate.pro.monthly": "premium",
  "com.studymate.tutor.pack": "pro",
};

export class SubscriptionService {
  private readonly STORAGE_KEY_SUBSCRIPTION = "user_subscription";

  async initializeIAP(): Promise<void> {
    try {
      await IAPService.initialize();
    } catch (error) {
      console.error("Failed to initialize IAP:", error);
    }
  }

  async getSubscription(): Promise<UserSubscription> {
    try {
      const iapSubscription = await IAPService.getCurrentSubscription();
      if (iapSubscription) {
        await StorageService.set(this.STORAGE_KEY_SUBSCRIPTION, iapSubscription);
        return iapSubscription;
      }
    } catch (error) {
      console.error("Failed to get IAP subscription:", error);
    }

    const subscription = await StorageService.get<UserSubscription>(
      this.STORAGE_KEY_SUBSCRIPTION
    );

    if (!subscription) {
      return this.createDefaultSubscription();
    }

    return subscription;
  }

  async getAvailableProducts(): Promise<IAPProduct[]> {
    try {
      return await IAPService.getAvailableProducts();
    } catch (error) {
      console.error("Failed to get available products:", error);
      return [];
    }
  }

  async getTier(
    tierId: "free" | "premium" | "pro"
  ): Promise<SubscriptionTier | undefined> {
    return SUBSCRIPTION_TIERS.find((tier) => tier.id === tierId);
  }

  async getAllTiers(): Promise<SubscriptionTier[]> {
    return SUBSCRIPTION_TIERS;
  }

  async purchaseSubscription(productId: string): Promise<boolean> {
    try {
      await IAPService.purchaseProduct(productId);
      return true;
    } catch (error) {
      console.error("Purchase failed:", error);
      return false;
    }
  }

  async restorePurchases(): Promise<UserSubscription | null> {
    try {
      const restored = await IAPService.restorePurchases();
      if (restored) {
        await StorageService.set(this.STORAGE_KEY_SUBSCRIPTION, restored);
      }
      return restored;
    } catch (error) {
      console.error("Restore purchases failed:", error);
      return null;
    }
  }

  async updateSubscription(tier: "free" | "premium" | "pro"): Promise<void> {
    const currentSubscription = await this.getSubscription();
    const updatedSubscription: UserSubscription = {
      ...currentSubscription,
      tier,
      status: "active",
      startDate: Date.now(),
      endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    await StorageService.set(
      this.STORAGE_KEY_SUBSCRIPTION,
      updatedSubscription
    );
  }

  async cancelSubscription(): Promise<void> {
    const currentSubscription = await this.getSubscription();
    const updatedSubscription: UserSubscription = {
      ...currentSubscription,
      status: "cancelled",
      autoRenew: false,
    };

    await StorageService.set(
      this.STORAGE_KEY_SUBSCRIPTION,
      updatedSubscription
    );
  }

  async checkEntitlement(feature: string): Promise<boolean> {
    try {
      const { isActive, isInGracePeriod } = await IAPService.checkSubscriptionStatus();
      
      if (!isActive && !isInGracePeriod) {
        return false;
      }

      return await this.isFeatureAvailable(feature);
    } catch (error) {
      console.error("Entitlement check failed:", error);
      return false;
    }
  }

  async isFeatureAvailable(feature: string): Promise<boolean> {
    const subscription = await this.getSubscription();
    const tier = await this.getTier(subscription.tier);

    if (!tier) {
      return false;
    }

    return tier.features.some((f) =>
      f.toLowerCase().includes(feature.toLowerCase())
    );
  }

  async hasPremiumAccess(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription.tier === "premium" || subscription.tier === "pro";
  }

  async hasProAccess(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription.tier === "pro";
  }

  getTierForProductId(productId: string): "free" | "premium" | "pro" {
    return PRODUCT_ID_TO_TIER[productId] || "free";
  }

  private createDefaultSubscription(): UserSubscription {
    return {
      tier: "free",
      status: "active",
      autoRenew: false,
    };
  }
}

export default new SubscriptionService();
