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
    <div className="min-h-screen">
      {/* Hero section with blue background */}
      <section className="bg-blue-900 text-white py-16 adaptive-dark-section">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center mb-6">
            <Link 
              href="/opportunities" 
              className="inline-flex items-center adaptive-blue-text hover:adaptive-white mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Opportunities
            </Link>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{opportunity.title}</h1>
            <div className="flex flex-wrap items-center adaptive-blue-text mb-2">
              <span className="mr-6">Status: <span className={`font-semibold ${isOpen ? 'text-green-400' : 'text-red-400'}`}>{opportunity.status.toUpperCase()}</span></span>
              <span>Time Commitment: <span className="font-semibold">{opportunity.timeCommitment}</span></span>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Content section */}
      <div className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Success message */}
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-md mb-8"
            >
              <p className="font-semibold">{successMessage}</p>
            </motion.div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md mb-8">
              <p className="font-semibold">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Description */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="bg-white rounded-lg shadow-md p-6 mb-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <div className="prose max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{opportunity.description}</p>
                </div>
              </motion.div>
              
              {/* Requirements */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white rounded-lg shadow-md p-6 mb-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                <div className="prose max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{opportunity.requirements || 'No specific requirements provided.'}</p>
                </div>
              </motion.div>
              
              {/* Skills Needed */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Skills Needed</h2>
                <div className="flex flex-wrap gap-2">
                  {opportunity.skillsNeeded && opportunity.skillsNeeded.length > 0 ? (
                    opportunity.skillsNeeded.map((skill) => (
                      <span 
                        key={skill} 
                        className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-700">No specific skills listed.</p>
                  )}
                </div>
              </motion.div>
            </div>
            
            {/* Apply sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Apply for this Opportunity</h2>
                
                {session ? (
                  isOpen ? (
                    <div>
                      <p className="text-gray-600 mb-4">
                        Interested in this role? Submit your application now.
                      </p>
                      <button
                        onClick={handleApply}
                        disabled={applying}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                      >
                        {applying ? 'Submitting...' : 'Apply Now'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-red-500 font-medium">
                      This opportunity is no longer accepting applications.
                    </p>
                  )
                ) : (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Please sign in to apply for this opportunity.
                    </p>
                    <Link
                      href="/login"
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
