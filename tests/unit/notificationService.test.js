/**
 * Unit Tests for Notification Service
 */

const notificationService = require('../../service/notificationService');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testDbSetup');

// Mock the database client
jest.mock('../../database/db', () => {
  const actualDb = jest.requireActual('../../database/db');
  return {
    ...actualDb,
    client: {
      db: jest.fn(),
    },
  };
});

describe('Notification Service', () => {
  let db;
  let mockClient;

  beforeAll(async () => {
    const testDB = await connectTestDB();
    db = testDB.db;
    
    mockClient = require('../../database/db').client;
    mockClient.db.mockReturnValue(db);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('createNotification', () => {
    test('should create a notification successfully', async () => {
      const notificationData = {
        title: 'Test Notification',
        notificationMessage: 'This is a test notification message',
      };

      const result = await notificationService.createNotification(notificationData);

      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('title', 'Test Notification');
      expect(result).toHaveProperty('notificationMessage', 'This is a test notification message');
      expect(result).toHaveProperty('isRead', false);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('message', 'Notification inserted Successfully');

      // Verify notification in database
      const notification = await db.collection('System-Notifications').findOne({ _id: result._id });
      expect(notification).toBeDefined();
      expect(notification.title).toBe('Test Notification');
      expect(notification.read).toBe(false);
    });

    test('should throw error when title is missing', async () => {
      const notificationData = {
        notificationMessage: 'This is a test notification message',
      };

      await expect(
        notificationService.createNotification(notificationData)
      ).rejects.toThrow('Missing required fields');
    });

    test('should throw error when notificationMessage is missing', async () => {
      const notificationData = {
        title: 'Test Notification',
      };

      await expect(
        notificationService.createNotification(notificationData)
      ).rejects.toThrow('Missing required fields');
    });

    test('should set notification as unread by default', async () => {
      const notificationData = {
        title: 'Test Notification',
        notificationMessage: 'This is a test notification message',
      };

      const result = await notificationService.createNotification(notificationData);

      const notification = await db.collection('System-Notifications').findOne({ _id: result._id });
      expect(notification.read).toBe(false);
    });

    test('should include timestamp', async () => {
      const notificationData = {
        title: 'Test Notification',
        notificationMessage: 'This is a test notification message',
      };

      const result = await notificationService.createNotification(notificationData);

      expect(result.createdAt).toBeDefined();
      expect(typeof result.createdAt).toBe('string');
      expect(new Date(result.createdAt).toString()).not.toBe('Invalid Date');
    });
  });

  describe('getAllNotifications', () => {
    test('should return empty array when no notifications exist', async () => {
      const notifications = await notificationService.getAllNotifications();
      expect(notifications).toEqual([]);
    });

    test('should return all notifications', async () => {
      const mockNotifications = [
        {
          title: 'Notification 1',
          notificationMessage: 'Message 1',
          read: false,
          time: new Date().toISOString(),
        },
        {
          title: 'Notification 2',
          notificationMessage: 'Message 2',
          read: false,
          time: new Date().toISOString(),
        },
        {
          title: 'Notification 3',
          notificationMessage: 'Message 3',
          read: true,
          time: new Date().toISOString(),
        },
      ];
      
      await db.collection('System-Notifications').insertMany(mockNotifications);

      const notifications = await notificationService.getAllNotifications();
      
      expect(notifications).toHaveLength(3);
      expect(notifications[0]).toHaveProperty('title');
      expect(notifications[0]).toHaveProperty('notificationMessage');
      expect(notifications[0]).toHaveProperty('read');
      expect(notifications[0]).toHaveProperty('time');
    });

    test('should return both read and unread notifications', async () => {
      const mockNotifications = [
        {
          title: 'Unread Notification',
          notificationMessage: 'Unread message',
          read: false,
          time: new Date().toISOString(),
        },
        {
          title: 'Read Notification',
          notificationMessage: 'Read message',
          read: true,
          time: new Date().toISOString(),
        },
      ];
      
      await db.collection('System-Notifications').insertMany(mockNotifications);

      const notifications = await notificationService.getAllNotifications();
      
      expect(notifications).toHaveLength(2);
      
      const readNotification = notifications.find(n => n.title === 'Read Notification');
      const unreadNotification = notifications.find(n => n.title === 'Unread Notification');
      
      expect(readNotification.read).toBe(true);
      expect(unreadNotification.read).toBe(false);
    });
  });
});
