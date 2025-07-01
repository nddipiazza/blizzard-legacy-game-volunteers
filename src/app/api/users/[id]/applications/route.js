import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Opportunity from '@/models/Opportunity';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

// Get a user's applications
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    const userId = params.id;
    
    // Check if user is authenticated and has permission to access this data
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow users to access their own applications unless they're an admin
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Not authorized to access these applications' },
        { status: 403 }
      );
    }
    
    // Find the user and populate their applied opportunities
    const user = await User.findById(userId).select('appliedOpportunities');
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get detailed application information with opportunity details
    const applicationDetails = await Opportunity.aggregate([
      {
        $match: {
          _id: { $in: user.appliedOpportunities }
        }
      },
      {
        $unwind: '$applicants'
      },
      {
        $match: {
          'applicants.user': user._id
        }
      },
      {
        $project: {
          id: '$_id',
          opportunity: {
            id: '$_id',
            title: '$title',
            project: '$project',
            description: '$description',
            status: '$status'
          },
          status: '$applicants.status',
          appliedAt: '$applicants.appliedAt'
        }
      },
      {
        $sort: { appliedAt: -1 }
      }
    ]);
    
    return NextResponse.json(applicationDetails);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching applications' },
      { status: 500 }
    );
  }
}
