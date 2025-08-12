import axios from 'axios';
import { API_BASE_URL } from '../constants';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    expiresAt: string;
  };
  message?: string;
  error?: string;
}

export class AuthRepository {
  private baseURL = `${API_BASE_URL}/auth`;

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/login`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/register`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await axios.post(`${this.baseURL}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      return { success: true };
    } catch (error) {
      return { success: true }; // Logout locally even if API fails
    }
  }

  async getProfile(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await axios.get(`${this.baseURL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get profile'
      };
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await axios.post(`${this.baseURL}/password/change`, {
        oldPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Password change failed'
      };
    }
  }
}

export const authRepository = new AuthRepository();