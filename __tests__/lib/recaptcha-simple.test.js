import { verifyRecaptcha } from '@/lib/recaptcha';

describe('recaptcha verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_RECAPTCHA = 'true';
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';
  });

  test('should pass when recaptcha is disabled', async () => {
    process.env.ENABLE_RECAPTCHA = 'false';
    const result = await verifyRecaptcha('dummy-token');
    expect(result.success).toBe(true);
  });

  test('should fail when no token is provided', async () => {
    const result = await verifyRecaptcha(null);
    expect(result.success).toBe(false);
  });
});
