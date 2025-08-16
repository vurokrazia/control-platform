import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User, UserEntity } from '../../../domain/entities/User';
import { UserModel, IUserDocument } from '../models/UserModel';

export class UserRepository implements IUserRepository {
  
  async create(user: User): Promise<User> {
    const userData = {
      _id: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
      password: user.password,
      name: user.name,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      language: user.language,
      lastLoginAt: user.lastLoginAt
    };

    const newUser = new UserModel(userData);
    const savedUser = await newUser.save();
    
    return this.toEntity(savedUser);
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findOne({ id }).exec();
    return user ? this.toEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ 
      email: email.toLowerCase().trim() 
    }).exec();
    return user ? this.toEntity(user) : null;
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const updateData = {
      ...userData,
      updatedAt: new Date()
    };

    // Remove id and password from update if present (handled separately)
    delete updateData.id;
    if (!userData.password) {
      delete updateData.password;
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    ).exec();

    return updatedUser ? this.toEntity(updatedUser) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.deleteOne({ id }).exec();
    return result.deletedCount > 0;
  }

  async updateLastLogin(id: string): Promise<void> {
    await UserModel.updateOne(
      { id },
      { 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }
    ).exec();
  }

  async activateUser(id: string): Promise<boolean> {
    const result = await UserModel.updateOne(
      { id },
      { 
        isActive: true,
        updatedAt: new Date()
      }
    ).exec();
    return result.modifiedCount > 0;
  }

  async deactivateUser(id: string): Promise<boolean> {
    const result = await UserModel.updateOne(
      { id },
      { 
        isActive: false,
        updatedAt: new Date()
      }
    ).exec();
    return result.modifiedCount > 0;
  }

  async verifyEmail(id: string): Promise<boolean> {
    const result = await UserModel.updateOne(
      { id },
      { 
        emailVerified: true,
        updatedAt: new Date()
      }
    ).exec();
    return result.modifiedCount > 0;
  }

  async updateLanguage(id: string, language: string): Promise<boolean> {
    if (language !== 'en' && language !== 'es') {
      return false;
    }
    
    const result = await UserModel.updateOne(
      { id },
      { 
        language: language,
        updatedAt: new Date()
      }
    ).exec();
    return result.modifiedCount > 0;
  }

  async findActiveUsers(): Promise<User[]> {
    const users = await UserModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
    return users.map(user => this.toEntity(user));
  }

  async countUsers(): Promise<number> {
    return await UserModel.countDocuments().exec();
  }

  private toEntity(userDoc: IUserDocument): User {
    return new UserEntity(
      userDoc.email,
      userDoc.password,
      userDoc.name,
      userDoc.id,
      userDoc.username,
      userDoc.isActive,
      userDoc.emailVerified,
      userDoc.language,
      userDoc.lastLoginAt,
      userDoc.createdAt,
      userDoc.updatedAt
    );
  }

  // Method to verify password (delegates to model method)
  async verifyPassword(email: string, candidatePassword: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    }).exec();
    
    if (!userDoc) {
      return null;
    }

    const isPasswordValid = await userDoc.comparePassword(candidatePassword);
    if (!isPasswordValid) {
      return null;
    }

    return this.toEntity(userDoc);
  }
}