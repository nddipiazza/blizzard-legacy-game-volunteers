'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';

// Add global CSS for placeholder text contrast
const inputStyles = {
  '::placeholder': {
    color: '#6B7280', // darker placeholder color (gray-500)
    opacity: 1,
  },
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  const skills = ['C++', 'Game Development', 'Graphics', 'AI', 'Networking', 'Physics', 'Tools', 'UI/UX', 'Testing', 'Documentation'];
  
  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    const fetchUserProfile = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch(`/api/users/${session.user.id}`);
          
          if (!res.ok) {
            throw new Error('Failed to fetch profile data');
          }
          
          const userData = await res.json();
          
          // Populate form with user data
          setValue('name', userData.name);
          setValue('email', userData.email);
          setValue('bio', userData.bio || '');
          setValue('yearsExperience', userData.yearsExperience || 0);
          setValue('githubProfile', userData.githubProfile || '');
          setValue('linkedinProfile', userData.linkedinProfile || '');
          setValue('portfolioUrl', userData.portfolioUrl || '');
          setValue('skills', userData.skills || []);
          
        } catch (error) {
          console.error('Error fetching profile:', error);
          setErrorMessage('Failed to load profile data. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (status === 'authenticated') {
      fetchUserProfile();
    }
  }, [status, session, setValue, router]);
  
  const onSubmit = async (data) => {
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');
      
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update profile');
      }
      
      setSuccessMessage('Profile updated successfully!');
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Your Profile</h1>
          </div>
          
          <div className="p-6">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" style={inputStyles}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Basic Information</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Full Name
                    </label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Email Address
                    </label>
                    <input
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                          message: 'Enter a valid email address'
                        }
                      })}
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-gray-100"
                      disabled
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Years of Experience
                    </label>
                    <input
                      {...register('yearsExperience', { 
                        required: 'Years of experience is required',
                        min: { value: 0, message: 'Value must be 0 or greater' },
                        valueAsNumber: true
                      })}
                      type="number"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                    {errors.yearsExperience && (
                      <p className="mt-1 text-sm text-red-600">{errors.yearsExperience.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Bio
                    </label>
                    <textarea
                      {...register('bio')}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Tell us about yourself, your background, and experience with game development"
                    ></textarea>
                  </div>
                </div>
                
                {/* Skills and Social Links */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Skills & Social Links</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Select Your Skills
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {skills.map((skill) => (
                        <div key={skill} className="flex items-center">
                          <input
                            id={`skill-${skill}`}
                            type="checkbox"
                            value={skill}
                            {...register('skills')}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`skill-${skill}`} className="ml-2 text-sm text-gray-800">
                            {skill}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      GitHub Profile
                    </label>
                    <input
                      {...register('githubProfile')}
                      type="url"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      LinkedIn Profile
                    </label>
                    <input
                      {...register('linkedinProfile')}
                      type="url"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="https://linkedin.com/in/yourusername"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Portfolio Website
                    </label>
                    <input
                      {...register('portfolioUrl')}
                      type="url"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
