import { RemindersService } from '../RemindersService';
import StorageService from '../StorageService';
import NotificationService from '../NotificationService';
import CalendarService from '../CalendarService';
import AnalyticsService from '../AnalyticsService';
import SettingsService from '../SettingsService';

jest.mock('../StorageService');
jest.mock('../NotificationService');
jest.mock('../CalendarService');
jest.mock('../AnalyticsService');
jest.mock('../SettingsService');

describe('RemindersService', () => {
  let service: RemindersService;

  beforeEach(() => {
    service = new RemindersService();
    jest.clearAllMocks();

    (SettingsService.getSettings as jest.Mock).mockResolvedValue({
      remindersEnabled: false,
      calendarSyncEnabled: false,
      reminderSettings: {
        defaultReminderTime: 30,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        reminderDays: [1, 2, 3, 4, 5],
      },
    });
  });

  describe('getStudySessions', () => {
    it('should return empty array when no sessions exist', async () => {
      (StorageService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.getStudySessions();

      expect(result).toEqual([]);
    });

    it('should return stored sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          title: 'Math Study',
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      (StorageService.get as jest.Mock).mockResolvedValue(mockSessions);

      const result = await service.getStudySessions();

      expect(result).toEqual(mockSessions);
    });
  });

  describe('createStudySession', () => {
    it('should create a session without reminders when disabled', async () => {
      (StorageService.get as jest.Mock).mockResolvedValue([]);
      (StorageService.set as jest.Mock).mockResolvedValue(undefined);

      const startTime = new Date('2024-12-01T10:00:00');
      const endTime = new Date('2024-12-01T11:00:00');

      const result = await service.createStudySession(
        'Math Study',
        startTime,
        endTime
      );

      expect(result).toMatchObject({
        title: 'Math Study',
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
      });
      expect(result.id).toBeDefined();
      expect(result.notificationId).toBeUndefined();
      expect(result.calendarEventId).toBeUndefined();
      expect(AnalyticsService.track).toHaveBeenCalledWith(
        'study_session_created',
        expect.any(Object)
      );
    });

    it('should create a session with notification when reminders enabled', async () => {
      (SettingsService.getSettings as jest.Mock).mockResolvedValue({
        remindersEnabled: true,
        calendarSyncEnabled: false,
        reminderSettings: {
          defaultReminderTime: 30,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          reminderDays: [1, 2, 3, 4, 5],
        },
      });
      (StorageService.get as jest.Mock).mockResolvedValue([]);
      (StorageService.set as jest.Mock).mockResolvedValue(undefined);
      (NotificationService.scheduleNotification as jest.Mock).mockResolvedValue(
        'notification-123'
      );

      const startTime = new Date('2024-12-01T10:00:00');
      const endTime = new Date('2024-12-01T11:00:00');

      const result = await service.createStudySession(
        'Math Study',
        startTime,
        endTime
      );

      expect(result.notificationId).toBe('notification-123');
      expect(NotificationService.scheduleNotification).toHaveBeenCalled();
    });

    it('should create a session with calendar event when sync enabled', async () => {
      (SettingsService.getSettings as jest.Mock).mockResolvedValue({
        remindersEnabled: false,
        calendarSyncEnabled: true,
        reminderSettings: {
          defaultReminderTime: 30,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          reminderDays: [1, 2, 3, 4, 5],
        },
      });
      (StorageService.get as jest.Mock).mockResolvedValue([]);
      (StorageService.set as jest.Mock).mockResolvedValue(undefined);
      (CalendarService.createEvent as jest.Mock).mockResolvedValue('event-123');

      const startTime = new Date('2024-12-01T10:00:00');
      const endTime = new Date('2024-12-01T11:00:00');

      const result = await service.createStudySession(
        'Math Study',
        startTime,
        endTime,
        { description: 'Study session', subject: 'Math' }
      );

      expect(result.calendarEventId).toBe('event-123');
      expect(CalendarService.createEvent).toHaveBeenCalled();
    });
  });

  describe('updateStudySession', () => {
    it('should update session and reschedule notification', async () => {
      const mockSession = {
        id: 'session-1',
        title: 'Math Study',
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        notificationId: 'notification-123',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (StorageService.get as jest.Mock).mockResolvedValue([mockSession]);
      (StorageService.set as jest.Mock).mockResolvedValue(undefined);
      (SettingsService.getSettings as jest.Mock).mockResolvedValue({
        remindersEnabled: true,
        calendarSyncEnabled: false,
      });
      (NotificationService.cancelNotification as jest.Mock).mockResolvedValue(
        undefined
      );
      (NotificationService.scheduleNotification as jest.Mock).mockResolvedValue(
        'notification-456'
      );

      const result = await service.updateStudySession('session-1', {
        title: 'Physics Study',
      });

      expect(result.title).toBe('Physics Study');
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith(
        'notification-123'
      );
      expect(NotificationService.scheduleNotification).toHaveBeenCalled();
    });

    it('should throw error when session not found', async () => {
      (StorageService.get as jest.Mock).mockResolvedValue([]);

      await expect(
        service.updateStudySession('nonexistent', { title: 'New Title' })
      ).rejects.toThrow('Session not found');
    });
  });

  describe('deleteStudySession', () => {
    it('should delete session and cancel notification and calendar event', async () => {
      const mockSession = {
        id: 'session-1',
        title: 'Math Study',
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        notificationId: 'notification-123',
        calendarEventId: 'event-123',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (StorageService.get as jest.Mock).mockResolvedValue([mockSession]);
      (StorageService.set as jest.Mock).mockResolvedValue(undefined);
      (NotificationService.cancelNotification as jest.Mock).mockResolvedValue(
        undefined
      );
      (CalendarService.deleteEvent as jest.Mock).mockResolvedValue(undefined);

      await service.deleteStudySession('session-1');

      expect(NotificationService.cancelNotification).toHaveBeenCalledWith(
        'notification-123'
      );
      expect(CalendarService.deleteEvent).toHaveBeenCalledWith('event-123');
      expect(StorageService.set).toHaveBeenCalledWith('study_sessions', []);
    });

    it('should throw error when session not found', async () => {
      (StorageService.get as jest.Mock).mockResolvedValue([]);

      await expect(service.deleteStudySession('nonexistent')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('getUpcomingSessions', () => {
    it('should return upcoming sessions sorted by start time', async () => {
      const now = Date.now();
      const mockSessions = [
        {
          id: 'session-1',
          title: 'Session 1',
          startTime: now + 7200000,
          endTime: now + 10800000,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'session-2',
          title: 'Session 2',
          startTime: now + 3600000,
          endTime: now + 7200000,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'session-3',
          title: 'Past Session',
          startTime: now - 3600000,
          endTime: now - 1800000,
          createdAt: now,
          updatedAt: now,
        },
      ];

      (StorageService.get as jest.Mock).mockResolvedValue(mockSessions);

      const result = await service.getUpcomingSessions();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-2');
      expect(result[1].id).toBe('session-1');
    });

    it('should limit results', async () => {
      const now = Date.now();
      const mockSessions = Array.from({ length: 15 }, (_, i) => ({
        id: `session-${i}`,
        title: `Session ${i}`,
        startTime: now + i * 3600000,
        endTime: now + (i + 1) * 3600000,
        createdAt: now,
        updatedAt: now,
      }));

      (StorageService.get as jest.Mock).mockResolvedValue(mockSessions);

      const result = await service.getUpcomingSessions(5);

      expect(result).toHaveLength(5);
    });
  });

  describe('enableReminders', () => {
    it('should enable reminders with granted permission', async () => {
      (NotificationService.requestPermissions as jest.Mock).mockResolvedValue({
        granted: true,
        status: 'granted',
      });
      (StorageService.get as jest.Mock).mockResolvedValue([]);
      (SettingsService.updateSettings as jest.Mock).mockResolvedValue(undefined);

      await service.enableReminders();

      expect(NotificationService.requestPermissions).toHaveBeenCalled();
      expect(SettingsService.updateSettings).toHaveBeenCalledWith({
        remindersEnabled: true,
      });
      expect(AnalyticsService.track).toHaveBeenCalledWith('reminders_enabled');
    });

    it('should throw error when permission denied', async () => {
      (NotificationService.requestPermissions as jest.Mock).mockResolvedValue({
        granted: false,
        status: 'denied',
      });

      await expect(service.enableReminders()).rejects.toThrow(
        'Notification permission denied'
      );
    });
  });

  describe('disableReminders', () => {
    it('should disable reminders and cancel all notifications', async () => {
      (NotificationService.cancelAllNotifications as jest.Mock).mockResolvedValue(
        undefined
      );
      (SettingsService.updateSettings as jest.Mock).mockResolvedValue(undefined);
      (StorageService.get as jest.Mock).mockResolvedValue([]);

      await service.disableReminders();

      expect(NotificationService.cancelAllNotifications).toHaveBeenCalled();
      expect(SettingsService.updateSettings).toHaveBeenCalledWith({
        remindersEnabled: false,
      });
      expect(AnalyticsService.track).toHaveBeenCalledWith('reminders_disabled');
    });
  });

  describe('enableCalendarSync', () => {
    it('should enable calendar sync with granted permission', async () => {
      (CalendarService.requestPermissions as jest.Mock).mockResolvedValue({
        granted: true,
        status: 'granted',
      });
      (StorageService.get as jest.Mock).mockResolvedValue([]);
      (SettingsService.updateSettings as jest.Mock).mockResolvedValue(undefined);

      await service.enableCalendarSync();

      expect(CalendarService.requestPermissions).toHaveBeenCalled();
      expect(SettingsService.updateSettings).toHaveBeenCalledWith({
        calendarSyncEnabled: true,
      });
      expect(AnalyticsService.track).toHaveBeenCalledWith(
        'calendar_sync_enabled'
      );
    });

    it('should throw error when permission denied', async () => {
      (CalendarService.requestPermissions as jest.Mock).mockResolvedValue({
        granted: false,
        status: 'denied',
      });

      await expect(service.enableCalendarSync()).rejects.toThrow(
        'Calendar permission denied'
      );
    });
  });

  describe('syncWithTimezone', () => {
    it('should reschedule all upcoming notifications and update calendar events', async () => {
      const now = Date.now();
      const mockSession = {
        id: 'session-1',
        title: 'Math Study',
        startTime: now + 3600000,
        endTime: now + 7200000,
        notificationId: 'notification-123',
        calendarEventId: 'event-123',
        createdAt: now,
        updatedAt: now,
      };

      (StorageService.get as jest.Mock).mockResolvedValue([mockSession]);
      (NotificationService.cancelNotification as jest.Mock).mockResolvedValue(
        undefined
      );
      (NotificationService.scheduleNotification as jest.Mock).mockResolvedValue(
        'notification-456'
      );
      (CalendarService.updateEvent as jest.Mock).mockResolvedValue(undefined);
      (StorageService.set as jest.Mock).mockResolvedValue(undefined);

      await service.syncWithTimezone();

      expect(NotificationService.cancelNotification).toHaveBeenCalledWith(
        'notification-123'
      );
      expect(NotificationService.scheduleNotification).toHaveBeenCalled();
      expect(CalendarService.updateEvent).toHaveBeenCalledWith(
        'event-123',
        expect.any(Object)
      );
      expect(AnalyticsService.track).toHaveBeenCalledWith(
        'reminders_timezone_synced'
      );
    });
  });
});
