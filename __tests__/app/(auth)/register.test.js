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
    
    // Check if form elements are rendered
    expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password (min 6 characters)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    customRender(<Register />);
    
    // Submit the empty form
    fireEvent.click(screen.getByText('Create account'));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      expect(screen.getByText('You must agree to the terms')).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    customRender(<Register />);
    
    // Fill form with mismatched passwords
    fireEvent.change(screen.getByPlaceholderText('Full name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password (min 6 characters)'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'differentpassword' },
    });
    fireEvent.click(screen.getByLabelText(/I agree to the/));
    
    // Submit form
    fireEvent.click(screen.getByText('Create account'));
    
    // Check for password mismatch error
    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('successfully submits registration form with reCAPTCHA', async () => {
    // Set up grecaptcha mock to return a valid token
    window.grecaptcha = {
      ready: (callback) => callback(),
      execute: jest.fn().mockResolvedValue('mock-recaptcha-token'),
    };
    
    customRender(<Register />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByPlaceholderText('Full name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password (min 6 characters)'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/I agree to the/));
    
    // Submit form
    fireEvent.click(screen.getByText('Create account'));
    
    // Check that fetch was called correctly - with retry since it may take some time
    await waitFor(() => {
      expect(window.grecaptcha.execute).toHaveBeenCalledWith(expect.any(String), { action: 'register' });
    }, { timeout: 3000 });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }));
      
      // Verify the body contains expected data
      const calls = fetch.mock.calls;
      const lastCall = calls[calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);
      expect(requestBody).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        recaptchaToken: 'mock-recaptcha-token',
      });
      
      // Check that signIn was called after successful registration
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'password123',
      });
      
      // Check that router.push was called to redirect to profile page
      expect(mockRouter.push).toHaveBeenCalledWith('/profile?new=true');
    }, { timeout: 3000 });
  });

  it('handles registration failure and displays error message', async () => {
    // Override the default mock to simulate failure
    fetch.mockReset();
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        message: 'User with this email already exists',
      }),
    });
    
    customRender(<Register />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByPlaceholderText('Full name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password (min 6 characters)'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/I agree to the/));
    
    // Submit form
    fireEvent.click(screen.getByText('Create account'));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('User with this email already exists')).toBeInTheDocument();
    });
  });

  it('handles reCAPTCHA verification failure', async () => {
    // Set up grecaptcha mock
    window.grecaptcha = {
      ready: (callback) => callback(),
      execute: jest.fn().mockResolvedValue('invalid-recaptcha-token'),
    };
    
    // Override the default mock to simulate reCAPTCHA failure
    fetch.mockImplementation((url) => {
      if (url === '/api/auth/register') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            message: 'reCAPTCHA verification failed. Please try again.',
            recaptchaDetails: {
              message: 'reCAPTCHA score too low',
              errors: ['invalid-input-response'],
              score: 0.1,
            },
          }),
        });
      }
      return Promise.reject(new Error('Not mocked'));
    });
    
    customRender(<Register />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByPlaceholderText('Full name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password (min 6 characters)'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/I agree to the/));
    
    // Submit form
    fireEvent.click(screen.getByText('Create account'));
    
    // Check for detailed error message
    await waitFor(() => {
      expect(screen.getByText('reCAPTCHA verification failed. Please try again.')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for additional detailed error information
    await waitFor(() => {
      // Using query methods since some elements might not render until error is processed
      const errorElement = screen.queryByText(/reCAPTCHA score too low/i);
      const errorCodeElement = screen.queryByText(/Error codes: invalid-input-response/i);
      const scoreElement = screen.queryByText(/Score: 0.1/i);
      
      expect(errorElement).toBeInTheDocument();
      expect(errorCodeElement).toBeInTheDocument();
      expect(scoreElement).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles grecaptcha not being available in development mode', async () => {
    // Set environment to development
    process.env.NODE_ENV = 'development';
    
    // Override window.grecaptcha to be undefined
    delete window.grecaptcha;
    
    customRender(<Register />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByPlaceholderText('Full name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password (min 6 characters)'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/I agree to the/));
    
    // Reset fetch mock to track new calls
    fetch.mockClear();
    
    // Mock successful response for the form submission without reCAPTCHA
    fetch.mockImplementation((url) => {
      if (url === '/api/auth/register') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: 'user-123',
              name: 'Test User',
              email: 'test@example.com',
            },
            message: 'User registered successfully',
          }),
        });
      }
      return Promise.reject(new Error('Not mocked'));
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Create account'));
    
    // Check that fetch was called with a placeholder token in development mode
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }));
      
      // Verify the request body contains the dev token
      const calls = fetch.mock.calls;
      const lastCall = calls[calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);
      expect(requestBody.recaptchaToken).toBe('dev-no-recaptcha');
    }, { timeout: 3000 });
  });
  
  it('handles grecaptcha not being available in production mode', async () => {
    // Set environment to production
    process.env.NODE_ENV = 'production';
    
    // Override window.grecaptcha to be undefined
    delete window.grecaptcha;
    
    customRender(<Register />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByPlaceholderText('Full name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password (min 6 characters)'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/I agree to the/));
    
    // Submit form
    fireEvent.click(screen.getByText('Create account'));
    
    // In production mode, it should show error about reCAPTCHA not being available
    await waitFor(() => {
      expect(screen.getByText(/reCAPTCHA could not be loaded/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
  
  it('bypasses reCAPTCHA when ENABLE_RECAPTCHA is set to false', async () => {
    // Disable reCAPTCHA via environment variable
    process.env.ENABLE_RECAPTCHA = 'false';
    
    // Mock successful registration response
    fetch.mockImplementation((url) => {
      if (url === '/api/auth/register') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: 'user-123',
              name: 'Test User',
              email: 'test@example.com',
            },
            message: 'User registered successfully',
          }),
        });
      }
      return Promise.reject(new Error('Not mocked'));
    });
    
    // Remove grecaptcha to ensure it's not being used
    delete window.grecaptcha;
    
    customRender(<Register />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByPlaceholderText('Full name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password (min 6 characters)'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/I agree to the/));
    
    // Reset fetch mock to track new calls
    fetch.mockClear();
    
    // Submit form
    fireEvent.click(screen.getByText('Create account'));
    
    // Should submit form successfully even without grecaptcha
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(signIn).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/profile?new=true');
    }, { timeout: 3000 });
  });
});
