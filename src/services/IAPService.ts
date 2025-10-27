import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Purchase,
  PurchaseError,
  Product,
} from "react-native-iap";
import { Platform, Alert } from "react-native";
import StorageService from "./StorageService";
import { IAPProduct, PurchaseReceipt, UserSubscription } from "../types";

const PRODUCT_IDS = Platform.select({
  ios: [
    "com.studymate.pro.monthly",
    "com.studymate.tutor.pack",
  ],
  android: [
    "com.studymate.pro.monthly",
    "com.studymate.tutor.pack",
  ],
}) || [];

const RECEIPT_STORAGE_KEY = "iap_receipts";
const PURCHASE_HISTORY_KEY = "iap_purchase_history";

const GRACE_PERIOD_DAYS = 16;

export class IAPService {
  private isInitialized = false;
  private products: Product[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await initConnection();
      this.isInitialized = true;
      this.setupPurchaseListeners();
      await this.loadProducts();
      this.logEvent("IAP initialized");
    } catch (error) {
      this.logError("Failed to initialize IAP", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
    await endConnection();
    this.isInitialized = false;
  }

  private setupPurchaseListeners(): void {
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        this.logEvent("Purchase updated", this.scrubReceipt(purchase));
        
        try {
          const receipt = await this.processPurchase(purchase);
          await this.saveReceipt(receipt);
          await finishTransaction({ purchase, isConsumable: false });
          this.logEvent("Purchase completed successfully");
        } catch (error) {
          this.logError("Purchase processing failed", error);
        }
      }
    );

    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        this.logError("Purchase error", error);
        if (error.code !== "E_USER_CANCELLED") {
          Alert.alert(
            "Purchase Failed",
            "There was an error processing your purchase. Please try again."
          );
        }
      }
    );
  }

  private async loadProducts(): Promise<void> {
    try {
      this.products = await getProducts({ skus: PRODUCT_IDS });
      this.logEvent(`Loaded ${this.products.length} products`);
    } catch (error) {
      this.logError("Failed to load products", error);
      throw error;
    }
  }

  async getAvailableProducts(): Promise<IAPProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.products.length === 0) {
      await this.loadProducts();
    }

    return this.products.map((product) => ({
      productId: product.productId,
      price: product.price,
      currency: product.currency,
      localizedPrice: product.localizedPrice,
      title: product.title,
      description: product.description,
      type: "subscription" as const,
    }));
  }

  async purchaseProduct(productId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.logEvent(`Initiating purchase for ${productId}`);
      await requestPurchase({ sku: productId });
    } catch (error) {
      this.logError("Purchase request failed", error);
      throw error;
    }
  }

  async restorePurchases(): Promise<UserSubscription | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.logEvent("Restoring purchases");
      const purchases = await getAvailablePurchases();
      
      if (purchases.length === 0) {
        this.logEvent("No purchases to restore");
        return null;
      }

      const validPurchases = purchases.filter((p) =>
        PRODUCT_IDS.includes(p.productId)
      );

      if (validPurchases.length === 0) {
        this.logEvent("No valid purchases found");
        return null;
      }

      const latestPurchase = validPurchases.sort(
        (a, b) => b.transactionDate - a.transactionDate
      )[0];

      const receipt = await this.processPurchase(latestPurchase);
      await this.saveReceipt(receipt);

      const subscription = this.receiptToSubscription(receipt);
      this.logEvent("Purchases restored successfully", this.scrubReceipt(latestPurchase));
      
      return subscription;
    } catch (error) {
      this.logError("Restore purchases failed", error);
      throw error;
    }
  }

  async getCurrentSubscription(): Promise<UserSubscription | null> {
    try {
      const receipts = await this.getStoredReceipts();
      if (receipts.length === 0) {
        return null;
      }

      const latestReceipt = receipts.sort(
        (a, b) => b.transactionDate - a.transactionDate
      )[0];

      return this.receiptToSubscription(latestReceipt);
    } catch (error) {
      this.logError("Failed to get current subscription", error);
      return null;
    }
  }

  async checkSubscriptionStatus(): Promise<{
    isActive: boolean;
    isInGracePeriod: boolean;
    subscription: UserSubscription | null;
  }> {
    const subscription = await this.getCurrentSubscription();
    
    if (!subscription) {
      return { isActive: false, isInGracePeriod: false, subscription: null };
    }

    const now = Date.now();
    const isActive = subscription.status === "active" && 
                     (!subscription.endDate || subscription.endDate > now);
    
    const isInGracePeriod = subscription.isInGracePeriod || 
                            (subscription.gracePeriodEndDate ? 
                             subscription.gracePeriodEndDate > now : false);

    return { isActive, isInGracePeriod, subscription };
  }

  async validateReceiptLocal(receipt: PurchaseReceipt): Promise<boolean> {
    try {
      if (!receipt.transactionId || !receipt.productId) {
        return false;
      }

      if (!PRODUCT_IDS.includes(receipt.productId)) {
        return false;
      }

      if (receipt.transactionDate > Date.now()) {
        return false;
      }

      this.logEvent("Receipt validation passed (local)");
      return true;
    } catch (error) {
      this.logError("Receipt validation failed", error);
      return false;
    }
  }

  private async processPurchase(purchase: Purchase): Promise<PurchaseReceipt> {
    const receipt: PurchaseReceipt = {
      transactionId: purchase.transactionId,
      transactionDate: purchase.transactionDate,
      productId: purchase.productId,
      transactionReceipt: purchase.transactionReceipt,
      purchaseToken: purchase.purchaseToken,
      dataAndroid: purchase.dataAndroid,
      signatureAndroid: purchase.signatureAndroid,
      originalTransactionDateIOS: purchase.originalTransactionDateIOS,
      originalTransactionIdentifierIOS: purchase.originalTransactionIdentifierIOS,
    };

    const isValid = await this.validateReceiptLocal(receipt);
    if (!isValid) {
      throw new Error("Receipt validation failed");
    }

    await this.addToPurchaseHistory(receipt);
    
    return receipt;
  }

  private receiptToSubscription(receipt: PurchaseReceipt): UserSubscription {
    let tier: "free" | "premium" | "pro" = "free";
    
    if (receipt.productId === "com.studymate.pro.monthly") {
      tier = "premium";
    } else if (receipt.productId === "com.studymate.tutor.pack") {
      tier = "pro";
    }

    const startDate = receipt.transactionDate;
    const endDate = startDate + 30 * 24 * 60 * 60 * 1000;
    const gracePeriodEndDate = endDate + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let status: "active" | "expired" | "cancelled" | "grace_period" = "active";
    let isInGracePeriod = false;

    if (now > endDate && now <= gracePeriodEndDate) {
      status = "grace_period";
      isInGracePeriod = true;
    } else if (now > gracePeriodEndDate) {
      status = "expired";
    }

    return {
      tier,
      status,
      startDate,
      endDate,
      autoRenew: true,
      productId: receipt.productId,
      transactionId: receipt.transactionId,
      originalTransactionId: receipt.originalTransactionIdentifierIOS,
      purchaseToken: receipt.purchaseToken,
      isInGracePeriod,
      gracePeriodEndDate,
    };
  }

  private async saveReceipt(receipt: PurchaseReceipt): Promise<void> {
    try {
      const receipts = await this.getStoredReceipts();
      const existingIndex = receipts.findIndex(
        (r) => r.transactionId === receipt.transactionId
      );

      if (existingIndex >= 0) {
        receipts[existingIndex] = receipt;
      } else {
        receipts.push(receipt);
      }

      await StorageService.set(RECEIPT_STORAGE_KEY, receipts);
      this.logEvent("Receipt saved to storage");
    } catch (error) {
      this.logError("Failed to save receipt", error);
    }
  }

  private async getStoredReceipts(): Promise<PurchaseReceipt[]> {
    try {
      const receipts = await StorageService.get<PurchaseReceipt[]>(RECEIPT_STORAGE_KEY);
      return receipts || [];
    } catch (error) {
      this.logError("Failed to get stored receipts", error);
      return [];
    }
  }

  private async addToPurchaseHistory(receipt: PurchaseReceipt): Promise<void> {
    try {
      const history = await StorageService.get<PurchaseReceipt[]>(PURCHASE_HISTORY_KEY) || [];
      history.push(receipt);
      await StorageService.set(PURCHASE_HISTORY_KEY, history);
    } catch (error) {
      this.logError("Failed to add to purchase history", error);
    }
  }

  private scrubReceipt(data: any): any {
    if (!data) return data;
    
    const scrubbed = { ...data };
    
    if (scrubbed.transactionReceipt) {
      scrubbed.transactionReceipt = `[REDACTED_${scrubbed.transactionReceipt.substring(0, 10)}...]`;
    }
    if (scrubbed.purchaseToken) {
      scrubbed.purchaseToken = `[REDACTED_${scrubbed.purchaseToken.substring(0, 10)}...]`;
    }
    if (scrubbed.dataAndroid) {
      scrubbed.dataAndroid = "[REDACTED]";
    }
    if (scrubbed.signatureAndroid) {
      scrubbed.signatureAndroid = "[REDACTED]";
    }
    
    return scrubbed;
  }

  private logEvent(message: string, data?: any): void {
    if (__DEV__) {
      console.log(`[IAPService] ${message}`, data ? this.scrubReceipt(data) : "");
    }
  }

  private logError(message: string, error: any): void {
    if (__DEV__) {
      console.error(`[IAPService] ${message}`, error);
    }
  }
}

export default new IAPService();
