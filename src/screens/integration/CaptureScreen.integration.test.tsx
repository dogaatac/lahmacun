import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { CaptureScreen } from '../CaptureScreen';
import GeminiService from '../../services/GeminiService';
import AnalyticsService from '../../services/AnalyticsService';
import GamificationService from '../../services/GamificationService';

jest.mock('../../services/GeminiService');
jest.mock('../../services/AnalyticsService');
jest.mock('../../services/GamificationService');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('CaptureScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation();
  });

  it('should render camera placeholder initially', () => {
    const { getByTestId } = render(<CaptureScreen />);

    expect(getByTestId('capture-screen')).toBeTruthy();
    expect(getByTestId('camera-placeholder')).toBeTruthy();
    expect(getByTestId('capture-button')).toBeTruthy();
  });

  it('should capture image and show preview', async () => {
    const { getByTestId, queryByTestId } = render(<CaptureScreen />);

    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      expect(getByTestId('image-preview')).toBeTruthy();
      expect(queryByTestId('camera-placeholder')).toBeNull();
      expect(AnalyticsService.track).toHaveBeenCalledWith('image_captured');
    });
  });

  it('should show retake and analyze buttons after capture', async () => {
    const { getByTestId } = render(<CaptureScreen />);

    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      expect(getByTestId('retake-button')).toBeTruthy();
      expect(getByTestId('analyze-button')).toBeTruthy();
    });
  });

  it('should retake photo and reset to camera view', async () => {
    const { getByTestId, queryByTestId } = render(<CaptureScreen />);

    // Capture
    fireEvent.press(getByTestId('capture-button'));
    await waitFor(() => expect(getByTestId('image-preview')).toBeTruthy());

    // Retake
    fireEvent.press(getByTestId('retake-button'));

    await waitFor(() => {
      expect(queryByTestId('image-preview')).toBeNull();
      expect(getByTestId('camera-placeholder')).toBeTruthy();
      expect(AnalyticsService.track).toHaveBeenCalledWith('retake_photo');
    });
  });

  it('should analyze problem and navigate to solution', async () => {
    const mockSolution = {
      solution: 'x = 5',
      steps: ['Step 1', 'Step 2'],
      difficulty: 'medium' as const,
    };

    (GeminiService.analyzeProblem as jest.Mock).mockResolvedValue(mockSolution);
    (GamificationService.recordProblemSolved as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(<CaptureScreen />);

    // Capture
    fireEvent.press(getByTestId('capture-button'));
    await waitFor(() => expect(getByTestId('analyze-button')).toBeTruthy());

    // Analyze
    fireEvent.press(getByTestId('analyze-button'));

    await waitFor(() => {
      expect(GeminiService.analyzeProblem).toHaveBeenCalled();
      expect(GamificationService.recordProblemSolved).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('Solution', {
        solution: mockSolution,
      });
      expect(AnalyticsService.track).toHaveBeenCalledWith('analysis_completed', {
        difficulty: 'medium',
        time_ms: expect.any(Number),
      });
    });
  });

  it('should show loading indicator during analysis', async () => {
    (GeminiService.analyzeProblem as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByTestId, queryByTestId } = render(<CaptureScreen />);

    fireEvent.press(getByTestId('capture-button'));
    await waitFor(() => expect(getByTestId('analyze-button')).toBeTruthy());

    fireEvent.press(getByTestId('analyze-button'));

    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeTruthy();
    });
  });

  it('should handle analysis errors gracefully', async () => {
    const error = new Error('Analysis failed');
    (GeminiService.analyzeProblem as jest.Mock).mockRejectedValue(error);

    const { getByTestId } = render(<CaptureScreen />);

    fireEvent.press(getByTestId('capture-button'));
    await waitFor(() => expect(getByTestId('analyze-button')).toBeTruthy());

    fireEvent.press(getByTestId('analyze-button'));

    await waitFor(() => {
      expect(AnalyticsService.trackError).toHaveBeenCalledWith(error, {
        screen: 'Capture',
      });
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to analyze problem');
    });
  });

  it('should track analytics throughout the flow', async () => {
    const { getByTestId } = render(<CaptureScreen />);

    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      expect(AnalyticsService.track).toHaveBeenCalledWith('capture_initiated');
      expect(AnalyticsService.track).toHaveBeenCalledWith('image_captured');
    });
  });

  it('should disable buttons during processing', async () => {
    (GeminiService.analyzeProblem as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByTestId } = render(<CaptureScreen />);

    fireEvent.press(getByTestId('capture-button'));
    await waitFor(() => expect(getByTestId('analyze-button')).toBeTruthy());

    fireEvent.press(getByTestId('analyze-button'));

    const analyzeButton = getByTestId('analyze-button');
    const retakeButton = getByTestId('retake-button');

    expect(analyzeButton.props.accessibilityState?.disabled).toBe(true);
    expect(retakeButton.props.accessibilityState?.disabled).toBe(true);
  });
});
