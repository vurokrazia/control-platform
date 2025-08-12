import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUserDocument extends Document {
  _id: string;
  id: string;
  email: string;
  password: string;
  name: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>({
  _id: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Pre-save middleware to hash password
UserSchema.pre<IUserDocument>('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with salt rounds of 12
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    this.password = hashedPassword;
    
    // Set _id to be the same as id for consistency
    if (!this._id) {
      this._id = this.id;
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ id: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);