import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import SubscriptionService from "../services/SubscriptionService";
import AnalyticsService from "../services/AnalyticsService";
import { IAPProduct, SubscriptionTier } from "../types";

export const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    AnalyticsService.trackScreen("Paywall");
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await SubscriptionService.initializeIAP();
      const [availableProducts, allTiers] = await Promise.all([
        SubscriptionService.getAvailableProducts(),
        SubscriptionService.getAllTiers(),
      ]);
      setProducts(availableProducts);
      setTiers(allTiers.filter(t => t.id !== "free"));
    } catch (error) {
      Alert.alert("Error", "Failed to load subscription options");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      setPurchasing(true);
      setSelectedProductId(productId);
      AnalyticsService.track("purchase_initiated", { productId });

      const success = await SubscriptionService.purchaseSubscription(productId);
      
      if (success) {
        Alert.alert(
          "Success!",
          "Your subscription has been activated. Enjoy premium features!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
        AnalyticsService.track("purchase_completed", { productId });
      }
    } catch (error) {
      Alert.alert("Purchase Failed", "Please try again later");
      AnalyticsService.track("purchase_failed", { productId, error: String(error) });
    } finally {
      setPurchasing(false);
      setSelectedProductId(null);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      AnalyticsService.track("restore_purchases_initiated");
      
      const restored = await SubscriptionService.restorePurchases();
      
      if (restored) {
        Alert.alert(
          "Success!",
          "Your purchases have been restored.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
        AnalyticsService.track("restore_purchases_success");
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore."
        );
        AnalyticsService.track("restore_purchases_none_found");
      }
    } catch (error) {
      Alert.alert(
        "Restore Failed",
        "Unable to restore purchases. Please try again later."
      );
      AnalyticsService.track("restore_purchases_failed", { error: String(error) });
    } finally {
      setRestoring(false);
    }
  };

  const getTierForProduct = (productId: string): SubscriptionTier | undefined => {
    const tierId = SubscriptionService.getTierForProductId(productId);
    return tiers.find(t => t.id === tierId);
  };

  const getProductPrice = (productId: string): string => {
    const product = products.find(p => p.productId === productId);
    return product?.localizedPrice || product?.price || "Loading...";
  };

  const renderTierCard = (productId: string) => {
    const tier = getTierForProduct(productId);
    if (!tier) return null;

    const price = getProductPrice(productId);
    const isLoading = purchasing && selectedProductId === productId;
    const isPro = tier.id === "pro";

    return (
      <View
        key={productId}
        style={[styles.tierCard, isPro && styles.tierCardPro]}
        testID={`tier-card-${tier.id}`}
      >
        {isPro && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}
        <Text style={styles.tierName}>{tier.name}</Text>
        <Text style={styles.tierDescription}>{tier.description}</Text>
        <Text style={styles.tierPrice}>{price}</Text>
        
        <View style={styles.featuresContainer}>
          {tier.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            isPro && styles.purchaseButtonPro,
            isLoading && styles.purchaseButtonDisabled,
          ]}
          onPress={() => handlePurchase(productId)}
          disabled={isLoading || purchasing}
          testID={`purchase-button-${tier.id}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} testID="paywall-screen">
        <View style={styles.header}>
          <Text style={styles.title}>Unlock Your Learning Potential</Text>
          <Text style={styles.subtitle}>
            Choose the plan that's right for you
          </Text>
        </View>

        <View style={styles.tiersContainer}>
          {products.map(product => renderTierCard(product.productId))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={restoring}
            testID="restore-purchases-button"
          >
            {restoring ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            Subscriptions automatically renew unless cancelled at least 24 hours
            before the end of the current period. You can manage your subscription
            in your Apple ID settings.
          </Text>

          <View style={styles.linksContainer}>
            <TouchableOpacity>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  tiersContainer: {
    padding: 16,
  },
  tierCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  tierCardPro: {
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  tierName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  tierDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkmark: {
    fontSize: 20,
    color: "#4CAF50",
    marginRight: 12,
    fontWeight: "bold",
  },
  featureText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  purchaseButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  purchaseButtonPro: {
    backgroundColor: "#007AFF",
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  restoreButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  linksContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  linkText: {
    color: "#007AFF",
    fontSize: 12,
  },
  linkSeparator: {
    color: "#999",
    marginHorizontal: 8,
  },
});
