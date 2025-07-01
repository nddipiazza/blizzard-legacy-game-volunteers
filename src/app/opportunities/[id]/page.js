'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OpportunityDetailPage({ params }) {
  const opportunityId = params.id;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const res = await fetch(`/api/opportunities/${opportunityId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch opportunity');
        }
        
        const data = await res.json();
        setOpportunity(data);
      } catch (err) {
        console.error('Error fetching opportunity:', err);
        setError('Failed to load opportunity details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOpportunity();
  }, [opportunityId]);
  
  const handleApply = async () => {
    try {
      setApplying(true);
      
      const res = await fetch(`/api/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to apply to opportunity');
      }
      
      setSuccessMessage('Application submitted successfully!');
      
      // Update local state to show user as applied
      setOpportunity(prev => ({
        ...prev,
        hasApplied: true
      }));
      
    } catch (err) {
      console.error('Error applying to opportunity:', err);
      setError(err.message || 'Failed to apply. Please try again.');
    } finally {
      setApplying(false);
    }
  };
  
  // Check if user has already applied
  const hasApplied = opportunity?.applicants?.some(
    applicant => applicant.user === session?.user?.id
  ) || opportunity?.hasApplied;
  
  // Check if opportunity is still open
  const isOpen = opportunity?.status === 'open';
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error && !opportunity) {
    return (
      <div className="min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
            <Link href="/opportunities" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              Back to opportunities
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-10 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back navigation */}
        <div className="mb-6">
          <Link 
            href="/opportunities" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to all opportunities
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {/* Header with status badge */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">{opportunity.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              opportunity.status === 'open' 
                ? 'bg-green-100 text-green-800' 
                : opportunity.status === 'filled'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
            </span>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
                {successMessage}
              </div>
            )}
            
            {/* Project info */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                  Project: {opportunity.project}
                </span>
                <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                  Time Commitment: {opportunity.timeCommitment}
                </span>
                <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                  Posted: {new Date(opportunity.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="prose max-w-none">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="mb-6 whitespace-pre-line">{opportunity.description}</p>
                
                <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                <ul className="list-disc pl-5 mb-6 space-y-1">
                  {opportunity.requirements.map((req, index) => (
                    <li key={index} className="text-gray-700">{req}</li>
                  ))}
                </ul>
                
                <h2 className="text-xl font-bold text-gray-900 mb-4">Skills Needed</h2>
                <div className="flex flex-wrap gap-2 mb-8">
                  {opportunity.skillsNeeded.map((skill) => (
                    <span 
                      key={skill} 
                      className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Application section */}
            <div className="border-t pt-8">
              {session ? (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-lg">
                  {hasApplied ? (
                    <div>
                      <div className="bg-green-100 rounded-full p-3 inline-flex mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Application Submitted
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Thank you for your interest! We'll review your application and get back to you soon.
                      </p>
                      <Link 
                        href="/dashboard" 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Track your application in your dashboard
                      </Link>
                    </div>
                  ) : isOpen ? (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Ready to contribute?
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Your skills can help improve StarCraft 2 for players around the world. Apply now to join this volunteer opportunity.
                      </p>
                      
                      {session.user.profileComplete ? (
                        <button
                          onClick={handleApply}
                          disabled={applying}
                          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                          {applying ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : 'Apply Now'}
                        </button>
                      ) : (
                        <div>
                          <p className="text-yellow-600 mb-4">
                            You need to complete your profile before applying
                          </p>
                          <Link
                            href="/profile"
                            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Complete Your Profile
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        This opportunity is no longer accepting applications
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Check out other open opportunities
                      </p>
                      <Link 
                        href="/opportunities" 
                        className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Browse Opportunities
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Interested in this opportunity?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sign in or create an account to apply for this volunteer position
                  </p>
                  <div className="space-x-4">
                    <Link 
                      href={`/login?redirect=/opportunities/${opportunityId}`}
                      className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Log In
                    </Link>
                    <Link 
                      href="/register"
                      className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
