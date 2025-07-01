'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  // Define all available skills
  const allSkills = ['C++', 'Game Development', 'Graphics', 'AI', 'Networking', 'Physics', 'Tools', 'UI/UX', 'Testing', 'Documentation'];
  
  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    // If user is not an admin or project lead, redirect to regular dashboard
    if (status === 'authenticated' && 
        session.user.role !== 'admin' && 
        session.user.role !== 'project-lead') {
      router.push('/dashboard');
    }
    
    const fetchOpportunities = async () => {
      try {
        // Get all opportunities for admin
        const res = await fetch('/api/opportunities');
        
        if (!res.ok) {
          throw new Error('Failed to fetch opportunities');
        }
        
        const data = await res.json();
        setOpportunities(data);
      } catch (err) {
        console.error('Error fetching opportunities:', err);
        setError('Failed to load opportunities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated' && 
        (session.user.role === 'admin' || session.user.role === 'project-lead')) {
      fetchOpportunities();
    }
  }, [status, session, router]);
  
  const handleViewApplicants = async (opportunityId) => {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch opportunity details');
      }
      
      const data = await res.json();
      setSelectedOpportunity(data);
      
      if (data.applicants && data.applicants.length > 0) {
        // Fetch detailed info for each applicant
        const applicantPromises = data.applicants.map(app => 
          fetch(`/api/users/${app.user}`).then(res => res.json())
        );
        
        const applicantsData = await Promise.all(applicantPromises);
        
        // Combine applicant details with application status
        const applicantsWithStatus = data.applicants.map((app, index) => ({
          ...applicantsData[index],
          applicationStatus: app.status,
          appliedAt: app.appliedAt
        }));
        
        setApplicants(applicantsWithStatus);
      } else {
        setApplicants([]);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
      setError('Failed to load applicants. Please try again.');
    }
  };
  
  const handleUpdateStatus = async (opportunityId, newStatus) => {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update opportunity status');
      }
      
      setSuccessMessage('Opportunity status updated successfully');
      
      // Update local state
      setOpportunities(opportunities.map(opp => 
        opp._id === opportunityId ? { ...opp, status: newStatus } : opp
      ));
      
      // If viewing this opportunity, update selected opportunity too
      if (selectedOpportunity && selectedOpportunity._id === opportunityId) {
        setSelectedOpportunity({ ...selectedOpportunity, status: newStatus });
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleUpdateApplicantStatus = async (opportunityId, userId, newStatus) => {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/applicants/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update applicant status');
      }
      
      setSuccessMessage('Applicant status updated successfully');
      
      // Update local state
      setApplicants(applicants.map(app => 
        app._id === userId ? { ...app, applicationStatus: newStatus } : app
      ));
      
      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating applicant status:', err);
      setError('Failed to update applicant status. Please try again.');
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleCreateOpportunity = async (data) => {
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          requirements: data.requirements.split('\n').filter(Boolean),
          skillsNeeded: Array.isArray(data.skillsNeeded) ? data.skillsNeeded : [data.skillsNeeded]
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create opportunity');
      }
      
      const newOpportunity = await res.json();
      
      setSuccessMessage('Opportunity created successfully');
      setShowCreateModal(false);
      
      // Add new opportunity to state
      setOpportunities([newOpportunity, ...opportunities]);
      
      // Reset form
      reset();
      
      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error creating opportunity:', err);
      setError('Failed to create opportunity. Please try again.');
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleDeleteOpportunity = async (opportunityId) => {
    if (window.confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/opportunities/${opportunityId}`, {
          method: 'DELETE',
        });
        
        if (!res.ok) {
          throw new Error('Failed to delete opportunity');
        }
        
        setSuccessMessage('Opportunity deleted successfully');
        
        // Remove from local state
        setOpportunities(opportunities.filter(opp => opp._id !== opportunityId));
        
        // If viewing this opportunity, clear selected opportunity
        if (selectedOpportunity && selectedOpportunity._id === opportunityId) {
          setSelectedOpportunity(null);
          setApplicants([]);
        }
        
        // Clear message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error deleting opportunity:', err);
        setError('Failed to delete opportunity. Please try again.');
        
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      }
    }
  };
  
  if (status === 'loading' || (status === 'authenticated' && loading)) {
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
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage volunteer opportunities and applications
          </p>
        </motion.div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-8">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-8">
            {successMessage}
          </div>
        )}
        
        <div className="mb-8">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Create New Opportunity
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Opportunities list */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Volunteer Opportunities</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : opportunities.length > 0 ? (
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <div 
                    key={opp._id} 
                    className={`border rounded-md p-4 cursor-pointer transition-colors duration-200 ${
                      selectedOpportunity && selectedOpportunity._id === opp._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    onClick={() => handleViewApplicants(opp._id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{opp.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        opp.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : opp.status === 'filled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {opp.status.charAt(0).toUpperCase() + opp.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{opp.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {opp.skillsNeeded.slice(0, 3).map((skill) => (
                        <span 
                          key={skill} 
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {opp.skillsNeeded.length > 3 && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          +{opp.skillsNeeded.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {opp.applicants?.length || 0} applicant(s)
                      </span>
                      <span className="text-xs text-gray-500">
                        Posted: {new Date(opp.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                <p className="text-gray-500">No opportunities available</p>
              </div>
            )}
          </div>
          
          {/* Opportunity details & applicants */}
          <div className="lg:col-span-2">
            {selectedOpportunity ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedOpportunity.title}</h2>
                  <div className="flex space-x-2">
                    <div className="relative inline-block">
                      <select
                        value={selectedOpportunity.status}
                        onChange={(e) => handleUpdateStatus(selectedOpportunity._id, e.target.value)}
                        className="appearance-none px-4 py-1 pr-8 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="open">Open</option>
                        <option value="filled">Filled</option>
                        <option value="closed">Closed</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteOpportunity(selectedOpportunity._id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="border-b pb-4 mb-6">
                  <p className="mb-4 text-gray-600">{selectedOpportunity.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Time Commitment</h3>
                      <p className="text-gray-900">{selectedOpportunity.timeCommitment}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Project</h3>
                      <p className="text-gray-900">{selectedOpportunity.project}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                      <p className="text-gray-900">{selectedOpportunity.createdBy?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date Created</h3>
                      <p className="text-gray-900">{new Date(selectedOpportunity.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-4">Applicants ({applicants.length})</h3>
                
                {applicants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Skills
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Experience
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Applied On
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applicants.map((applicant) => (
                          <tr key={applicant._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{applicant.name}</div>
                              <div className="text-sm text-gray-500">{applicant.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {(applicant.skills || []).map((skill) => (
                                  <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {skill}
                                  </span>
                                ))}
                                {(!applicant.skills || applicant.skills.length === 0) && (
                                  <span className="text-sm text-gray-500">None specified</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{applicant.yearsExperience || 0} years</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(applicant.appliedAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                applicant.applicationStatus === 'accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : applicant.applicationStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {applicant.applicationStatus.charAt(0).toUpperCase() + applicant.applicationStatus.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="relative inline-block">
                                <select
                                  value={applicant.applicationStatus}
                                  onChange={(e) => handleUpdateApplicantStatus(selectedOpportunity._id, applicant._id, e.target.value)}
                                  className="appearance-none px-3 py-1 pr-8 border border-gray-300 rounded-md bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="accepted">Accept</option>
                                  <option value="rejected">Reject</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                  </svg>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                    <p className="text-gray-500">No applications yet</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunity selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select an opportunity to view details and applicants</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Opportunity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(handleCreateOpportunity)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Create New Opportunity</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        id="title"
                        type="text"
                        {...register('title', { required: 'Title is required' })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows="4"
                        {...register('description', { required: 'Description is required' })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      ></textarea>
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                          Project
                        </label>
                        <input
                          id="project"
                          type="text"
                          defaultValue="StarCraft 2"
                          {...register('project')}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="timeCommitment" className="block text-sm font-medium text-gray-700">
                          Time Commitment
                        </label>
                        <input
                          id="timeCommitment"
                          type="text"
                          placeholder="e.g. 5-10 hours/week"
                          {...register('timeCommitment', { required: 'Time commitment is required' })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {errors.timeCommitment && (
                          <p className="mt-1 text-sm text-red-600">{errors.timeCommitment.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                        Requirements (one per line)
                      </label>
                      <textarea
                        id="requirements"
                        rows="3"
                        placeholder="e.g. 3+ years C++ experience"
                        {...register('requirements', { required: 'Requirements are required' })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      ></textarea>
                      {errors.requirements && (
                        <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Skills Needed
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {allSkills.map((skill) => (
                          <div key={skill} className="flex items-center">
                            <input
                              id={`skill-${skill}`}
                              type="checkbox"
                              value={skill}
                              {...register('skillsNeeded', { required: 'At least one skill is required' })}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`skill-${skill}`} className="ml-2 text-sm text-gray-700">
                              {skill}
                            </label>
                          </div>
                        ))}
                      </div>
                      {errors.skillsNeeded && (
                        <p className="mt-1 text-sm text-red-600">{errors.skillsNeeded.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
