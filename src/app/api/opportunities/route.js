import connectDB from '@/lib/mongodb';
import Opportunity from '@/models/Opportunity';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

// Get all opportunities
export async function GET(request) {
  try {
    await connectDB();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const skills = searchParams.get('skills')?.split(',') || [];
    
    // Build query
    const query = { status };
    if (skills.length > 0) {
      query.skillsNeeded = { $in: skills };
    }
    
    const opportunities = await Opportunity.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { message: 'Error fetching opportunities' },
      { status: 500 }
    );
  }
}

// Create new opportunity
export async function POST(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to create opportunities
    if (session.user.role !== 'admin' && session.user.role !== 'project-lead') {
      return NextResponse.json(
        { message: 'Not authorized to create opportunities' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Create new opportunity with authenticated user as creator
    const opportunity = await Opportunity.create({
      ...data,
      createdBy: session.user.id
    });
    
    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { message: error.message || 'Error creating opportunity' },
      { status: 500 }
    );
  }
}
