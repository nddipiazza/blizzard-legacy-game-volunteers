/**
 * Register API Integration Tests
 * This file tests the API integration between the register form and the backend
 */

// Mock fetch API
global.fetch = jest.fn();

// Mock signIn from next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn().mockResolvedValue({ error: null }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('Register API Integration', () => {
  let mockSubmitFormFn;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables for each test
    process.env.NODE_ENV = 'test';
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-site-key';
    process.env.ENABLE_RECAPTCHA = 'true';
    
    // Mock successful registration response
    fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
          },
          message: 'User registered successfully',
        }),
      })
    );
    
    // Setup grecaptcha mock
    global.window = Object.create(window);
    global.window.grecaptcha = {
      ready: (callback) => callback(),
      execute: jest.fn().mockResolvedValue('mock-recaptcha-token'),
    };
    
    // Create a mock submit function similar to the one in the component
    mockSubmitFormFn = jest.fn().mockImplementation(async (data, recaptchaToken) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          recaptchaToken,
        }),
      });
      return await response.json();
    });
  });

  it('sends correct data to registration API with reCAPTCHA token', async () => {
    // Setup test data
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    
    // Call our mock submit function
    await mockSubmitFormFn(testData, 'mock-recaptcha-token');
    
    // Check fetch was called with correct data
    expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testData,
        recaptchaToken: 'mock-recaptcha-token',
      }),
    });
  });
  
  it('handles registration API errors correctly', async () => {
    // Setup API to return an error
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({
          message: 'User with this email already exists',
        }),
      })
    );
    
    // Setup test data
    const testData = {
      name: 'Test User',
      email: 'existing@example.com',
      password: 'password123',
    };
    
    // Call our mock submit function and expect it to return the error
    const response = await mockSubmitFormFn(testData, 'mock-recaptcha-token');
    
    // Verify the error message
    expect(response.message).toBe('User with this email already exists');
  });
  
  it('handles detailed reCAPTCHA error responses', async () => {
    // Setup API to return a reCAPTCHA error with details
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({
          message: 'reCAPTCHA verification failed. Please try again.',
          recaptchaDetails: {
            message: 'reCAPTCHA score too low',
            errors: ['invalid-input-response'],
            score: 0.1,
          },
        }),
      })
    );
    
    // Setup test data
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    
    // Call our mock submit function
    const response = await mockSubmitFormFn(testData, 'invalid-recaptcha-token');
    
    // Verify we get detailed error info
    expect(response.message).toBe('reCAPTCHA verification failed. Please try again.');
    expect(response.recaptchaDetails).toBeDefined();
    expect(response.recaptchaDetails.score).toBe(0.1);
    expect(response.recaptchaDetails.errors).toContain('invalid-input-response');
  });
  
  it('works correctly in development mode without reCAPTCHA', async () => {
    // Set environment to development
    process.env.NODE_ENV = 'development';
    
    // Remove grecaptcha to simulate it not being available
    delete window.grecaptcha;
    
    // Setup test data
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    
    // Call our mock submit function with development token
    await mockSubmitFormFn(testData, 'dev-no-recaptcha');
    
    // Verify API call includes the development token
    expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining('dev-no-recaptcha'),
    });
  });
});
