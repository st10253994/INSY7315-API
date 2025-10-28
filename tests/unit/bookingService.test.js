/**
 * Unit Tests for Booking Service
 */

const bookingService = require('../../service/bookingService');
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

describe('Booking Service', () => {
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

  describe('createBooking', () => {
    let mockUser;
    let mockListing;

    beforeEach(async () => {
      mockUser = generateMockUser();
      mockListing = generateMockListing();
      
      await db.collection('System-Users').insertOne(mockUser);
      await db.collection('Listings').insertOne(mockListing);
    });

    test('should create a booking successfully', async () => {
      const bookingData = {
        checkInDate: '2025-11-01',
        checkOutDate: '2025-11-15',
        numberOfGuests: 2,
        supportDocuments: ['https://example.com/doc1.pdf'],
        totalPrice: '15000',
      };

      const result = await bookingService.createBooking(
        mockUser._id.toString(),
        mockListing._id.toString(),
        bookingData
      );

      expect(result).toHaveProperty('message', 'Booking created');
      expect(result).toHaveProperty('bookingID');

      // Verify booking in database
      const booking = await db.collection('Bookings').findOne({ _id: result.bookingID });
      expect(booking).toBeDefined();
      expect(booking.userId.toString()).toBe(mockUser._id.toString());
      expect(booking.newBooking.numberOfGuests).toBe(2);
      expect(booking.newBooking.totalPrice).toBe(15000);
      expect(booking.newBooking.status).toBe('Pending');
    });

    test('should throw error when required fields are missing', async () => {
      const bookingData = {
        checkInDate: '2025-11-01',
        // Missing checkOutDate and numberOfGuests
        totalPrice: '15000',
      };

      await expect(
        bookingService.createBooking(mockUser._id.toString(), mockListing._id.toString(), bookingData)
      ).rejects.toThrow('Check-in date, check-out date, and number of guests are required');
    });

    test('should throw error for invalid total price', async () => {
      const bookingData = {
        checkInDate: '2025-11-01',
        checkOutDate: '2025-11-15',
        numberOfGuests: 2,
        totalPrice: 'invalid-price',
      };

      await expect(
        bookingService.createBooking(mockUser._id.toString(), mockListing._id.toString(), bookingData)
      ).rejects.toThrow('Total Price must be a valid number');
    });

    test('should throw error for non-existent listing', async () => {
      const fakeListingId = new ObjectId();
      const bookingData = {
        checkInDate: '2025-11-01',
        checkOutDate: '2025-11-15',
        numberOfGuests: 2,
        totalPrice: '15000',
      };

      await expect(
        bookingService.createBooking(mockUser._id.toString(), fakeListingId.toString(), bookingData)
      ).rejects.toThrow('Listing not found');
    });

    test('should prevent duplicate bookings for same user', async () => {
      const bookingData = {
        checkInDate: '2025-11-01',
        checkOutDate: '2025-11-15',
        numberOfGuests: 2,
        totalPrice: '15000',
      };

      // Create first booking
      await bookingService.createBooking(
        mockUser._id.toString(),
        mockListing._id.toString(),
        bookingData
      );

      // Try to create second booking
      await expect(
        bookingService.createBooking(mockUser._id.toString(), mockListing._id.toString(), bookingData)
      ).rejects.toThrow('User already has an active or pending booking');
    });

    test('should handle supportDocuments as array', async () => {
      const bookingData = {
        checkInDate: '2025-11-01',
        checkOutDate: '2025-11-15',
        numberOfGuests: 2,
        supportDocuments: ['doc1.pdf', 'doc2.pdf'],
        totalPrice: '15000',
      };

      const result = await bookingService.createBooking(
        mockUser._id.toString(),
        mockListing._id.toString(),
        bookingData
      );

      const booking = await db.collection('Bookings').findOne({ _id: result.bookingID });
      expect(booking.newBooking.supportDocuments).toEqual(['doc1.pdf', 'doc2.pdf']);
    });
  });

  describe('getAllBookings', () => {
    test('should return empty array when no bookings exist', async () => {
      const bookings = await bookingService.getAllBookings();
      expect(bookings).toEqual([]);
    });

    test('should return all bookings', async () => {
      const mockBookings = [
        generateMockBooking(new ObjectId(), new ObjectId()),
        generateMockBooking(new ObjectId(), new ObjectId()),
      ];
      
      await db.collection('Bookings').insertMany(mockBookings);

      const bookings = await bookingService.getAllBookings();
      expect(bookings).toHaveLength(2);
    });
  });

  describe('getBookingById', () => {
    test('should return booking by user ID', async () => {
      const mockBooking = generateMockBooking(new ObjectId(), new ObjectId());
      await db.collection('Bookings').insertOne(mockBooking);

      const booking = await bookingService.getBookingById(mockBooking.userId.toString());
      
      expect(booking).toBeDefined();
      expect(booking.userId.toString()).toBe(mockBooking.userId.toString());
    });

    test('should throw error when booking not found', async () => {
      const fakeUserId = new ObjectId();
      
      await expect(
        bookingService.getBookingById(fakeUserId.toString())
      ).rejects.toThrow('No Booking Was Found');
    });

    test('should not return completed or cancelled bookings', async () => {
      const mockBooking = generateMockBooking(new ObjectId(), new ObjectId(), {
        newBooking: {
          bookingId: 'B-0001',
          checkInDate: '2025-11-01',
          checkOutDate: '2025-11-15',
          numberOfGuests: 2,
          supportDocuments: [],
          totalPrice: 15000,
          status: 'Completed',
          createdAt: new Date(),
        }
      });
      await db.collection('Bookings').insertOne(mockBooking);

      await expect(
        bookingService.getBookingById(mockBooking.userId.toString())
      ).rejects.toThrow('No Booking Was Found');
    });
  });

  describe('updateBooking', () => {
    let mockBooking;

    beforeEach(async () => {
      mockBooking = generateMockBooking(new ObjectId(), new ObjectId());
      await db.collection('Bookings').insertOne(mockBooking);
    });

    test('should update booking status', async () => {
      const updateData = { status: 'Active' };
      
      const result = await bookingService.updateBooking(mockBooking._id.toString(), updateData);
      
      expect(result).toEqual({ message: 'Booking updated' });

      const updatedBooking = await db.collection('Bookings').findOne({ _id: mockBooking._id });
      expect(updatedBooking.status).toBe('Active');
    });

    test('should update multiple fields', async () => {
      const updateData = {
        guestAmount: 3,
        status: 'Active',
      };
      
      await bookingService.updateBooking(mockBooking._id.toString(), updateData);

      const updatedBooking = await db.collection('Bookings').findOne({ _id: mockBooking._id });
      expect(updatedBooking.guestAmount).toBe(3);
      expect(updatedBooking.status).toBe('Active');
    });

    test('should throw error when no valid fields to update', async () => {
      await expect(
        bookingService.updateBooking(mockBooking._id.toString(), {})
      ).rejects.toThrow('No valid fields to update');
    });

    test('should throw error when booking not found', async () => {
      const fakeId = new ObjectId();
      
      await expect(
        bookingService.updateBooking(fakeId.toString(), { status: 'Active' })
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('deleteBooking', () => {
    test('should delete existing booking', async () => {
      const mockBooking = generateMockBooking(new ObjectId(), new ObjectId());
      await db.collection('Bookings').insertOne(mockBooking);

      const result = await bookingService.deleteBooking(mockBooking._id.toString());
      
      expect(result).toEqual({ message: 'Booking deleted' });

      const deletedBooking = await db.collection('Bookings').findOne({ _id: mockBooking._id });
      expect(deletedBooking).toBeNull();
    });

    test('should throw error when booking not found', async () => {
      const fakeId = new ObjectId();
      
      await expect(
        bookingService.deleteBooking(fakeId.toString())
      ).rejects.toThrow('Booking not found');
    });

    test('should throw error for invalid ID', async () => {
      await expect(
        bookingService.deleteBooking('invalid-id')
      ).rejects.toThrow('Invalid booking id');
    });
  });
});
