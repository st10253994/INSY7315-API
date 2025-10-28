/**
 * Unit Tests for Maintenance Service
 */

const maintenanceService = require('../../service/MaintenanceService');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testDbSetup');
const { generateMockUser, generateMockListing, generateMockBooking } = require('../helpers');
const { ObjectId } = require('mongodb');

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

describe('Maintenance Service', () => {
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

  describe('createMaintenanceRequest', () => {
    let mockUser;
    let mockListing;
    let mockBooking;

    beforeEach(async () => {
      mockUser = generateMockUser();
      mockListing = generateMockListing();
      mockBooking = generateMockBooking(mockUser._id, mockListing._id, {
        newBooking: {
          bookingId: 'B-0001',
          checkInDate: '2025-11-01',
          checkOutDate: '2025-11-15',
          numberOfGuests: 2,
          supportDocuments: [],
          totalPrice: 15000,
          status: 'Active',
          createdAt: new Date(),
        }
      });
      
      await db.collection('System-Users').insertOne(mockUser);
      await db.collection('Listings').insertOne(mockListing);
      await db.collection('Bookings').insertOne(mockBooking);
    });

    test('should create a maintenance request successfully', async () => {
      const requestData = {
        issue: 'Broken heating',
        description: 'The heating system is not working',
        priority: 'High',
        documentURL: ['https://example.com/photo1.jpg'],
      };

      const result = await maintenanceService.createMaintenanceRequest(
        mockUser._id.toString(),
        mockListing._id.toString(),
        requestData
      );

      expect(result).toHaveProperty('message', 'New Maintenance Request has been submitted');
      expect(result).toHaveProperty('maintenanceID');

      // Verify maintenance request in database
      const request = await db.collection('Maintenance-Requests').findOne({ _id: result.maintenanceID });
      expect(request).toBeDefined();
      expect(request.userId.toString()).toBe(mockUser._id.toString());
      expect(request.newMaintenanceRequest.issue).toBe('Broken heating');
      expect(request.newMaintenanceRequest.priority).toBe('High');
      expect(request.bookingId).toBe('B-0001');
    });

    test('should throw error when required fields are missing', async () => {
      const requestData = {
        issue: 'Broken heating',
        // Missing description and priority
      };

      await expect(
        maintenanceService.createMaintenanceRequest(
          mockUser._id.toString(),
          mockListing._id.toString(),
          requestData
        )
      ).rejects.toThrow('All data fields have to be filled in');
    });

    test('should throw error for non-existent listing', async () => {
      const fakeListingId = new ObjectId();
      const requestData = {
        issue: 'Broken heating',
        description: 'The heating system is not working',
        priority: 'High',
      };

      await expect(
        maintenanceService.createMaintenanceRequest(
          mockUser._id.toString(),
          fakeListingId.toString(),
          requestData
        )
      ).rejects.toThrow('Listing not found');
    });

    test('should throw error when no active booking exists', async () => {
      // Create a user without any active booking
      const anotherUser = generateMockUser({ email: 'another@example.com' });
      await db.collection('System-Users').insertOne(anotherUser);

      const requestData = {
        issue: 'Broken heating',
        description: 'The heating system is not working',
        priority: 'High',
      };

      await expect(
        maintenanceService.createMaintenanceRequest(
          anotherUser._id.toString(),
          mockListing._id.toString(),
          requestData
        )
      ).rejects.toThrow('There are no active bookings with the property to log the maintenance Request for');
    });

    test('should handle empty documentURL array', async () => {
      const requestData = {
        issue: 'Broken heating',
        description: 'The heating system is not working',
        priority: 'High',
        documentURL: [],
      };

      const result = await maintenanceService.createMaintenanceRequest(
        mockUser._id.toString(),
        mockListing._id.toString(),
        requestData
      );

      const request = await db.collection('Maintenance-Requests').findOne({ _id: result.maintenanceID });
      expect(request.newMaintenanceRequest.documentURL).toEqual([]);
    });

    test('should store listing details in maintenance request', async () => {
      const requestData = {
        issue: 'Broken heating',
        description: 'The heating system is not working',
        priority: 'High',
      };

      const result = await maintenanceService.createMaintenanceRequest(
        mockUser._id.toString(),
        mockListing._id.toString(),
        requestData
      );

      const request = await db.collection('Maintenance-Requests').findOne({ _id: result.maintenanceID });
      expect(request.listingDetail).toHaveProperty('listingID');
      expect(request.listingDetail).toHaveProperty('landlordID');
      expect(request.listingDetail).toHaveProperty('address');
      expect(request.listingDetail.address).toBe(mockListing.address);
    });
  });

  describe('getMaintenanceRequestForUserId', () => {
    let mockUser;

    beforeEach(async () => {
      mockUser = generateMockUser();
      await db.collection('System-Users').insertOne(mockUser);
    });

    test('should return empty array when user has no maintenance requests', async () => {
      const requests = await maintenanceService.getMaintenanceRequestForUserId(
        mockUser._id.toString()
      );
      expect(requests).toEqual([]);
    });

    test('should return all maintenance requests for a user', async () => {
      const mockRequests = [
        {
          userId: mockUser._id,
          listingDetail: {
            listingID: new ObjectId(),
            landlordID: mockUser._id.toString(),
            address: '123 Test St',
          },
          bookingId: 'B-0001',
          newMaintenanceRequest: {
            maintenanceId: 'M-0001',
            issue: 'Broken heating',
            description: 'Not working',
            priority: 'High',
            documentURL: [],
            createdAt: new Date(),
          },
        },
        {
          userId: mockUser._id,
          listingDetail: {
            listingID: new ObjectId(),
            landlordID: mockUser._id.toString(),
            address: '456 Test Ave',
          },
          bookingId: 'B-0002',
          newMaintenanceRequest: {
            maintenanceId: 'M-0002',
            issue: 'Leaky faucet',
            description: 'Water dripping',
            priority: 'Medium',
            documentURL: [],
            createdAt: new Date(),
          },
        },
      ];
      
      await db.collection('Maintenance-Requests').insertMany(mockRequests);

      const requests = await maintenanceService.getMaintenanceRequestForUserId(
        mockUser._id.toString()
      );
      
      expect(requests).toHaveLength(2);
      expect(requests[0]).toHaveProperty('newMaintenanceRequest');
      expect(requests[0].newMaintenanceRequest).toHaveProperty('issue');
    });

    test('should only return requests for specified user', async () => {
      const anotherUser = generateMockUser({ email: 'another@example.com' });
      await db.collection('System-Users').insertOne(anotherUser);

      const mockRequests = [
        {
          userId: mockUser._id,
          listingDetail: {
            listingID: new ObjectId(),
            landlordID: mockUser._id.toString(),
            address: '123 Test St',
          },
          bookingId: 'B-0001',
          newMaintenanceRequest: {
            maintenanceId: 'M-0001',
            issue: 'Broken heating',
            description: 'Not working',
            priority: 'High',
            documentURL: [],
            createdAt: new Date(),
          },
        },
        {
          userId: anotherUser._id,
          listingDetail: {
            listingID: new ObjectId(),
            landlordID: anotherUser._id.toString(),
            address: '456 Test Ave',
          },
          bookingId: 'B-0002',
          newMaintenanceRequest: {
            maintenanceId: 'M-0002',
            issue: 'Leaky faucet',
            description: 'Water dripping',
            priority: 'Medium',
            documentURL: [],
            createdAt: new Date(),
          },
        },
      ];
      
      await db.collection('Maintenance-Requests').insertMany(mockRequests);

      const requests = await maintenanceService.getMaintenanceRequestForUserId(
        mockUser._id.toString()
      );
      
      expect(requests).toHaveLength(1);
      expect(requests[0].userId.toString()).toBe(mockUser._id.toString());
    });
  });
});
