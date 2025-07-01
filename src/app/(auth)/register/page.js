'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  
  const password = watch('password', '');

  // Load reCAPTCHA v3 script
  useEffect(() => {
    // Remove any existing reCAPTCHA script to avoid conflicts
    const existingScript = document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]');
    if (existingScript) {
      document.body.removeChild(existingScript);
    }
    
    // Load the reCAPTCHA v3 script
    const loadRecaptchaScript = () => {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
      console.log('Loading reCAPTCHA with site key:', siteKey);
      
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    loadRecaptchaScript();
    
    // Cleanup function
    return () => {
      const script = document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
      console.log('Using reCAPTCHA site key:', siteKey);
      
      // Execute reCAPTCHA v3 and get the token
      if (typeof window !== 'undefined' && window.grecaptcha) {
        console.log('grecaptcha found, executing...');
        
        try {
          // Make sure grecaptcha is fully loaded
          await new Promise((resolve) => {
            if (window.grecaptcha.ready) {
              window.grecaptcha.ready(resolve);
            } else {
              resolve(); // Fallback if .ready is not available
            }
          });
          
          console.log('grecaptcha is ready');
          
          // Get the token
          const token = await window.grecaptcha.execute(siteKey, { action: 'register' });
          console.log('reCAPTCHA token obtained:', token ? 'Yes (token exists)' : 'No (token is empty)');
          
          if (!token) {
            throw new Error('Failed to get reCAPTCHA token');
          }
          
          setRecaptchaToken(token);
          
          // Continue with form submission
          await submitForm(data, token);
        } catch (error) {
          console.error('reCAPTCHA execution error:', error);
          setError('Error with reCAPTCHA verification. Please refresh and try again.');
          setIsLoading(false);
        }
      } else {
        console.error('grecaptcha not found or not loaded properly');
        // For development testing, allow submission without reCAPTCHA
        if (process.env.NODE_ENV === 'development') {
          console.log('Development environment detected, proceeding without reCAPTCHA');
          await submitForm(data, 'dev-no-recaptcha');
        } else {
          setError('reCAPTCHA could not be loaded. Please refresh the page or check if you have scripts blocked.');
          setIsLoading(false);
        }
      }
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };
  
  // Separated form submission logic
  const submitForm = async (data, recaptchaToken) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          recaptchaToken,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Something went wrong');
      }
      
      // Auto sign in after successful registration
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Redirect to profile completion page
      router.push('/profile?new=true');
      
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </motion.div>
        
        <motion.form 
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className={`appearance-none rounded-t-md relative block w-full px-3 py-3 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10`}
                placeholder="Full name"
                {...register('name', { required: 'Full name is required' })}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10`}
                placeholder="Email address"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                    message: 'Invalid email address',
                  } 
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type="password"
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10`}
                placeholder="Password (min 6 characters)"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  } 
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="passwordConfirm" className="sr-only">Confirm Password</label>
              <input
                id="passwordConfirm"
                type="password"
                className={`appearance-none rounded-b-md relative block w-full px-3 py-3 border ${
                  errors.passwordConfirm ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10`}
                placeholder="Confirm password"
                {...register('passwordConfirm', { 
                  required: 'Please confirm your password',
                  validate: value => 
                    value === password || "Passwords don't match"
                })}
              />
              {errors.passwordConfirm && (
                <p className="text-red-500 text-xs mt-1">{errors.passwordConfirm.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                errors.terms ? 'border-red-500' : ''
              }`}
              {...register('terms', { 
                required: 'You must agree to the terms' 
              })}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="text-red-500 text-xs mt-1">{errors.terms.message}</p>
          )}
          
          {/* reCAPTCHA v3 is invisible and runs in the background */}
          {error && error.includes('reCAPTCHA') && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <div>
            <motion.button
              type="submit"
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
