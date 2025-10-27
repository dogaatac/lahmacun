import StorageService from "./StorageService";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface UserProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  lastActivityDate?: string;
  totalProblemsolved: number;
  totalQuizzesCompleted: number;
}

export interface Reward {
  type: "xp" | "achievement" | "badge";
  value: number | string;
  message: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_problem",
    name: "First Steps",
    description: "Solve your first problem",
    icon: "🎯",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
  },
  {
    id: "quiz_master",
    name: "Quiz Master",
    description: "Complete 10 quizzes",
    icon: "🏆",
  },
  {
    id: "problem_solver_50",
    name: "Problem Solver",
    description: "Solve 50 problems",
    icon: "⭐",
  },
];

export class GamificationService {
  private readonly STORAGE_KEY_PROGRESS = "user_progress";
  private readonly STORAGE_KEY_ACHIEVEMENTS = "user_achievements";
  private readonly XP_PER_LEVEL = 100;

  async getUserProgress(): Promise<UserProgress> {
    const progress = await StorageService.get<UserProgress>(
      this.STORAGE_KEY_PROGRESS
    );

    if (!progress) {
      return this.createDefaultProgress();
    }

    return progress;
  }

  async addXP(amount: number): Promise<Reward[]> {
    const progress = await this.getUserProgress();
    const rewards: Reward[] = [];

    progress.xp += amount;
    rewards.push({
      type: "xp",
      value: amount,
      message: `+${amount} XP`,
    });

    // Check for level up
    while (progress.xp >= progress.xpToNextLevel) {
      progress.xp -= progress.xpToNextLevel;
      progress.level += 1;
      progress.xpToNextLevel = this.calculateXPForLevel(progress.level + 1);

      rewards.push({
        type: "xp",
        value: progress.level,
        message: `Level Up! You're now level ${progress.level}`,
      });
    }

    await StorageService.set(this.STORAGE_KEY_PROGRESS, progress);
    return rewards;
  }

  async recordProblemSolved(): Promise<Reward[]> {
    const progress = await this.getUserProgress();
    progress.totalProblemsolved += 1;

    await this.updateStreak();
    await StorageService.set(this.STORAGE_KEY_PROGRESS, progress);

    const rewards = await this.addXP(10);
    const achievements = await this.checkAchievements();

    return [...rewards, ...achievements];
  }

  async recordQuizCompleted(
    score: number,
    totalQuestions: number
  ): Promise<Reward[]> {
    const progress = await this.getUserProgress();
    progress.totalQuizzesCompleted += 1;

    await this.updateStreak();
    await StorageService.set(this.STORAGE_KEY_PROGRESS, progress);

    const xpAmount = Math.floor((score / totalQuestions) * 20);
    const rewards = await this.addXP(xpAmount);
    const achievements = await this.checkAchievements();

    return [...rewards, ...achievements];
  }

  async getAchievements(): Promise<Achievement[]> {
    const unlocked =
      (await StorageService.get<string[]>(this.STORAGE_KEY_ACHIEVEMENTS)) || [];

    return ACHIEVEMENTS.map((achievement) => {
      const isUnlocked = unlocked.includes(achievement.id);
      return {
        ...achievement,
        unlockedAt: isUnlocked ? Date.now() : undefined,
      };
    });
  }

  async getUnlockedAchievements(): Promise<Achievement[]> {
    const achievements = await this.getAchievements();
    return achievements.filter((a) => a.unlockedAt);
  }

  private async checkAchievements(): Promise<Reward[]> {
    const progress = await this.getUserProgress();
    const unlocked =
      (await StorageService.get<string[]>(this.STORAGE_KEY_ACHIEVEMENTS)) || [];
    const newUnlocked: Reward[] = [];

    // Check first problem
    if (
      progress.totalProblemsolved === 1 &&
      !unlocked.includes("first_problem")
    ) {
      unlocked.push("first_problem");
      const achievement = ACHIEVEMENTS.find((a) => a.id === "first_problem")!;
      newUnlocked.push({
        type: "achievement",
        value: achievement.id,
        message: `Achievement Unlocked: ${achievement.name}`,
      });
    }

    // Check streak
    if (progress.streak === 7 && !unlocked.includes("streak_7")) {
      unlocked.push("streak_7");
      const achievement = ACHIEVEMENTS.find((a) => a.id === "streak_7")!;
      newUnlocked.push({
        type: "achievement",
        value: achievement.id,
        message: `Achievement Unlocked: ${achievement.name}`,
      });
    }

    // Check quiz master
    if (
      progress.totalQuizzesCompleted === 10 &&
      !unlocked.includes("quiz_master")
    ) {
      unlocked.push("quiz_master");
      const achievement = ACHIEVEMENTS.find((a) => a.id === "quiz_master")!;
      newUnlocked.push({
        type: "achievement",
        value: achievement.id,
        message: `Achievement Unlocked: ${achievement.name}`,
      });
    }

    // Check problem solver
    if (
      progress.totalProblemsolved === 50 &&
      !unlocked.includes("problem_solver_50")
    ) {
      unlocked.push("problem_solver_50");
      const achievement = ACHIEVEMENTS.find(
        (a) => a.id === "problem_solver_50"
      )!;
      newUnlocked.push({
        type: "achievement",
        value: achievement.id,
        message: `Achievement Unlocked: ${achievement.name}`,
      });
    }

    if (newUnlocked.length > 0) {
      await StorageService.set(this.STORAGE_KEY_ACHIEVEMENTS, unlocked);
    }

    return newUnlocked;
  }

  private async updateStreak(): Promise<void> {
    const progress = await this.getUserProgress();
    const today = new Date().toISOString().split("T")[0];

    if (progress.lastActivityDate === today) {
      return; // Already updated today
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (progress.lastActivityDate === yesterday) {
      progress.streak += 1;
    } else if (progress.lastActivityDate !== today) {
      progress.streak = 1;
    }

    progress.lastActivityDate = today;
    await StorageService.set(this.STORAGE_KEY_PROGRESS, progress);
  }

  private createDefaultProgress(): UserProgress {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: this.XP_PER_LEVEL,
      streak: 0,
      totalProblemsolved: 0,
      totalQuizzesCompleted: 0,
    };
  }

  private calculateXPForLevel(level: number): number {
    return Math.floor(this.XP_PER_LEVEL * Math.pow(1.1, level - 1));
  }

  async resetProgress(): Promise<void> {
    await StorageService.remove(this.STORAGE_KEY_PROGRESS);
    await StorageService.remove(this.STORAGE_KEY_ACHIEVEMENTS);
  }
}

export default new GamificationService();
