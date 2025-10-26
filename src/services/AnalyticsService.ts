export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  plan?: 'free' | 'premium' | 'pro';
  [key: string]: any;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private userProperties: UserProperties | null = null;
  private enabled: boolean = true;

  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        platform: 'react-native',
      },
      timestamp: Date.now(),
      userId: this.userProperties?.userId,
    };

    this.events.push(event);
    this.sendEvent(event);
  }

  trackScreen(screenName: string, properties?: Record<string, any>): void {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  trackPurchase(
    productId: string,
    price: number,
    currency: string = 'USD'
  ): void {
    this.track('purchase', {
      product_id: productId,
      price,
      currency,
      timestamp: Date.now(),
    });
  }

  trackQuizCompleted(
    quizId: string,
    score: number,
    totalQuestions: number
  ): void {
    this.track('quiz_completed', {
      quiz_id: quizId,
      score,
      total_questions: totalQuestions,
      accuracy: (score / totalQuestions) * 100,
    });
  }

  trackProblemSolved(
    problemId: string,
    difficulty: string,
    timeSpent: number
  ): void {
    this.track('problem_solved', {
      problem_id: problemId,
      difficulty,
      time_spent: timeSpent,
    });
  }

  identify(userProperties: UserProperties): void {
    this.userProperties = userProperties;
    this.sendUserProperties(userProperties);
  }

  setUserProperty(key: string, value: any): void {
    if (!this.userProperties) {
      this.userProperties = { userId: 'anonymous' };
    }
    this.userProperties[key] = value;
  }

  reset(): void {
    this.userProperties = null;
    this.events = [];
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getUserProperties(): UserProperties | null {
    return this.userProperties;
  }

  private sendEvent(event: AnalyticsEvent): void {
    // In a real app, this would send to analytics service (Firebase, Mixpanel, etc.)
    if (__DEV__) {
      console.log('[Analytics]', event.name, event.properties);
    }
  }

  private sendUserProperties(properties: UserProperties): void {
    // In a real app, this would send to analytics service
    if (__DEV__) {
      console.log('[Analytics] User identified:', properties.userId);
    }
  }

  clearEvents(): void {
    this.events = [];
  }
}

export default new AnalyticsService();
