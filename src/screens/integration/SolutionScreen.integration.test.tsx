import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SolutionScreen } from '../SolutionScreen';
import AnalyticsService from '../../services/AnalyticsService';

jest.mock('../../services/AnalyticsService');

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRoute = {
  params: {
    solution: {
      solution: 'x = 42',
      steps: [
        'Identify the equation: 2x + 6 = 90',
        'Subtract 6 from both sides: 2x = 84',
        'Divide both sides by 2: x = 42',
      ],
      difficulty: 'medium' as const,
    },
  },
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => mockRoute,
}));

describe('SolutionScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render solution with all steps', () => {
    const { getByTestId, getByText } = render(<SolutionScreen />);

    expect(getByTestId('solution-screen')).toBeTruthy();
    expect(getByText('Solution')).toBeTruthy();
    expect(getByText('x = 42')).toBeTruthy();
    
    // Check all steps are rendered
    mockRoute.params.solution.steps.forEach((step, index) => {
      expect(getByTestId(`step-${index}`)).toBeTruthy();
      expect(getByText(step)).toBeTruthy();
    });
  });

  it('should display difficulty badge', () => {
    const { getByTestId, getByText } = render(<SolutionScreen />);

    const difficultyBadge = getByTestId('difficulty-badge');
    expect(difficultyBadge).toBeTruthy();
    expect(getByText('MEDIUM')).toBeTruthy();
  });

  it('should display final answer', () => {
    const { getByTestId, getByText } = render(<SolutionScreen />);

    expect(getByTestId('final-answer')).toBeTruthy();
    expect(getByText('x = 42')).toBeTruthy();
  });

  it('should track screen view with difficulty', () => {
    render(<SolutionScreen />);

    expect(AnalyticsService.trackScreen).toHaveBeenCalledWith('Solution', {
      difficulty: 'medium',
    });
  });

  it('should navigate to chat screen when ask question button is pressed', () => {
    const { getByTestId } = render(<SolutionScreen />);

    fireEvent.press(getByTestId('ask-question-button'));

    expect(AnalyticsService.track).toHaveBeenCalledWith('open_chat_from_solution');
    expect(mockNavigate).toHaveBeenCalledWith('Chat', {
      context: mockRoute.params.solution,
    });
  });

  it('should go back when new problem button is pressed', () => {
    const { getByTestId } = render(<SolutionScreen />);

    fireEvent.press(getByTestId('new-problem-button'));

    expect(AnalyticsService.track).toHaveBeenCalledWith('new_problem_from_solution');
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('should show error message when no solution is provided', () => {
    const emptyRoute = { params: null };
    jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue(emptyRoute);

    const { getByText } = render(<SolutionScreen />);

    expect(getByText('No solution available')).toBeTruthy();
  });

  it('should render correct number of step items', () => {
    const { getByTestId } = render(<SolutionScreen />);

    const stepCount = mockRoute.params.solution.steps.length;
    for (let i = 0; i < stepCount; i++) {
      expect(getByTestId(`step-${i}`)).toBeTruthy();
    }
  });

  it('should render different difficulty levels correctly', () => {
    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

    difficulties.forEach(difficulty => {
      const testRoute = {
        params: {
          solution: {
            ...mockRoute.params.solution,
            difficulty,
          },
        },
      };

      jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue(testRoute);

      const { getByText } = render(<SolutionScreen />);
      expect(getByText(difficulty.toUpperCase())).toBeTruthy();
    });
  });
});
