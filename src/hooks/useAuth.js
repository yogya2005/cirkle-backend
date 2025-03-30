import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { signInWithGoogle, logOut } from '../services/authService';

export const useAuth = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const login = async () => {
    try {
      return await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      return await logOut();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return {
    user: auth.currentUser,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    login,
    logout
  };
};