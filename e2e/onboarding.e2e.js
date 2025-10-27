describe("Onboarding Flow", () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { camera: "YES" },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should complete onboarding flow", async () => {
    // First step
    await expect(element(by.id("onboarding-screen"))).toBeVisible();
    await expect(element(by.text("Solve Math Problems"))).toBeVisible();

    // Navigate through steps
    await element(by.id("next-button")).tap();
    await expect(element(by.text("Learn Step by Step"))).toBeVisible();

    await element(by.id("next-button")).tap();
    await expect(element(by.text("Practice with Quizzes"))).toBeVisible();

    // Complete onboarding
    await element(by.id("next-button")).tap();

    // Should navigate to home
    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(2000);
  });

  it("should skip onboarding", async () => {
    await expect(element(by.id("onboarding-screen"))).toBeVisible();

    await element(by.id("skip-button")).tap();

    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(2000);
  });

  it("should show correct pagination dots", async () => {
    await expect(element(by.id("pagination-dot-0"))).toBeVisible();
    await expect(element(by.id("pagination-dot-1"))).toBeVisible();
    await expect(element(by.id("pagination-dot-2"))).toBeVisible();
  });

  it("should update button text on last step", async () => {
    // Navigate to last step
    await element(by.id("next-button")).tap();
    await element(by.id("next-button")).tap();

    await expect(element(by.text("Get Started"))).toBeVisible();
  });
});
