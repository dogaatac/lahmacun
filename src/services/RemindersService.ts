import StorageService from './StorageService';
import NotificationService from './NotificationService';
import CalendarService from './CalendarService';
import AnalyticsService from './AnalyticsService';
import SettingsService from './SettingsService';
import { StudySession, ReminderNotification } from '../types';

export class RemindersService {
  private readonly STORAGE_KEY_SESSIONS = 'study_sessions';
  private readonly STORAGE_KEY_REMINDERS = 'reminder_notifications';

  async getStudySessions(): Promise<StudySession[]> {
    const sessions = await StorageService.get<StudySession[]>(
      this.STORAGE_KEY_SESSIONS
    );
    return sessions || [];
  }

  async createStudySession(
    title: string,
    startTime: Date,
    endTime: Date,
    options?: {
      description?: string;
      subject?: string;
    }
  ): Promise<StudySession> {
    try {
      const settings = await SettingsService.getSettings();
      const sessions = await this.getStudySessions();

      const session: StudySession = {
        id: this.generateId(),
        title,
        description: options?.description,
        subject: options?.subject,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (settings.remindersEnabled) {
        const notificationId = await this.scheduleReminder(session);
        session.notificationId = notificationId;
      }

      if (settings.calendarSyncEnabled) {
        const calendarEventId = await CalendarService.createEvent(session);
        if (calendarEventId) {
          session.calendarEventId = calendarEventId;
        }
      }

      sessions.push(session);
      await StorageService.set(this.STORAGE_KEY_SESSIONS, sessions);

      AnalyticsService.track('study_session_created', {
        sessionId: session.id,
        subject: session.subject,
        hasReminder: !!session.notificationId,
        hasCalendarEvent: !!session.calendarEventId,
      });

      return session;
    } catch (error) {
      console.error('Error creating study session:', error);
      throw error;
    }
  }

  async updateStudySession(
    sessionId: string,
    updates: Partial<StudySession>
  ): Promise<StudySession> {
    try {
      const settings = await SettingsService.getSettings();
      const sessions = await this.getStudySessions();
      const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }

      const existingSession = sessions[sessionIndex];
      const updatedSession: StudySession = {
        ...existingSession,
        ...updates,
        updatedAt: Date.now(),
      };

      if (existingSession.notificationId && settings.remindersEnabled) {
        await NotificationService.cancelNotification(
          existingSession.notificationId
        );
        const newNotificationId = await this.scheduleReminder(updatedSession);
        updatedSession.notificationId = newNotificationId;
      }

      if (existingSession.calendarEventId && settings.calendarSyncEnabled) {
        await CalendarService.updateEvent(
          existingSession.calendarEventId,
          updatedSession
        );
      }

      sessions[sessionIndex] = updatedSession;
      await StorageService.set(this.STORAGE_KEY_SESSIONS, sessions);

      AnalyticsService.track('study_session_updated', {
        sessionId: updatedSession.id,
      });

      return updatedSession;
    } catch (error) {
      console.error('Error updating study session:', error);
      throw error;
    }
  }

  async deleteStudySession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getStudySessions();
      const session = sessions.find((s) => s.id === sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.notificationId) {
        await NotificationService.cancelNotification(session.notificationId);
      }

      if (session.calendarEventId) {
        await CalendarService.deleteEvent(session.calendarEventId);
      }

      const filteredSessions = sessions.filter((s) => s.id !== sessionId);
      await StorageService.set(this.STORAGE_KEY_SESSIONS, filteredSessions);

      AnalyticsService.track('study_session_deleted', {
        sessionId: session.id,
      });
    } catch (error) {
      console.error('Error deleting study session:', error);
      throw error;
    }
  }

  async getUpcomingSessions(limit: number = 10): Promise<StudySession[]> {
    const sessions = await this.getStudySessions();
    const now = Date.now();
    
    return sessions
      .filter((s) => s.startTime > now)
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, limit);
  }

  async enableReminders(): Promise<void> {
    const permissionStatus = await NotificationService.requestPermissions();
    
    if (!permissionStatus.granted) {
      throw new Error('Notification permission denied');
    }

    await SettingsService.updateSettings({ remindersEnabled: true });

    const sessions = await this.getUpcomingSessions();
    for (const session of sessions) {
      if (!session.notificationId) {
        const notificationId = await this.scheduleReminder(session);
        await this.updateStudySession(session.id, {
          notificationId,
        });
      }
    }

    AnalyticsService.track('reminders_enabled');
  }

  async disableReminders(): Promise<void> {
    await NotificationService.cancelAllNotifications();
    await SettingsService.updateSettings({ remindersEnabled: false });

    const sessions = await this.getStudySessions();
    for (const session of sessions) {
      if (session.notificationId) {
        await this.updateStudySession(session.id, {
          notificationId: undefined,
        });
      }
    }

    AnalyticsService.track('reminders_disabled');
  }

  async enableCalendarSync(): Promise<void> {
    const permissionStatus = await CalendarService.requestPermissions();
    
    if (!permissionStatus.granted) {
      throw new Error('Calendar permission denied');
    }

    await SettingsService.updateSettings({ calendarSyncEnabled: true });

    const sessions = await this.getUpcomingSessions();
    for (const session of sessions) {
      if (!session.calendarEventId) {
        const calendarEventId = await CalendarService.createEvent(session);
        if (calendarEventId) {
          await this.updateStudySession(session.id, {
            calendarEventId,
          });
        }
      }
    }

    AnalyticsService.track('calendar_sync_enabled');
  }

  async disableCalendarSync(): Promise<void> {
    await SettingsService.updateSettings({ calendarSyncEnabled: false });

    const sessions = await this.getStudySessions();
    for (const session of sessions) {
      if (session.calendarEventId) {
        await CalendarService.deleteEvent(session.calendarEventId);
        await this.updateStudySession(session.id, {
          calendarEventId: undefined,
        });
      }
    }

    AnalyticsService.track('calendar_sync_disabled');
  }

  private async scheduleReminder(session: StudySession): Promise<string> {
    const settings = await SettingsService.getSettings();
    const reminderSettings = settings.reminderSettings;

    let scheduledTime = new Date(session.startTime);
    
    if (reminderSettings?.defaultReminderTime) {
      scheduledTime = new Date(
        session.startTime - reminderSettings.defaultReminderTime * 60 * 1000
      );
    } else {
      scheduledTime = new Date(session.startTime - 30 * 60 * 1000);
    }

    if (
      reminderSettings?.quietHoursEnabled &&
      reminderSettings.quietHoursStart &&
      reminderSettings.quietHoursEnd
    ) {
      if (
        NotificationService.isWithinQuietHours(
          scheduledTime,
          reminderSettings.quietHoursStart,
          reminderSettings.quietHoursEnd
        )
      ) {
        scheduledTime = NotificationService.adjustForQuietHours(
          scheduledTime,
          reminderSettings.quietHoursEnd
        );
      }
    }

    const notificationId = await NotificationService.scheduleNotification(
      `Study Session: ${session.title}`,
      session.description || 'Time to study!',
      scheduledTime,
      {
        sessionId: session.id,
        type: 'study_session',
      }
    );

    return notificationId;
  }

  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async syncWithTimezone(): Promise<void> {
    const sessions = await this.getUpcomingSessions();
    
    for (const session of sessions) {
      if (session.notificationId) {
        await NotificationService.cancelNotification(session.notificationId);
        const newNotificationId = await this.scheduleReminder(session);
        await this.updateStudySession(session.id, {
          notificationId: newNotificationId,
        });
      }

      if (session.calendarEventId) {
        await CalendarService.updateEvent(session.calendarEventId, session);
      }
    }

    AnalyticsService.track('reminders_timezone_synced');
  }
}

export default new RemindersService();
