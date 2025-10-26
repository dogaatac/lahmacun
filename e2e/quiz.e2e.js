describe('Quiz Taking Flow', () => {
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

  it('should navigate to quiz screen', async () => {
    await element(by.id('quiz-tab')).tap();
    await expect(element(by.id('quiz-screen'))).toBeVisible();
  });

  it('should start a quiz', async () => {
    await element(by.id('quiz-tab')).tap();
    
    // Select quiz topic
    await element(by.id('start-quiz-button')).tap();
    
    await waitFor(element(by.id('quiz-question')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should answer quiz questions', async () => {
    await element(by.id('quiz-tab')).tap();
    await element(by.id('start-quiz-button')).tap();
    
    await waitFor(element(by.id('quiz-question'))).toBeVisible();
    
    // Answer first question
    await element(by.id('answer-option-0')).tap();
    await element(by.id('submit-answer-button')).tap();
    
    // Should show next question or results
    await waitFor(element(by.id('quiz-question')).or(by.id('quiz-results')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should complete quiz and show results', async () => {
    await element(by.id('quiz-tab')).tap();
    await element(by.id('start-quiz-button')).tap();
    
    // Answer all questions (assuming 5 questions)
    for (let i = 0; i < 5; i++) {
      await waitFor(element(by.id('quiz-question'))).toBeVisible();
      await element(by.id('answer-option-0')).tap();
      await element(by.id('submit-answer-button')).tap();
    }
    
    // Should show results
    await waitFor(element(by.id('quiz-results')))
      .toBeVisible()
      .withTimeout(2000);
    
    await expect(element(by.id('quiz-score'))).toBeVisible();
  });

  it('should track quiz progress', async () => {
    await element(by.id('quiz-tab')).tap();
    await element(by.id('start-quiz-button')).tap();
    
    await waitFor(element(by.id('quiz-progress'))).toBeVisible();
    
    // Progress should update as questions are answered
    await element(by.id('answer-option-0')).tap();
    await element(by.id('submit-answer-button')).tap();
    
    await expect(element(by.id('quiz-progress'))).toBeVisible();
  });
});
