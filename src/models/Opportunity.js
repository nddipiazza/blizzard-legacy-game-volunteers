import mongoose from 'mongoose';

const OpportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  project: {
    type: String,
    default: 'StarCraft 2',
  },
  requirements: {
    type: [String],
    required: [true, 'Please add at least one requirement'],
  },
  skillsNeeded: {
    type: [String],
    required: [true, 'Please add at least one required skill'],
    enum: ['C++', 'Game Development', 'Graphics', 'AI', 'Networking', 'Physics', 'Tools', 'UI/UX', 'Testing', 'Documentation'],
  },
  timeCommitment: {
    type: String,
    required: [true, 'Please specify the expected time commitment'],
  },
  status: {
    type: String,
    enum: ['open', 'filled', 'closed'],
    default: 'open',
  },
  applicants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for faster queries
OpportunitySchema.index({ title: 'text', description: 'text' });

export default mongoose.models.Opportunity || mongoose.model('Opportunity', OpportunitySchema);
