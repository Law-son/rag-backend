import mongoose from 'mongoose';

const financeRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
  donorName: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'Cash'
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
financeRecordSchema.index({ date: -1 });
financeRecordSchema.index({ type: 1 });
financeRecordSchema.index({ member: 1 });

// Auto-generate receipt number
financeRecordSchema.pre('save', async function(next) {
  if (!this.receiptNumber && this.isNew) {
    const count = await this.constructor.countDocuments();
    this.receiptNumber = `RCP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('FinanceRecord', financeRecordSchema);