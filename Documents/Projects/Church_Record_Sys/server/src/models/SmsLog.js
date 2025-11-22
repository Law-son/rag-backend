import mongoose from 'mongoose';

const smsLogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    required: false
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['manual', 'birthday', 'announcement'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  provider: {
    type: String,
    enum: ['twilio', 'africastalking', 'arkesel', 'test'],
    default: 'arkesel'
  },
  providerId: {
    type: String
  },
  error: {
    type: String
  },
  cost: {
    type: Number,
    default: 0
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipients: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    phone: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    error: String
  }]
}, {
  timestamps: true
});

// Indexes
smsLogSchema.index({ createdAt: -1 });
smsLogSchema.index({ type: 1 });
smsLogSchema.index({ status: 1 });

export default mongoose.model('SmsLog', smsLogSchema);