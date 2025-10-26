describe('Purchase Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Skip onboarding
    if (await element(by.id('onboarding-screen')).exists()) {
      await element(by.id('skip-button')).tap();
    }
  });

  it('should navigate to subscription screen', async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('upgrade-button')).tap();
    
    await expect(element(by.id('subscription-screen'))).toBeVisible();
  });

  it('should display subscription plans', async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('upgrade-button')).tap();
    
    await expect(element(by.id('plan-monthly'))).toBeVisible();
    await expect(element(by.id('plan-yearly'))).toBeVisible();
  });

  it('should select a subscription plan', async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('upgrade-button')).tap();
    
    await element(by.id('plan-monthly')).tap();
    
    // Verify plan is selected
    await expect(element(by.id('plan-monthly-selected'))).toBeVisible();
  });

  it('should initiate purchase flow', async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('upgrade-button')).tap();
    
    await element(by.id('plan-monthly')).tap();
    await element(by.id('subscribe-button')).tap();
    
    // Should show payment processing or success
    await waitFor(element(by.id('payment-processing').or(by.id('purchase-success'))))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show plan features', async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('upgrade-button')).tap();
    
    await expect(element(by.id('feature-unlimited-problems'))).toBeVisible();
    await expect(element(by.id('feature-advanced-ai'))).toBeVisible();
    await expect(element(by.id('feature-offline-mode'))).toBeVisible();
  });

  it('should allow closing subscription screen', async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('upgrade-button')).tap();
    
    await element(by.id('close-subscription-button')).tap();
    
    // Should return to profile
    await expect(element(by.id('profile-screen'))).toBeVisible();
  });

  it('should restore purchases', async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('upgrade-button')).tap();
    
    await element(by.id('restore-purchases-button')).tap();
    
    await waitFor(element(by.text('Purchases Restored').or(by.text('No Purchases Found'))))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show free trial information', async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('upgrade-button')).tap();
    
    await expect(element(by.id('free-trial-info'))).toBeVisible();
  });
});
