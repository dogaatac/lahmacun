import { AppState, AppStateStatus } from "react-native";

export interface BackgroundTask {
  id: string;
  name: string;
  status: "running" | "paused" | "completed" | "failed";
  progress: number;
  createdAt: number;
  updatedAt: number;
  onResume?: () => Promise<void>;
  onPause?: () => Promise<void>;
}

export class BackgroundTaskManager {
  private tasks: Map<string, BackgroundTask> = new Map();
  private appStateSubscription: any = null;
  private currentAppState: AppStateStatus = "active";
  private listeners: Map<string, (task: BackgroundTask) => void> = new Map();

  constructor() {
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange
    );
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      this.currentAppState.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      await this.resumeAllTasks();
    } else if (
      this.currentAppState === "active" &&
      nextAppState.match(/inactive|background/)
    ) {
      await this.pauseAllTasks();
    }

    this.currentAppState = nextAppState;
  };

  registerTask(
    id: string,
    name: string,
    onResume?: () => Promise<void>,
    onPause?: () => Promise<void>
  ): void {
    const task: BackgroundTask = {
      id,
      name,
      status: "running",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      onResume,
      onPause,
    };

    this.tasks.set(id, task);
    this.notifyListeners(id);
  }

  updateTaskProgress(id: string, progress: number): void {
    const task = this.tasks.get(id);
    if (task) {
      task.progress = progress;
      task.updatedAt = Date.now();

      if (progress >= 100) {
        task.status = "completed";
      }

      this.tasks.set(id, task);
      this.notifyListeners(id);
    }
  }

  updateTaskStatus(
    id: string,
    status: "running" | "paused" | "completed" | "failed"
  ): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
      task.updatedAt = Date.now();
      this.tasks.set(id, task);
      this.notifyListeners(id);
    }
  }

  async pauseTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task && task.status === "running") {
      if (task.onPause) {
        await task.onPause();
      }
      task.status = "paused";
      task.updatedAt = Date.now();
      this.tasks.set(id, task);
      this.notifyListeners(id);
    }
  }

  async resumeTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task && task.status === "paused") {
      if (task.onResume) {
        await task.onResume();
      }
      task.status = "running";
      task.updatedAt = Date.now();
      this.tasks.set(id, task);
      this.notifyListeners(id);
    }
  }

  private async pauseAllTasks(): Promise<void> {
    const pausePromises: Promise<void>[] = [];

    for (const [id, task] of this.tasks) {
      if (task.status === "running") {
        pausePromises.push(this.pauseTask(id));
      }
    }

    await Promise.all(pausePromises);
  }

  private async resumeAllTasks(): Promise<void> {
    const resumePromises: Promise<void>[] = [];

    for (const [id, task] of this.tasks) {
      if (task.status === "paused") {
        resumePromises.push(this.resumeTask(id));
      }
    }

    await Promise.all(resumePromises);
  }

  removeTask(id: string): void {
    this.tasks.delete(id);
    this.listeners.delete(id);
  }

  getTask(id: string): BackgroundTask | null {
    return this.tasks.get(id) || null;
  }

  getAllTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values());
  }

  subscribeToTask(
    id: string,
    listener: (task: BackgroundTask) => void
  ): () => void {
    this.listeners.set(id, listener);
    return () => {
      this.listeners.delete(id);
    };
  }

  private notifyListeners(id: string): void {
    const task = this.tasks.get(id);
    const listener = this.listeners.get(id);

    if (task && listener) {
      listener(task);
    }
  }

  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.tasks.clear();
    this.listeners.clear();
  }
}

export default new BackgroundTaskManager();
