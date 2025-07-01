import connectDB from '@/lib/mongodb';
import Opportunity from '@/models/Opportunity';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

// Get a single opportunity
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    const opportunityId = params.id;
    
    const opportunity = await Opportunity.findById(opportunityId)
      .populate('createdBy', 'name email');
      
    if (!opportunity) {
      return NextResponse.json(
        { message: 'Opportunity not found' },
        { status: 404 }
      );
    }
    
    // If user is logged in, check if they have already applied
    let hasApplied = false;
    
    if (session?.user?.id) {
      hasApplied = opportunity.applicants.some(
        applicant => applicant.user.toString() === session.user.id
      );
    }
    
    // Convert to a plain object to add the hasApplied flag
    const opportunityObj = opportunity.toObject();
    opportunityObj.hasApplied = hasApplied;
    
    // Remove applicants details for non-admins and non-creators
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'project-lead' && 
        opportunity.createdBy._id.toString() !== session?.user?.id) {
      // Just include the count, not the details
      opportunityObj.applicantCount = opportunity.applicants.length;
      delete opportunityObj.applicants;
    }
    
    return NextResponse.json(opportunityObj);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching opportunity' },
      { status: 500 }
    );
  }
}

// Update an opportunity
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    const opportunityId = params.id;
    
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
    
    // Check if user has permission to update this opportunity
    if (session.user.role !== 'admin' && 
        session.user.role !== 'project-lead' && 
        opportunity.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'Not authorized to update this opportunity' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Update opportunity
    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      opportunityId,
      { 
        ...data,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    return NextResponse.json(updatedOpportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { message: error.message || 'Error updating opportunity' },
      { status: 500 }
    );
  }
}

// Delete an opportunity
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    const opportunityId = params.id;
    
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
    
    // Check if user has permission to delete this opportunity
    if (session.user.role !== 'admin' && 
        session.user.role !== 'project-lead' && 
        opportunity.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { message: 'Not authorized to delete this opportunity' },
        { status: 403 }
      );
    }
    
    await Opportunity.findByIdAndDelete(opportunityId);
    
    return NextResponse.json(
      { message: 'Opportunity deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      { message: error.message || 'Error deleting opportunity' },
      { status: 500 }
    );
  }
}
