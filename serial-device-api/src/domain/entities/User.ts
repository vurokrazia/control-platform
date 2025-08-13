import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  isActive: boolean;
  emailVerified: boolean;
  language: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity implements User {
  public readonly id: string;
  public email: string;
  public password: string;
  public name: string;
  public isActive: boolean;
  public emailVerified: boolean;
  public language: string;
  public lastLoginAt?: Date;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    email: string,
    password: string,
    name: string,
    id?: string,
    isActive: boolean = true,
    emailVerified: boolean = false,
    language: string = 'en',
    lastLoginAt?: Date,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.id = id || uuidv4();
    this.email = email.toLowerCase().trim();
    this.password = password;
    this.name = name.trim();
    this.isActive = isActive;
    this.emailVerified = emailVerified;
    this.language = language;
    if (lastLoginAt !== undefined) {
      this.lastLoginAt = lastLoginAt;
    }
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  public updateLastLogin(): void {
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  public verifyEmail(): void {
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  public updateProfile(name?: string, email?: string): void {
    if (name) {
      this.name = name.trim();
    }
    if (email) {
      this.email = email.toLowerCase().trim();
    }
    this.updatedAt = new Date();
  }

  public updateLanguage(language: string): void {
    if (language === 'en' || language === 'es') {
      this.language = language;
      this.updatedAt = new Date();
    }
  }
}