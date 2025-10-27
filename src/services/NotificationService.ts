import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PermissionStatus } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  async requestPermissions(): Promise<PermissionStatus> {
    try {
      const existingPermission = await Notifications.getPermissionsAsync() as any;
      
      let finalStatus = existingPermission.granted ? 'granted' : existingPermission.canAskAgain ? 'undetermined' : 'denied';
      
      if (!existingPermission.granted && existingPermission.canAskAgain) {
        const permission = await Notifications.requestPermissionsAsync() as any;
        finalStatus = permission.granted ? 'granted' : permission.canAskAgain ? 'undetermined' : 'denied';
      }

      const granted = finalStatus === 'granted';
      const canAskAgain = finalStatus === 'undetermined';

      return {
        granted,
        canAskAgain,
        status: finalStatus as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    try {
      const permission = await Notifications.getPermissionsAsync() as any;
      const status = permission.granted ? 'granted' : permission.canAskAgain ? 'undetermined' : 'denied';
      const granted = status === 'granted';
      const canAskAgain = status === 'undetermined';

      return {
        granted,
        canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error getting notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async scheduleNotification(
    title: string,
    body: string,
    scheduledTime: Date,
    data?: Record<string, any>
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'date' as any,
          date: scheduledTime,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      throw error;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      throw error;
    }
  }

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async openSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.getPermissionsAsync();
    }
  }

  isWithinQuietHours(
    time: Date,
    quietHoursStart: string,
    quietHoursEnd: string
  ): boolean {
    const timeHours = time.getHours();
    const timeMinutes = time.getMinutes();
    const timeInMinutes = timeHours * 60 + timeMinutes;

    const [startHours, startMinutes] = quietHoursStart.split(':').map(Number);
    const startInMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = quietHoursEnd.split(':').map(Number);
    const endInMinutes = endHours * 60 + endMinutes;

    if (startInMinutes <= endInMinutes) {
      return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
    } else {
      return timeInMinutes >= startInMinutes || timeInMinutes <= endInMinutes;
    }
  }

  adjustForQuietHours(
    scheduledTime: Date,
    quietHoursEnd: string
  ): Date {
    const adjustedTime = new Date(scheduledTime);
    const [endHours, endMinutes] = quietHoursEnd.split(':').map(Number);
    
    adjustedTime.setHours(endHours, endMinutes, 0, 0);
    
    if (adjustedTime <= scheduledTime) {
      adjustedTime.setDate(adjustedTime.getDate() + 1);
    }
    
    return adjustedTime;
  }
}

export default new NotificationService();
