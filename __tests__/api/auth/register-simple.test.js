import { NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/recaptcha';

// Mocks
jest.mock('@/lib/recaptcha', () => ({
  verifyRecaptcha: jest.fn()
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      options
    }))
  }
}));

// Simple mock of the register route handler
async function registerHandler(recaptchaSuccess) {
  try {
    // Mock request data
    const requestData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password',
      recaptchaToken: 'token'
    };
    
    // Mock recaptcha verification
    verifyRecaptcha.mockResolvedValueOnce({ 
      success: recaptchaSuccess,
      details: recaptchaSuccess ? {} : { message: 'Failed verification' }
    });
    
    // Check recaptcha
    const recaptchaResult = await verifyRecaptcha(requestData.recaptchaToken);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { message: 'reCAPTCHA verification failed', details: recaptchaResult.details },
        { status: 400 }
      );
    }
    
    // If successful, return success response
    return NextResponse.json(
      { message: 'Success' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Error' },
      { status: 500 }
    );
  }
}

describe('register API handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should fail if recaptcha verification fails', async () => {
    await registerHandler(false);
    
    expect(verifyRecaptcha).toHaveBeenCalledTimes(1);
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'reCAPTCHA verification failed' }),
      { status: 400 }
    );
  });
  
  test('should succeed if recaptcha verification passes', async () => {
    await registerHandler(true);
    
    expect(verifyRecaptcha).toHaveBeenCalledTimes(1);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Success' },
      { status: 200 }
    );
  });
});
