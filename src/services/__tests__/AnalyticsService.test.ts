import { AnalyticsService } from "../AnalyticsService";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    service.clearEvents();
    service.reset();
  });

  describe("track", () => {
    it("should track an event", () => {
      service.track("test_event", { prop1: "value1" });

      const events = service.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe("test_event");
      expect(events[0].properties?.prop1).toBe("value1");
    });

    it("should include platform in properties", () => {
      service.track("event", {});

      const events = service.getEvents();
      expect(events[0].properties?.platform).toBe("react-native");
    });

    it("should not track when disabled", () => {
      service.disable();
      service.track("test_event");

      expect(service.getEvents()).toHaveLength(0);
    });

    it("should track when re-enabled", () => {
      service.disable();
      service.enable();
      service.track("test_event");

      expect(service.getEvents()).toHaveLength(1);
    });
  });

  describe("trackScreen", () => {
    it("should track screen view", () => {
      service.trackScreen("HomeScreen", { source: "navigation" });

      const events = service.getEvents();
      expect(events[0].name).toBe("screen_view");
      expect(events[0].properties?.screen_name).toBe("HomeScreen");
      expect(events[0].properties?.source).toBe("navigation");
    });
  });

  describe("trackError", () => {
    it("should track error with message and stack", () => {
      const error = new Error("Test error");
      service.trackError(error, { screen: "TestScreen" });

      const events = service.getEvents();
      expect(events[0].name).toBe("error");
      expect(events[0].properties?.error_message).toBe("Test error");
      expect(events[0].properties?.screen).toBe("TestScreen");
    });
  });

  describe("trackPurchase", () => {
    it("should track purchase with product details", () => {
      service.trackPurchase("premium_monthly", 9.99, "USD");

      const events = service.getEvents();
      expect(events[0].name).toBe("purchase");
      expect(events[0].properties?.product_id).toBe("premium_monthly");
      expect(events[0].properties?.price).toBe(9.99);
      expect(events[0].properties?.currency).toBe("USD");
    });

    it("should use USD as default currency", () => {
      service.trackPurchase("product", 10);

      const events = service.getEvents();
      expect(events[0].properties?.currency).toBe("USD");
    });
  });

  describe("trackQuizCompleted", () => {
    it("should track quiz completion with accuracy", () => {
      service.trackQuizCompleted("quiz_123", 8, 10);

      const events = service.getEvents();
      expect(events[0].name).toBe("quiz_completed");
      expect(events[0].properties?.quiz_id).toBe("quiz_123");
      expect(events[0].properties?.score).toBe(8);
      expect(events[0].properties?.total_questions).toBe(10);
      expect(events[0].properties?.accuracy).toBe(80);
    });
  });

  describe("trackProblemSolved", () => {
    it("should track problem solving metrics", () => {
      service.trackProblemSolved("problem_456", "medium", 120);

      const events = service.getEvents();
      expect(events[0].name).toBe("problem_solved");
      expect(events[0].properties?.problem_id).toBe("problem_456");
      expect(events[0].properties?.difficulty).toBe("medium");
      expect(events[0].properties?.time_spent).toBe(120);
    });
  });

  describe("identify", () => {
    it("should set user properties", () => {
      const userProps = {
        userId: "user_123",
        email: "test@example.com",
        plan: "premium" as const,
      };

      service.identify(userProps);

      expect(service.getUserProperties()).toEqual(userProps);
    });

    it("should include userId in tracked events", () => {
      service.identify({ userId: "user_123" });
      service.track("test_event");

      const events = service.getEvents();
      expect(events[0].userId).toBe("user_123");
    });
  });

  describe("setUserProperty", () => {
    it("should set individual user property", () => {
      service.identify({ userId: "user_123" });
      service.setUserProperty("age", 25);

      const props = service.getUserProperties();
      expect(props?.age).toBe(25);
    });

    it("should create user properties if not identified", () => {
      service.setUserProperty("newProp", "value");

      const props = service.getUserProperties();
      expect(props?.newProp).toBe("value");
      expect(props?.userId).toBe("anonymous");
    });
  });

  describe("reset", () => {
    it("should clear all user properties and events", () => {
      service.identify({ userId: "user_123" });
      service.track("event1");
      service.track("event2");

      service.reset();

      expect(service.getUserProperties()).toBeNull();
      expect(service.getEvents()).toHaveLength(0);
    });
  });

  describe("enable/disable", () => {
    it("should check if service is enabled", () => {
      expect(service.isEnabled()).toBe(true);

      service.disable();
      expect(service.isEnabled()).toBe(false);

      service.enable();
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("event timestamp", () => {
    it("should include timestamp in events", () => {
      const beforeTrack = Date.now();
      service.track("test_event");
      const afterTrack = Date.now();

      const events = service.getEvents();
      expect(events[0].timestamp).toBeGreaterThanOrEqual(beforeTrack);
      expect(events[0].timestamp).toBeLessThanOrEqual(afterTrack);
    });
  });
});
