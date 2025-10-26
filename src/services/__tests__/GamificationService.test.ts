import { GamificationService } from '../GamificationService';
import StorageService from '../StorageService';

jest.mock('../StorageService');

describe('GamificationService', () => {
  let service: GamificationService;
  const mockedStorage = StorageService as jest.Mocked<typeof StorageService>;

  beforeEach(() => {
    service = new GamificationService();
    jest.clearAllMocks();
  });

  describe('getUserProgress', () => {
    it('should return default progress for new users', async () => {
      mockedStorage.get.mockResolvedValue(null);

      const progress = await service.getUserProgress();

      expect(progress.level).toBe(1);
      expect(progress.xp).toBe(0);
      expect(progress.streak).toBe(0);
      expect(progress.totalProblemsolved).toBe(0);
      expect(progress.totalQuizzesCompleted).toBe(0);
    });

    it('should return existing progress', async () => {
      const existingProgress = {
        level: 5,
        xp: 250,
        xpToNextLevel: 161,
        streak: 7,
        totalProblemsolved: 25,
        totalQuizzesCompleted: 10,
        lastActivityDate: '2024-01-15',
      };

      mockedStorage.get.mockResolvedValue(existingProgress);

      const progress = await service.getUserProgress();

      expect(progress).toEqual(existingProgress);
    });
  });

  describe('addXP', () => {
    it('should add XP and return rewards', async () => {
      mockedStorage.get.mockResolvedValue({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        totalProblemsolved: 0,
        totalQuizzesCompleted: 0,
      });

      const rewards = await service.addXP(50);

      expect(rewards).toHaveLength(1);
      expect(rewards[0].type).toBe('xp');
      expect(rewards[0].value).toBe(50);
      expect(mockedStorage.set).toHaveBeenCalled();
    });

    it('should trigger level up when XP threshold is reached', async () => {
      mockedStorage.get.mockResolvedValue({
        level: 1,
        xp: 90,
        xpToNextLevel: 100,
        streak: 0,
        totalProblemsolved: 0,
        totalQuizzesCompleted: 0,
      });

      const rewards = await service.addXP(20);

      expect(rewards.length).toBeGreaterThan(1);
      const levelUpReward = rewards.find(r => r.message.includes('Level Up'));
      expect(levelUpReward).toBeDefined();
    });

    it('should handle multiple level ups', async () => {
      mockedStorage.get.mockResolvedValue({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        totalProblemsolved: 0,
        totalQuizzesCompleted: 0,
      });

      const rewards = await service.addXP(250);

      const levelUpRewards = rewards.filter(r => r.message.includes('Level Up'));
      expect(levelUpRewards.length).toBeGreaterThan(0);
    });
  });

  describe('recordProblemSolved', () => {
    it('should increment problem count and add XP', async () => {
      mockedStorage.get.mockResolvedValue({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        totalProblemsolved: 0,
        totalQuizzesCompleted: 0,
      });

      const rewards = await service.recordProblemSolved();

      expect(rewards.length).toBeGreaterThan(0);
      expect(mockedStorage.set).toHaveBeenCalled();
    });

    it('should unlock first problem achievement', async () => {
      mockedStorage.get
        .mockResolvedValueOnce({
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          streak: 0,
          totalProblemsolved: 1,
          totalQuizzesCompleted: 0,
        })
        .mockResolvedValueOnce({
          level: 1,
          xp: 10,
          xpToNextLevel: 100,
          streak: 1,
          totalProblemsolved: 1,
          totalQuizzesCompleted: 0,
          lastActivityDate: new Date().toISOString().split('T')[0],
        })
        .mockResolvedValue([]);

      const rewards = await service.recordProblemSolved();

      const achievementReward = rewards.find(r => r.type === 'achievement');
      expect(achievementReward).toBeDefined();
      expect(achievementReward?.message).toContain('First Steps');
    });
  });

  describe('recordQuizCompleted', () => {
    it('should calculate XP based on score', async () => {
      mockedStorage.get.mockResolvedValue({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        totalProblemsolved: 0,
        totalQuizzesCompleted: 0,
      });

      const rewards = await service.recordQuizCompleted(8, 10);

      const xpReward = rewards.find(r => r.type === 'xp');
      expect(xpReward).toBeDefined();
      expect(xpReward?.value).toBeGreaterThan(0);
    });

    it('should increment quiz count', async () => {
      mockedStorage.get.mockResolvedValue({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        totalProblemsolved: 0,
        totalQuizzesCompleted: 5,
      });

      await service.recordQuizCompleted(10, 10);

      expect(mockedStorage.set).toHaveBeenCalled();
    });
  });

  describe('getAchievements', () => {
    it('should return all achievements with unlock status', async () => {
      mockedStorage.get.mockResolvedValue(['first_problem']);

      const achievements = await service.getAchievements();

      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBeGreaterThan(0);
      achievements.forEach(achievement => {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('icon');
      });
    });
  });

  describe('getUnlockedAchievements', () => {
    it('should return only unlocked achievements', async () => {
      mockedStorage.get
        .mockResolvedValueOnce(['first_problem', 'streak_7'])
        .mockResolvedValueOnce(['first_problem', 'streak_7']);

      const unlocked = await service.getUnlockedAchievements();

      expect(unlocked.every(a => a.unlockedAt)).toBe(true);
    });

    it('should return empty array when no achievements unlocked', async () => {
      mockedStorage.get.mockResolvedValue([]);

      const unlocked = await service.getUnlockedAchievements();

      expect(unlocked).toHaveLength(0);
    });
  });

  describe('streak management', () => {
    it('should maintain streak on consecutive days', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      mockedStorage.get.mockResolvedValue({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 5,
        totalProblemsolved: 0,
        totalQuizzesCompleted: 0,
        lastActivityDate: yesterday,
      });

      await service.recordProblemSolved();

      const savedProgress = mockedStorage.set.mock.calls.find(
        call => call[0] === 'user_progress'
      )?.[1];

      expect(savedProgress?.streak).toBe(6);
    });

    it('should reset streak if day is skipped', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      mockedStorage.get.mockResolvedValue({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 5,
        totalProblemsolved: 0,
        totalQuizzesCompleted: 0,
        lastActivityDate: twoDaysAgo,
      });

      await service.recordProblemSolved();

      const savedProgress = mockedStorage.set.mock.calls.find(
        call => call[0] === 'user_progress'
      )?.[1];

      expect(savedProgress?.streak).toBe(1);
    });
  });

  describe('resetProgress', () => {
    it('should clear all progress and achievements', async () => {
      await service.resetProgress();

      expect(mockedStorage.remove).toHaveBeenCalledWith('user_progress');
      expect(mockedStorage.remove).toHaveBeenCalledWith('user_achievements');
    });
  });
});
