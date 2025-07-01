'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (status === 'unauthenticated') {
      redirect('/login');
    }
    
    const fetchDashboardData = async () => {
      try {
        // Get user's applications and recommended opportunities
        if (session?.user?.id) {
          const [opportunitiesRes, applicationsRes] = await Promise.all([
            fetch('/api/opportunities?status=open'),
            fetch(`/api/users/${session.user.id}/applications`)
          ]);
          
          if (!opportunitiesRes.ok || !applicationsRes.ok) {
            throw new Error('Failed to fetch dashboard data');
          }
          
          const opportunitiesData = await opportunitiesRes.json();
          const applicationsData = await applicationsRes.json();
          
          setOpportunities(opportunitiesData.slice(0, 3)); // Show just 3 recommended opportunities
          setApplications(applicationsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, session]);
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {session?.user?.name}!
          </h1>
          <p className="text-gray-600">
            Track your volunteer applications and discover new opportunities.
          </p>
        </motion.div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-8">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2">
            {/* Your Applications */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Applications</h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{app.opportunity.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'accepted' 
                            ? 'bg-green-100 text-green-800' 
                            : app.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                      <Link 
                        href={`/opportunities/${app.opportunity.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View opportunity
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                  <p className="text-gray-500 mb-4">You haven't applied to any opportunities yet</p>
                  <Link
                    href="/opportunities"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Browse opportunities
                  </Link>
                </div>
              )}
            </motion.div>
            
            {/* Recommended Opportunities */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Opportunities</h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : opportunities.length > 0 ? (
                <div className="space-y-4">
                  {opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="border border-gray-200 rounded-md p-4">
                      <h3 className="font-medium mb-2">{opportunity.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {opportunity.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {opportunity.skillsNeeded.map((skill) => (
                          <span 
                            key={skill} 
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      <Link 
                        href={`/opportunities/${opportunity.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View details
                      </Link>
                    </div>
                  ))}
                  
                  <div className="text-center pt-4">
                    <Link
                      href="/opportunities"
                      className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      View all opportunities
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                  <p className="text-gray-500">No opportunities available at the moment</p>
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-8"
          >
            {/* Profile card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center text-blue-600 text-xl font-bold">
                  {session?.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{session?.user?.name}</p>
                  <p className="text-sm text-gray-600">{session?.user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Link 
                  href="/profile" 
                  className="block w-full text-center py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Stats</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Profile completion</span>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                      <p className="text-sm text-gray-600">Applications</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications.filter(app => app.status === 'accepted').length}
                      </p>
                      <p className="text-sm text-gray-600">Accepted</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resources */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resources</h3>
              
              <ul className="space-y-3">
                <li>
                  <a 
                    href="#" 
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                    </svg>
                    C++ Style Guide
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                    </svg>
                    Contribution Guidelines
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                    </svg>
                    Game Engine Overview
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
