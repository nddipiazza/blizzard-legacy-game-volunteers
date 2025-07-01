import connectDB from '@/lib/mongodb';
import Opportunity from '@/models/Opportunity';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

// Update applicant status
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    const opportunityId = params.id;
    const userId = params.userId;
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Find opportunity
    const opportunity = await Opportunity.findById(opportunityId);
    
    if (!opportunity) {
      return NextResponse.json(
        { message: 'Opportunity not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update applicant status
    if (session.user.role !== 'admin' && 
        session.user.role !== 'project-lead' && 
        opportunity.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'Not authorized to update applicant status' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Find the applicant index in the array
    const applicantIndex = opportunity.applicants.findIndex(
      app => app.user.toString() === userId
    );
    
    if (applicantIndex === -1) {
      return NextResponse.json(
        { message: 'Applicant not found' },
        { status: 404 }
      );
    }
    
    // Update applicant status
    opportunity.applicants[applicantIndex].status = data.status;
    
    // If accepting this applicant and opportunity status is 'open', 
    // check if we should change opportunity status to 'filled'
    if (data.status === 'accepted' && opportunity.status === 'open' && data.fillOpportunity === true) {
      opportunity.status = 'filled';
    }
    
    await opportunity.save();
    
    return NextResponse.json(
      { message: 'Applicant status updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating applicant status:', error);
    return NextResponse.json(
      { message: error.message || 'Error updating applicant status' },
      { status: 500 }
    );
  }
}
