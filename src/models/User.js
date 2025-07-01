import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['volunteer', 'admin', 'project-lead'],
    default: 'volunteer',
  },
  skills: [{
    type: String,
    enum: ['C++', 'Game Development', 'Graphics', 'AI', 'Networking', 'Physics', 'Tools', 'UI/UX', 'Testing', 'Documentation'],
  }],
  yearsExperience: {
    type: Number,
    default: 0,
  },
  bio: String,
  githubProfile: String,
  linkedinProfile: String,
  portfolioUrl: String,
  profileComplete: {
    type: Boolean,
    default: false,
  },
  appliedOpportunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
