/**
 * Utility function to verify a reCAPTCHA token with Google's API
 * @param {string} token - The reCAPTCHA token to verify
 * @returns {Promise<{success: boolean, details: Object}>} - Result of verification with details
 */
export async function verifyRecaptcha(token) {
  // Check if reCAPTCHA is disabled
  if (process.env.ENABLE_RECAPTCHA?.toLowerCase() === 'false') {
    console.log('reCAPTCHA verification skipped - disabled in environment');
    return { 
      success: true,
      details: { message: 'reCAPTCHA verification skipped - disabled in environment' }
    };
  }
  
  if (!token) {
    return { 
      success: false, 
      details: { message: 'No reCAPTCHA token provided' }
    };
  }
  
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error('reCAPTCHA secret key not configured');
      return { 
        success: false,
        details: { message: 'reCAPTCHA secret key not configured on server' }
      };
    }
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    const data = await response.json();
    
    console.log('reCAPTCHA verification response:', data);
    
    // For reCAPTCHA v3, check the score (0.0 to 1.0)
    // 1.0 is very likely a good interaction, 0.0 is very likely a bot
    if (data.success && data.score !== undefined) {
      // This is a v3 response with score
      const minScore = 0.3; // Lower threshold for testing
      console.log(`reCAPTCHA v3 score: ${data.score}`);
      
      if (data.score < minScore) {
        return {
          success: false,
          details: {
            message: `reCAPTCHA score too low: ${data.score} (minimum: ${minScore})`,
            score: data.score,
            threshold: minScore,
            errors: data['error-codes'] || [],
            hostname: data.hostname,
            action: data.action
          }
        };
      }
      
      return {
        success: true,
        details: {
          message: 'reCAPTCHA verification successful',
          score: data.score,
          hostname: data.hostname,
          action: data.action
        }
      };
    }
    
    // For v2 or if there's an error
    if (!data.success) {
      return {
        success: false,
        details: {
          message: 'reCAPTCHA verification failed',
          errors: data['error-codes'] || [],
          hostname: data.hostname
        }
      };
    }
    
    return {
      success: true,
      details: {
        message: 'reCAPTCHA verification successful',
        hostname: data.hostname
      }
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      details: {
        message: `reCAPTCHA verification error: ${error.message}`,
        error: error.toString()
      }
    };
  }
}
