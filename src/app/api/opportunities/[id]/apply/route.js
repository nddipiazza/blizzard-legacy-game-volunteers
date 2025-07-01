import connectDB from '@/lib/mongodb';
import Opportunity from '@/models/Opportunity';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const opportunityId = params.id;
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Find the opportunity
    const opportunity = await Opportunity.findById(opportunityId);
    
    if (!opportunity) {
      return NextResponse.json(
        { message: 'Opportunity not found' },
        { status: 404 }
      );
    }
    
    // Check if opportunity is still open
    if (opportunity.status !== 'open') {
      return NextResponse.json(
        { message: 'This opportunity is no longer accepting applications' },
        { status: 400 }
      );
    }
    
    // Check if user already applied
    const alreadyApplied = opportunity.applicants.some(
      applicant => applicant.user.toString() === session.user.id
    );
    
    if (alreadyApplied) {
      return NextResponse.json(
        { message: 'You have already applied to this opportunity' },
        { status: 400 }
      );
    }
    
    // Add user to applicants
    opportunity.applicants.push({
      user: session.user.id,
      status: 'pending',
      appliedAt: new Date()
    });
    
    await opportunity.save();
    
    // Add opportunity to user's applied opportunities
    await User.findByIdAndUpdate(
      session.user.id,
      { $push: { appliedOpportunities: opportunityId } }
    );
    
    return NextResponse.json(
      { message: 'Application submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error applying to opportunity:', error);
    return NextResponse.json(
      { message: error.message || 'Error applying to opportunity' },
      { status: 500 }
    );
  }
}
