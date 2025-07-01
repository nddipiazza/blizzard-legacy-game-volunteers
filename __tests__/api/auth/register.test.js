import { NextResponse } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { verifyRecaptcha } from '@/lib/recaptcha';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

// Mocks
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('@/lib/recaptcha', () => ({
  verifyRecaptcha: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      options,
    })),
  },
}));

describe('Register API Route', () => {
  const mockRequest = (body) => ({
    json: () => Promise.resolve(body),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify reCAPTCHA token first', async () => {
    // Arrange
    verifyRecaptcha.mockResolvedValueOnce({ 
      success: false, 
      details: { message: 'Failed verification', errors: ['invalid-input-response'] }
    });
    
    // Act
    await POST(mockRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      recaptchaToken: 'invalid-token',
    }));
    
    // Assert
    expect(verifyRecaptcha).toHaveBeenCalledWith('invalid-token');
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'reCAPTCHA verification failed. Please try again.',
      }),
      { status: 400 }
    );
    // Should not proceed to user creation
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });
  
  it('should include detailed reCAPTCHA error information', async () => {
    // Arrange
    const recaptchaDetails = {
      message: 'reCAPTCHA score too low',
      score: 0.1,
      threshold: 0.3,
      errors: ['invalid-input-response', 'timeout-or-duplicate'],
      hostname: 'test-host',
      action: 'register'
    };
    
    verifyRecaptcha.mockResolvedValueOnce({ 
      success: false, 
      details: recaptchaDetails
    });
    
    // Act
    await POST(mockRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      recaptchaToken: 'invalid-token',
    }));
    
    // Assert
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        message: 'reCAPTCHA verification failed. Please try again.',
        recaptchaDetails: recaptchaDetails
      },
      { status: 400 }
    );
  });

  it('should check if user already exists', async () => {
    // Arrange
    verifyRecaptcha.mockResolvedValueOnce({ success: true });
    User.findOne.mockResolvedValueOnce({ _id: 'existing-user-id' }); // User exists
    
    // Act
    await POST(mockRequest({
      name: 'Test User',
      email: 'existing@example.com',
      password: 'password123',
      recaptchaToken: 'valid-token',
    }));
    
    // Assert
    expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'User with this email already exists' },
      { status: 400 }
    );
    // Should not proceed to user creation
    expect(User.create).not.toHaveBeenCalled();
  });

  it('should create new user when validation passes', async () => {
    // Arrange
    verifyRecaptcha.mockResolvedValueOnce({ success: true });
    User.findOne.mockResolvedValueOnce(null); // User does not exist
    
    const mockUser = {
      _id: 'new-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      profileComplete: false,
    };
    User.create.mockResolvedValueOnce(mockUser);
    
    // Act
    await POST(mockRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      recaptchaToken: 'valid-token',
    }));
    
    // Assert
    expect(User.create).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          id: 'new-user-id',
          name: 'Test User',
          email: 'test@example.com',
        }),
        message: 'User registered successfully',
      }),
      { status: 201 }
    );
  });

  it('should handle database connection errors', async () => {
    // Arrange
    connectDB.mockRejectedValueOnce(new Error('Database connection failed'));
    
    // Act
    await POST(mockRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      recaptchaToken: 'valid-token',
    }));
    
    // Assert
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Database connection failed' },
      { status: 500 }
    );
  });

  it('should handle user creation errors', async () => {
    // Arrange
    verifyRecaptcha.mockResolvedValueOnce({ success: true });
    User.findOne.mockResolvedValueOnce(null); // User does not exist
    User.create.mockRejectedValueOnce(new Error('Failed to create user'));
    
    // Act
    await POST(mockRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      recaptchaToken: 'valid-token',
    }));
    
    // Assert
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Failed to create user' },
      { status: 500 }
    );
  });
  
  it('should bypass reCAPTCHA verification when ENABLE_RECAPTCHA is false', async () => {
    // Set environment variable to disable reCAPTCHA
    process.env.ENABLE_RECAPTCHA = 'false';
    
    // Arrange - mock success response for verification
    verifyRecaptcha.mockResolvedValueOnce({ 
      success: true,
      details: { message: 'reCAPTCHA verification skipped - disabled in environment' }
    });
    
    User.findOne.mockResolvedValueOnce(null); // User does not exist
    
    const mockUser = {
      _id: 'new-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      profileComplete: false,
    };
    User.create.mockResolvedValueOnce(mockUser);
    
    // Act
    await POST(mockRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      recaptchaToken: null, // No token provided, should still work
    }));
    
    // Assert - should still proceed with user creation
    expect(User.create).toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.anything(),
        message: 'User registered successfully',
      }),
      { status: 201 }
    );
    
    // Reset environment variable
    process.env.ENABLE_RECAPTCHA = 'true';
  });
});
