import StorageService from "./StorageService";
import { StudentSession, SessionAnnotation, TeacherFeedback } from "../types";

class SessionService {
  private sessionsKey = "student_sessions";
  private annotationsKey = "session_annotations";
  private feedbackKey = "teacher_feedback";

  async getAllSessions(): Promise<StudentSession[]> {
    const sessions = await StorageService.get<StudentSession[]>(this.sessionsKey);
    return sessions || [];
  }

  async getSessionById(sessionId: string): Promise<StudentSession | null> {
    const sessions = await this.getAllSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  }

  async getSessionsByStudent(studentId: string): Promise<StudentSession[]> {
    const sessions = await this.getAllSessions();
    return sessions.filter((s) => s.studentId === studentId);
  }

  async createSession(
    studentId: string,
    studentName: string,
    problemId: string,
    problemTitle: string,
    subject?: string,
    difficulty?: "easy" | "medium" | "hard"
  ): Promise<StudentSession> {
    const session: StudentSession = {
      id: this.generateId(),
      studentId,
      studentName,
      problemId,
      problemTitle,
      subject,
      difficulty,
      startTime: Date.now(),
      completed: false,
      flaggedDifficulties: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sessions = await this.getAllSessions();
    sessions.push(session);
    await StorageService.set(this.sessionsKey, sessions);
    return session;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<StudentSession>
  ): Promise<StudentSession> {
    const sessions = await this.getAllSessions();
    const index = sessions.findIndex((s) => s.id === sessionId);

    if (index === -1) {
      throw new Error("Session not found");
    }

    const updated: StudentSession = {
      ...sessions[index],
      ...updates,
      id: sessionId,
      updatedAt: Date.now(),
    };

    sessions[index] = updated;
    await StorageService.set(this.sessionsKey, sessions);
    return updated;
  }

  async completeSession(
    sessionId: string,
    accuracy?: number
  ): Promise<StudentSession> {
    return await this.updateSession(sessionId, {
      completed: true,
      endTime: Date.now(),
      accuracy,
    });
  }

  async flagDifficulty(
    sessionId: string,
    difficulty: string
  ): Promise<StudentSession> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.flaggedDifficulties.includes(difficulty)) {
      session.flaggedDifficulties.push(difficulty);
    }

    return await this.updateSession(sessionId, {
      flaggedDifficulties: session.flaggedDifficulties,
    });
  }

  async getAnnotationsForSession(
    sessionId: string
  ): Promise<SessionAnnotation[]> {
    const allAnnotations = await StorageService.get<SessionAnnotation[]>(
      this.annotationsKey
    );
    return (allAnnotations || []).filter((a) => a.sessionId === sessionId);
  }

  async addAnnotation(
    sessionId: string,
    teacherId: string,
    type: "text" | "highlight" | "note" | "correction",
    content: string,
    position?: { x: number; y: number },
    sharedWithStudent: boolean = false
  ): Promise<SessionAnnotation> {
    const annotation: SessionAnnotation = {
      id: this.generateId(),
      sessionId,
      teacherId,
      type,
      content,
      position,
      sharedWithStudent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const allAnnotations = await StorageService.get<SessionAnnotation[]>(
      this.annotationsKey
    );
    const annotations = allAnnotations || [];
    annotations.push(annotation);
    await StorageService.set(this.annotationsKey, annotations);
    return annotation;
  }

  async updateAnnotation(
    annotationId: string,
    updates: Partial<SessionAnnotation>
  ): Promise<SessionAnnotation> {
    const allAnnotations = await StorageService.get<SessionAnnotation[]>(
      this.annotationsKey
    );
    const annotations = allAnnotations || [];
    const index = annotations.findIndex((a) => a.id === annotationId);

    if (index === -1) {
      throw new Error("Annotation not found");
    }

    const updated: SessionAnnotation = {
      ...annotations[index],
      ...updates,
      id: annotationId,
      updatedAt: Date.now(),
    };

    annotations[index] = updated;
    await StorageService.set(this.annotationsKey, annotations);
    return updated;
  }

  async shareAnnotation(annotationId: string): Promise<SessionAnnotation> {
    return await this.updateAnnotation(annotationId, {
      sharedWithStudent: true,
    });
  }

  async getFeedbackForSession(sessionId: string): Promise<TeacherFeedback[]> {
    const allFeedback = await StorageService.get<TeacherFeedback[]>(
      this.feedbackKey
    );
    return (allFeedback || []).filter((f) => f.sessionId === sessionId);
  }

  async addFeedback(
    sessionId: string,
    teacherId: string,
    type: "audio" | "video" | "text",
    content?: string,
    filePath?: string,
    duration?: number,
    sharedWithStudent: boolean = false
  ): Promise<TeacherFeedback> {
    const feedback: TeacherFeedback = {
      id: this.generateId(),
      sessionId,
      teacherId,
      type,
      content,
      filePath,
      duration,
      sharedWithStudent,
      createdAt: Date.now(),
    };

    const allFeedback = await StorageService.get<TeacherFeedback[]>(
      this.feedbackKey
    );
    const feedbackList = allFeedback || [];
    feedbackList.push(feedback);
    await StorageService.set(this.feedbackKey, feedbackList);
    return feedback;
  }

  async shareFeedback(feedbackId: string): Promise<TeacherFeedback> {
    const allFeedback = await StorageService.get<TeacherFeedback[]>(
      this.feedbackKey
    );
    const feedbackList = allFeedback || [];
    const index = feedbackList.findIndex((f) => f.id === feedbackId);

    if (index === -1) {
      throw new Error("Feedback not found");
    }

    feedbackList[index] = {
      ...feedbackList[index],
      sharedWithStudent: true,
    };

    await StorageService.set(this.feedbackKey, feedbackList);
    return feedbackList[index];
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.getAllSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    await StorageService.set(this.sessionsKey, filtered);

    const allAnnotations = await StorageService.get<SessionAnnotation[]>(
      this.annotationsKey
    );
    if (allAnnotations) {
      const filteredAnnotations = allAnnotations.filter(
        (a) => a.sessionId !== sessionId
      );
      await StorageService.set(this.annotationsKey, filteredAnnotations);
    }

    const allFeedback = await StorageService.get<TeacherFeedback[]>(
      this.feedbackKey
    );
    if (allFeedback) {
      const filteredFeedback = allFeedback.filter(
        (f) => f.sessionId !== sessionId
      );
      await StorageService.set(this.feedbackKey, filteredFeedback);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new SessionService();
