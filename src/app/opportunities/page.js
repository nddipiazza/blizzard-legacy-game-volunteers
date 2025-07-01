'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function OpportunitiesPage() {
  const { data: session } = useSession();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skills: [],
    search: '',
  });
  
  const allSkills = ['C++', 'Game Development', 'Graphics', 'AI', 'Networking', 'Physics', 'Tools', 'UI/UX', 'Testing', 'Documentation'];
  
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        let url = '/api/opportunities?status=open';
        
        if (filters.skills.length > 0) {
          url += `&skills=${filters.skills.join(',')}`;
        }
        
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error('Failed to fetch opportunities');
        }
        
        const data = await res.json();
        
        // Filter by search term if present
        const filteredData = filters.search 
          ? data.filter(opp => 
              opp.title.toLowerCase().includes(filters.search.toLowerCase()) || 
              opp.description.toLowerCase().includes(filters.search.toLowerCase())
            )
          : data;
          
        setOpportunities(filteredData);
      } catch (err) {
        console.error('Error fetching opportunities:', err);
        setError('Failed to load opportunities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOpportunities();
  }, [filters]);
  
  const handleSkillToggle = (skill) => {
    setFilters(prev => {
      const newSkills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill];
      
      return {
        ...prev,
        skills: newSkills
      };
    });
  };
  
  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="py-10 min-h-screen">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Volunteer Opportunities</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join the passionate community of developers helping to maintain and improve StarCraft 2's legacy code
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-md h-fit lg:sticky lg:top-24"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Filter Opportunities</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search opportunities..."
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="space-y-2">
                {allSkills.map(skill => (
                  <div key={skill} className="flex items-center">
                    <input
                      id={`skill-${skill}`}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={filters.skills.includes(skill)}
                      onChange={() => handleSkillToggle(skill)}
                    />
                    <label htmlFor={`skill-${skill}`} className="ml-2 text-sm text-gray-700">
                      {skill}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Opportunities list */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : opportunities.length > 0 ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {opportunities.map((opportunity) => (
                  <motion.div
                    key={opportunity._id}
                    variants={item}
                    className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{opportunity.title}</h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">{opportunity.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {opportunity.skillsNeeded.map((skill) => (
                          <span 
                            key={skill} 
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Time: {opportunity.timeCommitment}
                        </span>
                        
                        <Link 
                          href={`/opportunities/${opportunity._id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-medium text-gray-900 mb-2">No opportunities found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or check back later for new opportunities.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
