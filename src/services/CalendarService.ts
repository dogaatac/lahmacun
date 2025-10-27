import RNCalendarEvents from 'react-native-calendar-events';
import { Platform } from 'react-native';
import { PermissionStatus, StudySession } from '../types';

export class CalendarService {
  async requestPermissions(): Promise<PermissionStatus> {
    try {
      const status = await RNCalendarEvents.requestPermissions();
      
      const granted = status === 'authorized';
      const canAskAgain = status === 'undetermined';

      return {
        granted,
        canAskAgain,
        status: granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied',
      };
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    try {
      const status = await RNCalendarEvents.checkPermissions();
      
      const granted = status === 'authorized';
      const canAskAgain = status === 'undetermined';

      return {
        granted,
        canAskAgain,
        status: granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied',
      };
    } catch (error) {
      console.error('Error getting calendar permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async findOrCreateCalendar(): Promise<string | null> {
    try {
      const calendars = await RNCalendarEvents.findCalendars();
      
      const existingCalendar = calendars.find(
        (cal: any) => cal.title === 'Study Reminders' || cal.isPrimary
      );

      if (existingCalendar) {
        return existingCalendar.id;
      }

      if (Platform.OS === 'ios') {
        const defaultCalendar = calendars.find((cal: any) => cal.allowsModifications);
        return defaultCalendar?.id || null;
      }

      const newCalendarId = await RNCalendarEvents.saveCalendar({
        title: 'Study Reminders',
        color: '#007AFF',
        entityType: 'event' as any,
        sourceId: undefined,
        source: {
          name: 'Study App',
          type: 'local' as any,
          isLocalAccount: true,
        } as any,
        name: 'Study Reminders',
        accessLevel: 'owner' as any,
        ownerAccount: 'personal' as any,
      } as any);

      return newCalendarId;
    } catch (error) {
      console.error('Error finding/creating calendar:', error);
      return null;
    }
  }

  async createEvent(session: StudySession): Promise<string | null> {
    try {
      const calendarId = await this.findOrCreateCalendar();
      
      if (!calendarId) {
        throw new Error('No calendar available');
      }

      const eventId = await RNCalendarEvents.saveEvent(session.title, {
        calendarId,
        startDate: new Date(session.startTime).toISOString(),
        endDate: new Date(session.endTime).toISOString(),
        notes: session.description,
        location: session.subject || '',
        alarms: [
          {
            date: -30,
            structuredLocation: {
              title: '',
              proximity: 'none' as any,
              radius: 0,
              coords: {
                latitude: 0,
                longitude: 0,
              },
            } as any,
          } as any,
        ] as any,
      } as any);

      return eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async updateEvent(
    eventId: string,
    session: StudySession
  ): Promise<void> {
    try {
      await RNCalendarEvents.saveEvent(session.title, {
        id: eventId,
        startDate: new Date(session.startTime).toISOString(),
        endDate: new Date(session.endTime).toISOString(),
        notes: session.description,
        location: session.subject || '',
        alarms: [
          {
            date: -30,
          } as any,
        ] as any,
      } as any);
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await RNCalendarEvents.removeEvent(eventId);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const calendarId = await this.findOrCreateCalendar();
      
      if (!calendarId) {
        return [];
      }

      const events = await RNCalendarEvents.fetchAllEvents(
        startDate.toISOString(),
        endDate.toISOString(),
        [calendarId]
      );
      return events;
    } catch (error) {
      console.error('Error getting calendar events:', error);
      return [];
    }
  }

  formatTimeWithTimezone(time: Date): string {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return time.toLocaleString('en-US', { timeZone: timezone });
  }

  adjustForTimezone(time: Date): Date {
    const localTime = new Date(time);
    const offset = localTime.getTimezoneOffset();
    localTime.setMinutes(localTime.getMinutes() - offset);
    return localTime;
  }
}

export default new CalendarService();
