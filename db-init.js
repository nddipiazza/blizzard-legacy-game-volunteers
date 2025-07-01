// db-init.js
// Script to initialize the MongoDB database with initial data

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable in .env.local');
  process.exit(1);
}

// Import models
import '../src/models/User.js';
import '../src/models/Opportunity.js';

const User = mongoose.models.User;
const Opportunity = mongoose.models.Opportunity;

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$10$vIEVyysCZnF/EIXQxhkcUexvCZKDgjR9ciiPJVL/DAXIVnRh2joae', // "password123" hashed
    role: 'admin',
    skills: ['C++', 'Game Development', 'Graphics Programming'],
    bio: 'Administrator account for the Blizzard Legacy Game Volunteer Platform.',
    githubUrl: 'https://github.com/admin',
    linkedinUrl: 'https://linkedin.com/in/admin',
  },
  {
    name: 'Volunteer User',
    email: 'volunteer@example.com',
    password: '$2a$10$vIEVyysCZnF/EIXQxhkcUexvCZKDgjR9ciiPJVL/DAXIVnRh2joae', // "password123" hashed
    role: 'volunteer',
    skills: ['C++', 'Game Development'],
    bio: 'Passionate game developer eager to contribute to legacy Blizzard games.',
    githubUrl: 'https://github.com/volunteer',
    linkedinUrl: 'https://linkedin.com/in/volunteer',
  },
];

const opportunities = [
  {
    title: 'StarCraft 2 Pathfinding Optimization',
    description: 'Improve the pathfinding algorithm for large groups of units to reduce CPU usage and increase performance.',
    requirements: [
      'Strong C++ skills',
      'Experience with game AI and pathfinding algorithms',
      'Understanding of performance optimization techniques'
    ],
    skillsNeeded: ['C++', 'AI', 'Algorithm Optimization'],
    status: 'open',
    estimatedHours: 40,
    difficultyLevel: 'advanced',
  },
  {
    title: 'Legacy UI Component Fixes',
    description: 'Fix various issues with UI components in the game lobby and settings screens.',
    requirements: [
      'Familiarity with C++ UI frameworks',
      'Experience debugging UI issues',
      'Attention to detail'
    ],
    skillsNeeded: ['C++', 'UI Development'],
    status: 'open',
    estimatedHours: 20,
    difficultyLevel: 'intermediate',
  },
];

// Connect to MongoDB and initialize data
async function initializeDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await Opportunity.deleteMany({});
    console.log('Cleared existing data');
    
    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log('Users created:', createdUsers.length);
    
    // Insert opportunities linked to the admin user
    const adminUser = createdUsers.find(user => user.role === 'admin');
    const opportunitiesWithCreator = opportunities.map(opp => ({
      ...opp,
      createdBy: adminUser._id
    }));
    
    const createdOpportunities = await Opportunity.insertMany(opportunitiesWithCreator);
    console.log('Opportunities created:', createdOpportunities.length);
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

initializeDB();
