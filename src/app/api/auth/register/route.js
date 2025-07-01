import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectDB();
    const { name, email, password } = await request.json();
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });
    
    return NextResponse.json(
      { 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email,
          role: user.role,
          profileComplete: user.profileComplete
        },
        message: 'User registered successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error.message || 'Something went wrong during registration' },
      { status: 500 }
    );
  }
}
