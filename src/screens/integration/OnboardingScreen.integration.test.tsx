import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { OnboardingScreen } from "../OnboardingScreen";
import AnalyticsService from "../../services/AnalyticsService";

jest.mock("../../services/AnalyticsService");

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe("OnboardingScreen Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render first onboarding step", () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);

    expect(getByTestId("onboarding-screen")).toBeTruthy();
    expect(getByText("Solve Math Problems")).toBeTruthy();
    expect(
      getByText("Take a photo of any math problem and get instant solutions")
    ).toBeTruthy();
  });

  it("should navigate through all steps", async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);

    // First step
    expect(getByText("Solve Math Problems")).toBeTruthy();
    fireEvent.press(getByTestId("next-button"));

    // Second step
    await waitFor(() => {
      expect(getByText("Learn Step by Step")).toBeTruthy();
    });
    fireEvent.press(getByTestId("next-button"));

    // Third step
    await waitFor(() => {
      expect(getByText("Practice with Quizzes")).toBeTruthy();
    });
  });

  it("should track analytics events on step navigation", async () => {
    const { getByTestId } = render(<OnboardingScreen />);

    fireEvent.press(getByTestId("next-button"));

    await waitFor(() => {
      expect(AnalyticsService.track).toHaveBeenCalledWith("onboarding_step", {
        step: 1,
      });
    });
  });

  it("should complete onboarding and navigate to home", async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);

    // Navigate to last step
    fireEvent.press(getByTestId("next-button"));
    await waitFor(() => expect(getByText("Learn Step by Step")).toBeTruthy());

    fireEvent.press(getByTestId("next-button"));
    await waitFor(() =>
      expect(getByText("Practice with Quizzes")).toBeTruthy()
    );

    // Complete
    fireEvent.press(getByTestId("next-button"));

    await waitFor(() => {
      expect(AnalyticsService.track).toHaveBeenCalledWith(
        "onboarding_completed"
      );
      expect(mockNavigate).toHaveBeenCalledWith("Home");
    });
  });

  it("should allow skipping onboarding", async () => {
    const { getByTestId } = render(<OnboardingScreen />);

    fireEvent.press(getByTestId("skip-button"));

    await waitFor(() => {
      expect(AnalyticsService.track).toHaveBeenCalledWith(
        "onboarding_skipped",
        {
          step: 0,
        }
      );
      expect(mockNavigate).toHaveBeenCalledWith("Home");
    });
  });

  it("should update pagination dots correctly", () => {
    const { getByTestId } = render(<OnboardingScreen />);

    const dot0 = getByTestId("pagination-dot-0");
    const dot1 = getByTestId("pagination-dot-1");
    const dot2 = getByTestId("pagination-dot-2");

    expect(dot0).toBeTruthy();
    expect(dot1).toBeTruthy();
    expect(dot2).toBeTruthy();
  });

  it("should show correct button text on last step", async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);

    // Navigate to last step
    fireEvent.press(getByTestId("next-button"));
    fireEvent.press(getByTestId("next-button"));

    await waitFor(() => {
      expect(getByText("Get Started")).toBeTruthy();
    });
  });
});
