import { authRepository, type User } from '../repositories/authRepository';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import i18n from '../i18n';

// Consistent return format for all actions
interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * ACTIONS LAYER - Pure business logic functions for Auth
 * These functions handle all authentication logic, API calls, validations, and side effects
 * They access stores directly using getState() and return consistent results
 */
export const authActions = {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<ActionResult<{ user: User; token: string }>> {
    // Validation
    if (!email.trim()) {
      return { success: false, error: 'Email is required' };
    }
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    const { setGlobalLoading } = useUiStore.getState();
    const { clearError } = useAuthStore.getState();
    
    setGlobalLoading(true);
    clearError();
    
    try {
      const result = await authRepository.login({ email: email.trim(), password });
      
      if (result.success && result.user && result.token) {
        const { user, token } = result;
        
        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        
        // Set language from user preference
        if (user.language) {
          i18n.changeLanguage(user.language);
        }
        
        // Update auth store
        useAuthStore.setState({
          user,
          token,
          isAuthenticated: true,
          error: null
        });
        
        setGlobalLoading(false);
        return { success: true, data: { user, token } };
      } else {
        const errorMessage = result.error || 'Login failed';
        useAuthStore.setState({ error: errorMessage });
        setGlobalLoading(false);
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Network error during login';
      useAuthStore.setState({ error: errorMessage });
      setGlobalLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Register new user
   */
  async register(name: string, email: string, password: string): Promise<ActionResult<{ user: User; token: string }>> {
    // Validation
    if (!name.trim()) {
      return { success: false, error: 'Name is required' };
    }
    if (!email.trim()) {
      return { success: false, error: 'Email is required' };
    }
    if (!password) {
      return { success: false, error: 'Password is required' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const { setGlobalLoading } = useUiStore.getState();
    const { clearError } = useAuthStore.getState();
    
    setGlobalLoading(true);
    clearError();
    
    try {
      const result = await authRepository.register({ 
        name: name.trim(), 
        email: email.trim(), 
        password 
      });
      
      if (result.success && result.user && result.token) {
        const { user, token } = result;
        
        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        
        // Set language from user preference (default to 'en' for new users)
        if (user.language) {
          i18n.changeLanguage(user.language);
        }
        
        // Update auth store
        useAuthStore.setState({
          user,
          token,
          isAuthenticated: true,
          error: null
        });
        
        setGlobalLoading(false);
        return { success: true, data: { user, token } };
      } else {
        const errorMessage = result.error || 'Registration failed';
        useAuthStore.setState({ error: errorMessage });
        setGlobalLoading(false);
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Network error during registration';
      useAuthStore.setState({ error: errorMessage });
      setGlobalLoading(false);
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<ActionResult<void>> {
    const { setGlobalLoading } = useUiStore.getState();
    
    setGlobalLoading(true);
    
    try {
      await authRepository.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    }
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    
    // Clear auth state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
    
    setGlobalLoading(false);
    return { success: true };
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ActionResult<User>> {
    const { token } = useAuthStore.getState();
    if (!token) {
      return { success: false, error: 'No auth token found' };
    }

    const { setGlobalLoading } = useUiStore.getState();
    
    setGlobalLoading(true);
    
    try {
      const result = await authRepository.getProfile();
      
      if (result.success && result.user) {
        // Set language from user preference
        if (result.user.language) {
          i18n.changeLanguage(result.user.language);
        }
        
        useAuthStore.setState({
          user: result.user,
          error: null
        });
        
        setGlobalLoading(false);
        return { success: true, data: result.user };
      } else {
        // Invalid token, trigger logout
        await authActions.logout();
        return { success: false, error: 'Invalid authentication token' };
      }
    } catch (error) {
      setGlobalLoading(false);
      return { success: false, error: 'Failed to fetch profile' };
    }
  },

  /**
   * Initialize auth state from storage
   */
  async initialize(): Promise<ActionResult<void>> {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      useAuthStore.setState({ token });
      
      // Validate token and get user profile (includes language preference)
      const profileResult = await authActions.getProfile();
      return profileResult.success 
        ? { success: true } 
        : { success: false, error: 'Failed to initialize auth' };
    } else {
      // For non-authenticated users, try to get language preference
      try {
        const languageResult = await authRepository.getLanguagePreference();
        if (languageResult.success && languageResult.language) {
          i18n.changeLanguage(languageResult.language);
        }
      } catch (error) {
        // Silently fail - user is not authenticated
      }
      
      return { success: true };
    }
  },

  /**
   * Clear error state
   */
  clearError(): ActionResult<void> {
    useAuthStore.setState({ error: null });
    return { success: true };
  },

  /**
   * Set loading state
   */
  setLoading(loading: boolean): ActionResult<void> {
    useAuthStore.setState({ isLoading: loading });
    return { success: true };
  }
};