import { useState, useEffect } from 'react';
import { getPendingRegistration,  } from '../services/authService';

export const useAuthValidation = () => {
  const [hasPendingRegistration, setHasPendingRegistration] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 1. Verificar si hay registro pendiente
      const pending = await getPendingRegistration();
      setHasPendingRegistration(!!pending);

    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return {
    hasPendingRegistration,
    isCheckingAuth,
    isAuthenticated,
    refresh: checkAuthStatus,
  };
};
