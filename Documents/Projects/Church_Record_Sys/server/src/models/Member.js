import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  maritalStatus: {
    type: String,
    required: true,
    enum: ['Single', 'Married', 'Divorced', 'Widowed']
  },
  occupation: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    relationship: {
      type: String,
      required: true,
      trim: true
    }
  },
  baptismStatus: {
    type: String,
    required: true,
    enum: ['Baptized', 'Not Baptized', 'Planning to be Baptized']
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
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
memberSchema.index({ fullName: 'text' });
memberSchema.index({ department: 1 });
memberSchema.index({ maritalStatus: 1 });
memberSchema.index({ baptismStatus: 1 });
memberSchema.index({ isActive: 1 });
memberSchema.index({ dateOfBirth: 1 });

// Virtual for age calculation
memberSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for birthday this year
memberSchema.virtual('birthdayThisYear').get(function() {
  const today = new Date();
  const birthday = new Date(this.dateOfBirth);
  birthday.setFullYear(today.getFullYear());
  return birthday;
});

// Check if birthday is today
memberSchema.methods.isBirthdayToday = function() {
  const today = new Date();
  const birthday = new Date(this.dateOfBirth);
  
  return today.getMonth() === birthday.getMonth() && 
         today.getDate() === birthday.getDate();
};

export default mongoose.model('Member', memberSchema);