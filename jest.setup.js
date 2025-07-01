// Configure testing framework
import '@testing-library/jest-dom';

// Set up environment variables
process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-site-key';
process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Mock global objects
global.console = {
  ...console,
  // Comment this out if you want to see console logs during test runs
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock window.grecaptcha
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'grecaptcha', {
    value: {
      ready: (callback) => callback(),
      execute: jest.fn().mockResolvedValue('mock-recaptcha-token'),
    },
    writable: true,
  });
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn().mockResolvedValue({ ok: true, error: null }),
  signOut: jest.fn().mockResolvedValue(true),
  useSession: jest.fn(() => ({
    data: {
      user: { name: 'Test User', email: 'test@example.com' },
      expires: '2100-01-01T00:00:00.000Z',
    },
    status: 'authenticated',
  })),
}));

// Mock fetch
global.fetch = jest.fn();
