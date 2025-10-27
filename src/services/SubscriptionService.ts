import StorageService from "./StorageService";
import { UserSubscription, SubscriptionTier } from "../types";

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
    name: "Premium",
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
    name: "Pro",
    description: "Complete learning platform",
    price: "$19.99/month",
    features: [
      "All Premium features",
      "Teacher mode",
      "Advanced analytics",
      "Export capabilities",
      "API access",
      "Priority support",
    ],
  },
];

export class SubscriptionService {
  private readonly STORAGE_KEY_SUBSCRIPTION = "user_subscription";

  async getSubscription(): Promise<UserSubscription> {
    const subscription = await StorageService.get<UserSubscription>(
      this.STORAGE_KEY_SUBSCRIPTION
    );

    if (!subscription) {
      return this.createDefaultSubscription();
    }

    return subscription;
  }

  async getTier(
    tierId: "free" | "premium" | "pro"
  ): Promise<SubscriptionTier | undefined> {
    return SUBSCRIPTION_TIERS.find((tier) => tier.id === tierId);
  }

  async getAllTiers(): Promise<SubscriptionTier[]> {
    return SUBSCRIPTION_TIERS;
  }

  async updateSubscription(tier: "free" | "premium" | "pro"): Promise<void> {
    const currentSubscription = await this.getSubscription();
    const updatedSubscription: UserSubscription = {
      ...currentSubscription,
      tier,
      status: "active",
      startDate: Date.now(),
      endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
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

  private createDefaultSubscription(): UserSubscription {
    return {
      tier: "free",
      status: "active",
      autoRenew: false,
    };
  }
}

export default new SubscriptionService();
