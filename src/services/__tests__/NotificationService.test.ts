import * as Notifications from 'expo-notifications';
import { NotificationService } from '../NotificationService';

jest.mock('expo-notifications');

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    jest.clearAllMocks();
  });

  describe('requestPermissions', () => {
    it('should return granted status when permission is already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
        canAskAgain: false,
      });

      const result = await service.requestPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: false,
        status: 'granted',
      });
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should request permission when not yet granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
        canAskAgain: true,
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
        canAskAgain: false,
      });

      const result = await service.requestPermissions();

      expect(result).toEqual({
        granted: true,
        canAskAgain: false,
        status: 'granted',
      });
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle denied permission', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
        canAskAgain: true,
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
        canAskAgain: false,
      });

      const result = await service.requestPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        status: 'denied',
      });
    });

    it('should handle errors gracefully', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Permission error')
      );

      const result = await service.requestPermissions();

      expect(result).toEqual({
        granted: false,
        canAskAgain: false,
        status: 'denied',
      });
    });
  });

  describe('getPermissionStatus', () => {
    it('should return current permission status', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
        canAskAgain: false,
      });

      const result = await service.getPermissionStatus();

      expect(result).toEqual({
        granted: true,
        canAskAgain: false,
        status: 'granted',
      });
    });
  });

  describe('scheduleNotification', () => {
    it('should schedule a notification successfully', async () => {
      const mockNotificationId = 'notification-123';
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        mockNotificationId
      );

      const scheduledTime = new Date('2024-12-01T10:00:00');
      const result = await service.scheduleNotification(
        'Test Title',
        'Test Body',
        scheduledTime,
        { key: 'value' }
      );

      expect(result).toBe(mockNotificationId);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          data: { key: 'value' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'date',
          date: scheduledTime,
        },
      });
    });

    it('should handle scheduling errors', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Schedule error')
      );

      const scheduledTime = new Date();
      await expect(
        service.scheduleNotification('Title', 'Body', scheduledTime)
      ).rejects.toThrow('Schedule error');
    });
  });

  describe('cancelNotification', () => {
    it('should cancel a notification', async () => {
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(
        undefined
      );

      await service.cancelNotification('notification-123');

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        'notification-123'
      );
    });

    it('should handle cancellation errors', async () => {
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Cancel error')
      );

      await expect(
        service.cancelNotification('notification-123')
      ).rejects.toThrow('Cancel error');
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all notifications', async () => {
      (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
        undefined
      );

      await service.cancelAllNotifications();

      expect(
        Notifications.cancelAllScheduledNotificationsAsync
      ).toHaveBeenCalled();
    });
  });

  describe('getAllScheduledNotifications', () => {
    it('should return all scheduled notifications', async () => {
      const mockNotifications = [
        { identifier: '1', content: {}, trigger: {} },
        { identifier: '2', content: {}, trigger: {} },
      ];
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
        mockNotifications
      );

      const result = await service.getAllScheduledNotifications();

      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array on error', async () => {
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(
        new Error('Get error')
      );

      const result = await service.getAllScheduledNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('isWithinQuietHours', () => {
    it('should return true when time is within quiet hours', () => {
      const time = new Date('2024-01-01T23:00:00');
      const result = service.isWithinQuietHours(time, '22:00', '08:00');
      expect(result).toBe(true);
    });

    it('should return false when time is outside quiet hours', () => {
      const time = new Date('2024-01-01T12:00:00');
      const result = service.isWithinQuietHours(time, '22:00', '08:00');
      expect(result).toBe(false);
    });

    it('should handle quiet hours that do not cross midnight', () => {
      const time = new Date('2024-01-01T15:00:00');
      const result = service.isWithinQuietHours(time, '14:00', '16:00');
      expect(result).toBe(true);
    });

    it('should handle time at the start of quiet hours', () => {
      const time = new Date('2024-01-01T22:00:00');
      const result = service.isWithinQuietHours(time, '22:00', '08:00');
      expect(result).toBe(true);
    });

    it('should handle time at the end of quiet hours', () => {
      const time = new Date('2024-01-01T08:00:00');
      const result = service.isWithinQuietHours(time, '22:00', '08:00');
      expect(result).toBe(true);
    });
  });

  describe('adjustForQuietHours', () => {
    it('should adjust time to end of quiet hours', () => {
      const scheduledTime = new Date('2024-01-01T23:00:00');
      const result = service.adjustForQuietHours(scheduledTime, '08:00');
      
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(0);
    });

    it('should adjust to next day if time would be in past', () => {
      const scheduledTime = new Date('2024-01-01T10:00:00');
      const result = service.adjustForQuietHours(scheduledTime, '08:00');
      
      expect(result.getDate()).toBe(2);
      expect(result.getHours()).toBe(8);
    });
  });
});
