import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

// Get user profile
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    const userId = params.id;
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow users to access their own profile unless they're an admin
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Not authorized to access this profile' },
        { status: 403 }
      );
    }
    
    // Find user but don't return the password field
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching user profile' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    const userId = params.id;
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow users to update their own profile unless they're an admin
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Not authorized to update this profile' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Only allow updating certain fields (not role, password, etc)
    const allowedUpdates = {
      name: data.name,
      bio: data.bio,
      skills: data.skills,
      yearsExperience: data.yearsExperience,
      githubProfile: data.githubProfile,
      linkedinProfile: data.linkedinProfile,
      portfolioUrl: data.portfolioUrl
    };
    
    // Check if the profile is now complete
    // A complete profile has name, at least one skill, and years of experience
    const profileComplete = 
      allowedUpdates.name && 
      allowedUpdates.skills && 
      allowedUpdates.skills.length > 0 && 
      typeof allowedUpdates.yearsExperience === 'number';
      
    // Add profileComplete to allowed updates
    allowedUpdates.profileComplete = profileComplete;
    
    // Set update timestamp
    allowedUpdates.updatedAt = new Date();
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { message: error.message || 'Error updating user profile' },
      { status: 500 }
    );
  }
}
