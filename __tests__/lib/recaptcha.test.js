import { verifyRecaptcha } from '@/lib/recaptcha';

// Mock fetch API
global.fetch = jest.fn();

describe('verifyRecaptcha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_RECAPTCHA = 'true';
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';
  });

  it('should return success when reCAPTCHA is disabled', async () => {
    // Arrange
    process.env.ENABLE_RECAPTCHA = 'false';
    
    // Act
    const result = await verifyRecaptcha('some-token');
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.details.message).toContain('disabled in environment');
  });

  it('should return failure when no token is provided', async () => {
    // Act
    const result = await verifyRecaptcha(null);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.details.message).toContain('No reCAPTCHA token provided');
  });

  it('should return failure when secret key is not configured', async () => {
    // Arrange
    const originalKey = process.env.RECAPTCHA_SECRET_KEY;
    delete process.env.RECAPTCHA_SECRET_KEY;
    
    // Act
    const result = await verifyRecaptcha('test-token-123456789012345678901234567890');
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.details.message).toContain('secret key not configured');
    
    // Restore the key for other tests
    process.env.RECAPTCHA_SECRET_KEY = originalKey;
  });

  it('should verify reCAPTCHA token successfully (v3 with score)', async () => {
    // Arrange
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        score: 0.9,
        action: 'register',
        hostname: 'localhost',
      }),
    });
    
    // Act - Use a token that looks like a real reCAPTCHA token (long enough)
    const result = await verifyRecaptcha('valid-token-123456789012345678901234567890abcdef');
    
    // Assert
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.any(Object)
    );
    expect(result.details.score).toBe(0.9);
  });

  it('should fail verification if score is too low', async () => {
    // Arrange
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        score: 0.2, // Below the threshold
        action: 'register',
        hostname: 'localhost',
      }),
    });
    
    // Act - Use a token that looks like a real reCAPTCHA token (long enough)
    const result = await verifyRecaptcha('low-score-token-123456789012345678901234567890abcdef');
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.details.message).toContain('score too low');
    expect(result.details.score).toBe(0.2);
  });

  it('should fail verification if Google returns failure', async () => {
    // Arrange
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    });
    
    // Act - Use a token that looks like a real reCAPTCHA token (long enough)
    const result = await verifyRecaptcha('invalid-token-123456789012345678901234567890abcdef');
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.details.errors).toContain('invalid-input-response');
  });

  it('should handle fetch errors gracefully', async () => {
    // Arrange
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Act - Use a token that looks like a real reCAPTCHA token (long enough)
    const result = await verifyRecaptcha('token-for-network-error-123456789012345678901234567890');
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.details.message).toContain('Network error');
  });
});
