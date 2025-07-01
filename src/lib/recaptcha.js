/**
 * Utility function to verify a reCAPTCHA token with Google's API
 * @param {string} token - The reCAPTCHA token to verify
 * @returns {Promise<boolean>} - Whether the token is valid
 */
export async function verifyRecaptcha(token) {
  // Check if reCAPTCHA is disabled
  if (process.env.ENABLE_RECAPTCHA?.toLowerCase() === 'false') {
    console.log('reCAPTCHA verification skipped - disabled in environment');
    return true;
  }
  
  if (!token) return false;
  
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error('reCAPTCHA secret key not configured');
      return false;
    }
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}
