import StorageService from "./StorageService";
import { StudyPlan, FollowUpTask } from "../types";

class StudyPlanService {
  private studyPlansKey = "study_plans";
  private followUpTasksKey = "follow_up_tasks";

  async getStudyPlanForStudent(studentId: string): Promise<StudyPlan | null> {
    const plans = await StorageService.get<StudyPlan[]>(this.studyPlansKey);
    if (!plans) {
      return null;
    }
    return plans.find((p) => p.studentId === studentId) || null;
  }

  async createStudyPlan(studentId: string): Promise<StudyPlan> {
    const existingPlan = await this.getStudyPlanForStudent(studentId);
    if (existingPlan) {
      return existingPlan;
    }

    const plan: StudyPlan = {
      id: this.generateId(),
      studentId,
      tasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const plans = await StorageService.get<StudyPlan[]>(this.studyPlansKey);
    const allPlans = plans || [];
    allPlans.push(plan);
    await StorageService.set(this.studyPlansKey, allPlans);
    return plan;
  }

  async addTaskToPlan(
    studentId: string,
    sessionId: string,
    title: string,
    description: string,
    assignedBy: string,
    subject?: string,
    difficulty?: "easy" | "medium" | "hard",
    dueDate?: number
  ): Promise<FollowUpTask> {
    let plan = await this.getStudyPlanForStudent(studentId);
    if (!plan) {
      plan = await this.createStudyPlan(studentId);
    }

    const task: FollowUpTask = {
      id: this.generateId(),
      sessionId,
      studentId,
      title,
      description,
      subject,
      difficulty,
      dueDate,
      completed: false,
      assignedBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const allTasks = await StorageService.get<FollowUpTask[]>(
      this.followUpTasksKey
    );
    const tasks = allTasks || [];
    tasks.push(task);
    await StorageService.set(this.followUpTasksKey, tasks);

    plan.tasks.push(task);
    await this.updateStudyPlan(plan.id, { tasks: plan.tasks });

    return task;
  }

  async getTasksForStudent(studentId: string): Promise<FollowUpTask[]> {
    const allTasks = await StorageService.get<FollowUpTask[]>(
      this.followUpTasksKey
    );
    return (allTasks || []).filter((t) => t.studentId === studentId);
  }

  async getTaskById(taskId: string): Promise<FollowUpTask | null> {
    const allTasks = await StorageService.get<FollowUpTask[]>(
      this.followUpTasksKey
    );
    return (allTasks || []).find((t) => t.id === taskId) || null;
  }

  async updateTask(
    taskId: string,
    updates: Partial<FollowUpTask>
  ): Promise<FollowUpTask> {
    const allTasks = await StorageService.get<FollowUpTask[]>(
      this.followUpTasksKey
    );
    const tasks = allTasks || [];
    const index = tasks.findIndex((t) => t.id === taskId);

    if (index === -1) {
      throw new Error("Task not found");
    }

    const updated: FollowUpTask = {
      ...tasks[index],
      ...updates,
      id: taskId,
      updatedAt: Date.now(),
    };

    tasks[index] = updated;
    await StorageService.set(this.followUpTasksKey, tasks);

    const plan = await this.getStudyPlanForStudent(tasks[index].studentId);
    if (plan) {
      const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        plan.tasks[taskIndex] = updated;
        await this.updateStudyPlan(plan.id, { tasks: plan.tasks });
      }
    }

    return updated;
  }

  async completeTask(taskId: string): Promise<FollowUpTask> {
    return await this.updateTask(taskId, { completed: true });
  }

  async deleteTask(taskId: string): Promise<void> {
    const allTasks = await StorageService.get<FollowUpTask[]>(
      this.followUpTasksKey
    );
    const tasks = allTasks || [];
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    const filtered = tasks.filter((t) => t.id !== taskId);
    await StorageService.set(this.followUpTasksKey, filtered);

    const plan = await this.getStudyPlanForStudent(task.studentId);
    if (plan) {
      plan.tasks = plan.tasks.filter((t) => t.id !== taskId);
      await this.updateStudyPlan(plan.id, { tasks: plan.tasks });
    }
  }

  async updateStudyPlan(
    planId: string,
    updates: Partial<StudyPlan>
  ): Promise<StudyPlan> {
    const plans = await StorageService.get<StudyPlan[]>(this.studyPlansKey);
    const allPlans = plans || [];
    const index = allPlans.findIndex((p) => p.id === planId);

    if (index === -1) {
      throw new Error("Study plan not found");
    }

    const updated: StudyPlan = {
      ...allPlans[index],
      ...updates,
      id: planId,
      updatedAt: Date.now(),
    };

    allPlans[index] = updated;
    await StorageService.set(this.studyPlansKey, allPlans);
    return updated;
  }

  async getPendingTasksForStudent(studentId: string): Promise<FollowUpTask[]> {
    const tasks = await this.getTasksForStudent(studentId);
    return tasks.filter((t) => !t.completed);
  }

  async getCompletedTasksForStudent(
    studentId: string
  ): Promise<FollowUpTask[]> {
    const tasks = await this.getTasksForStudent(studentId);
    return tasks.filter((t) => t.completed);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new StudyPlanService();
