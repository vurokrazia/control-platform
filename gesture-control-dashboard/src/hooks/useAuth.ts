import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { authActions } from '../actions/authActions';

/**
 * HOOKS LAYER - Clean API facade for Authentication
 * Acts as a bridge between actions and components
 * Returns consistent format: { state: {...}, actions: {...} }
 */
export const useAuth = () => {
  // Auth state selectors - granular subscriptions for optimal re-rendering
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const error = useAuthStore(state => state.error);
  
  // UI state selectors
  const isLoading = useUiStore(state => state.loading.global);

  // Computed state - derived values
  const userDisplayName = user?.name || user?.email || 'User';
  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';
  
  const hasToken = !!token;
  const isReady = !isLoading; // Auth system is ready (not loading)

  return {
    // STATE - Everything the component needs to render
    state: {
      user,
      token,
      isAuthenticated,
      isLoading,
      error,
      hasToken,
      isReady,
      // Computed values
      userDisplayName,
      userInitials
    },

    // ACTIONS - Clean function references (no business logic)
    actions: {
      login: authActions.login,
      register: authActions.register,
      logout: authActions.logout,
      getProfile: authActions.getProfile,
      initialize: authActions.initialize,
      clearError: authActions.clearError,
      setLoading: authActions.setLoading
    }
  };
};