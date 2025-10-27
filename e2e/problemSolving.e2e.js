describe("Problem Solving Flow", () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { camera: "YES" },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Skip onboarding
    if (await element(by.id("onboarding-screen")).exists()) {
      await element(by.id("skip-button")).tap();
    }
  });

  it("should capture and analyze a problem", async () => {
    // Navigate to capture screen
    await element(by.id("capture-tab")).tap();
    await expect(element(by.id("capture-screen"))).toBeVisible();

    // Capture image
    await expect(element(by.id("camera-placeholder"))).toBeVisible();
    await element(by.id("capture-button")).tap();

    // Verify preview is shown
    await waitFor(element(by.id("image-preview")))
      .toBeVisible()
      .withTimeout(2000);

    // Analyze
    await element(by.id("analyze-button")).tap();

    // Should navigate to solution screen
    await waitFor(element(by.id("solution-screen")))
      .toBeVisible()
      .withTimeout(10000);

    // Verify solution elements
    await expect(element(by.id("difficulty-badge"))).toBeVisible();
    await expect(element(by.id("final-answer"))).toBeVisible();
  });

  it("should allow retaking a photo", async () => {
    await element(by.id("capture-tab")).tap();

    // Capture
    await element(by.id("capture-button")).tap();
    await waitFor(element(by.id("image-preview"))).toBeVisible();

    // Retake
    await element(by.id("retake-button")).tap();

    // Should show camera again
    await expect(element(by.id("camera-placeholder"))).toBeVisible();
  });

  it("should show loading indicator during analysis", async () => {
    await element(by.id("capture-tab")).tap();

    await element(by.id("capture-button")).tap();
    await waitFor(element(by.id("analyze-button"))).toBeVisible();

    await element(by.id("analyze-button")).tap();

    // Loading indicator should appear briefly
    await expect(element(by.id("loading-indicator"))).toBeVisible();
  });
});
