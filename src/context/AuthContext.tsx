// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipos
interface User {
  id: string;
  email: string;
  role: 'client' | 'manager';
  emailVerified?: boolean;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  needsEmailVerification: boolean; // NUEVO: indica si necesita verificar email
  pendingUserData: VerifyData | null; // NUEVO: datos del usuario pendiente
}

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'STOP_LOADING' }
  | { type: 'SET_NEEDS_VERIFICATION'; payload: { userData: VerifyData } }; // NUEVO

// Estado inicial
const initialState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  token: null,
  needsEmailVerification: false,
  pendingUserData: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        needsEmailVerification: false,
        pendingUserData: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        needsEmailVerification: false,
        pendingUserData: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'STOP_LOADING':
      return { ...state, isLoading: false };
    case 'SET_NEEDS_VERIFICATION':
      return {
        ...state,
        isLoading: false,
        needsEmailVerification: true,
        pendingUserData: action.payload.userData,
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ needsVerification: boolean; role: string }>;
  verifyAndSync: (data: VerifyData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  checkIfManagerHasCafe: () => Promise<boolean>;
}>({
  state: initialState,
  login: async () => {},
  register: async () => ({ needsVerification: false, role: 'client' }),
  verifyAndSync: async () => {},
  logout: async () => {},
  updateUser: () => {},
  checkIfManagerHasCafe: async () => false,
});

// Tipos para registro
interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  role: 'client' | 'manager';
}

interface VerifyData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  role: 'client' | 'manager';
}

// Configuración de la API
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID; // Delatte Mobile (Native)
const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

// TEMPORAL: Para testing, usar credenciales de Delatte Backend si el password grant no funciona
const AUTH0_BACKEND_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_ID; // UfkvGwQ7iTGiBtQ0jBsD6rps5n6FivJ8
const AUTH0_BACKEND_CLIENT_SECRET = process.env.EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_SECRET;

// Debug: Verificar variables de entorno
console.log('🔧 Variables de entorno:');
console.log('📡 API_URL:', API_URL);
console.log('🔐 AUTH0_DOMAIN:', AUTH0_DOMAIN);
console.log('🔐 AUTH0_CLIENT_ID (Mobile):', AUTH0_CLIENT_ID);
console.log('🔐 AUTH0_BACKEND_CLIENT_ID:', AUTH0_BACKEND_CLIENT_ID);
console.log('🔐 AUTH0_AUDIENCE:', AUTH0_AUDIENCE);

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar si hay sesión guardada al iniciar la app
  useEffect(() => {
    console.log('🚀 AuthProvider iniciado');
    console.log('🔧 Verificando variables de entorno en Provider:');
    console.log('📡 API_URL:', API_URL);
    console.log('🔐 AUTH0_DOMAIN:', AUTH0_DOMAIN);
    console.log('🔐 AUTH0_CLIENT_ID:', AUTH0_CLIENT_ID);
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      } else {
        dispatch({ type: 'STOP_LOADING' });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      dispatch({ type: 'STOP_LOADING' });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'LOADING' });

      console.log('🔄 Intentando login con:', email);
      console.log('📡 API URL:', API_URL);

      // Cambio temporal: usar Auth0 directo como en el registro
      console.log('🔄 Intentando login directo con Auth0...');
      
      let loginRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'password',
          username: email,
          password: password,
          audience: AUTH0_AUDIENCE,
          client_id: AUTH0_CLIENT_ID,
          connection: 'Username-Password-Authentication',
        }),
      });

      console.log('📊 Status login Auth0 directo:', loginRes.status);

      if (!loginRes.ok) {
        console.log('⚠️ Login nativo falló, intentando con credenciales de backend...');
        
        // Fallback: usar credenciales del backend
        loginRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'password',
            username: email,
            password: password,
            audience: AUTH0_AUDIENCE,
            client_id: AUTH0_BACKEND_CLIENT_ID,
            client_secret: AUTH0_BACKEND_CLIENT_SECRET,
            connection: 'Username-Password-Authentication',
          }),
        });

        console.log('📊 Status login backend:', loginRes.status);
      }

      // Leer la respuesta como texto primero para ver qué está devolviendo
      const responseText = await loginRes.text();
      console.log('📄 Respuesta Auth0:', responseText);

      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parseando JSON de Auth0:', parseError);
        console.error('📄 Contenido que causó el error:', responseText);
        throw new Error('Error al iniciar sesión. Verifica tus credenciales.');
      }

      if (!loginRes.ok) {
        console.error('❌ Error en login Auth0:', tokenData);
        throw new Error(tokenData.error_description || 'Error al iniciar sesión');
      }

      const token = tokenData.access_token;
      console.log('✅ Token obtenido de Auth0');

      // 2. Obtener datos del usuario desde tu API
      const userRes = await fetch(`${API_URL}/users/role`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const userResponseText = await userRes.text();
      console.log('👤 Respuesta usuario cruda:', userResponseText);

      let userData;
      try {
        userData = JSON.parse(userResponseText);
      } catch (parseError) {
        console.error('❌ Error parseando respuesta de usuario:', parseError);
        throw new Error('Error al obtener datos del usuario');
      }

      if (!userRes.ok) {
        console.error('❌ Error obteniendo usuario:', userData);
        throw new Error(userData.error || 'Error al obtener rol del usuario');
      }

      console.log('👤 Usuario obtenido:', userData);

      // 3. Guardar en AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // 4. Actualizar estado
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, token } });

    } catch (error) {
      console.error('🚨 Error completo en login:', error);
      dispatch({ type: 'STOP_LOADING' });
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<{ needsVerification: boolean; role: string }> => {
    try {
      dispatch({ type: 'LOADING' });

      console.log('🔄 Intentando registro con:', data.email, 'como', data.role);
      console.log('🔐 Auth0 Domain:', AUTH0_DOMAIN);
      console.log('🔐 Auth0 Client ID:', AUTH0_CLIENT_ID);

      const auth0Url = `https://${AUTH0_DOMAIN}/dbconnections/signup`;
      console.log('🔗 URL completa de Auth0:', auth0Url);

      // 1. Registrar en Auth0
      const signupRes = await fetch(auth0Url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: AUTH0_CLIENT_ID,
          email: data.email,
          password: data.password,
          connection: 'Username-Password-Authentication',
          name: `${data.nombre} ${data.apellido}`,
        }),
      });

      console.log('📊 Respuesta registro Auth0 status:', signupRes.status);

      // Leer como texto primero
      const responseText = await signupRes.text();
      console.log('📄 Respuesta Auth0 cruda:', responseText);

      if (!signupRes.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Error parseando respuesta de Auth0:', parseError);
          throw new Error('Error de conexión con Auth0. Verifica tu conexión a internet.');
        }

        console.error('❌ Error en registro Auth0:', errorData);
        
        if (
          errorData.code === 'invalid_signup' &&
          errorData.description === 'Invalid sign up'
        ) {
          if (data.role === 'manager') {
            throw new Error(
              'Este correo ya está registrado. Iniciá sesión para registrar tu cafetería.'
            );
          } else {
            throw new Error('Este correo ya está registrado. Iniciá sesión.');
          }
        } else {
          throw new Error(errorData.description || 'Ocurrió un error al registrarte.');
        }
      }

      console.log('✅ Registro exitoso en Auth0');

      // 2. En lugar de solo retornar, actualizar el estado para mostrar verificación
      dispatch({ 
        type: 'SET_NEEDS_VERIFICATION', 
        payload: { 
          userData: {
            email: data.email,
            password: data.password,
            nombre: data.nombre,
            apellido: data.apellido,
            role: data.role,
          }
        }
      });

      return { needsVerification: true, role: data.role };

    } catch (error) {
      console.error('🚨 Error completo en registro:', error);
      dispatch({ type: 'STOP_LOADING' });
      throw error;
    }
  };

  const verifyAndSync = async (data: VerifyData) => {
    try {
      dispatch({ type: 'LOADING' });

      console.log('🔄 Iniciando verificación y sincronización para:', data.email, 'como', data.role);

      // 1. Login DIRECTO a Auth0 - Intentar primero sin client_secret, luego con backend credentials
      let loginRes;

      try {
        // Intentar con aplicación nativa (sin client_secret)
        console.log('🔄 Intentando login con aplicación nativa...');
        loginRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'password',
            username: data.email,
            password: data.password,
            audience: AUTH0_AUDIENCE,
            client_id: AUTH0_CLIENT_ID,
            connection: 'Username-Password-Authentication',
          }),
        });

        console.log('📊 Status login nativo:', loginRes.status);

        if (!loginRes.ok) {
          console.log('⚠️ Login nativo falló, intentando con credenciales de backend...');
          
          // Fallback: usar credenciales del backend
          loginRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grant_type: 'password',
              username: data.email,
              password: data.password,
              audience: AUTH0_AUDIENCE,
              client_id: AUTH0_BACKEND_CLIENT_ID,
              client_secret: AUTH0_BACKEND_CLIENT_SECRET,
              connection: 'Username-Password-Authentication',
            }),
          });

          console.log('📊 Status login backend:', loginRes.status);
        }

      } catch (error) {
        console.error('❌ Error en petición a Auth0:', error);
        throw new Error('Error de conexión con Auth0');
      }

      console.log('📊 Status login Auth0 directo:', loginRes.status);

      const loginResponseText = await loginRes.text();
      console.log('📄 Respuesta login Auth0:', loginResponseText);

      let loginData;
      try {
        loginData = JSON.parse(loginResponseText);
      } catch (parseError) {
        console.error('❌ Error parseando respuesta de Auth0:', parseError);
        throw new Error('Error al iniciar sesión después de la verificación. Asegúrate de haber verificado tu email.');
      }

      if (!loginRes.ok) {
        console.error('❌ Error en login Auth0:', loginData);
        throw new Error(loginData.error_description || 'Error al iniciar sesión. Asegúrate de haber verificado tu email.');
      }

      const token = loginData.access_token;
      console.log('✅ Token obtenido de Auth0');

      // 2. Sync con backend según rol (igual que en DelateWeb)
      const syncEndpoint = data.role === 'manager' 
        ? `${API_URL}/sync-manager`
        : `${API_URL}/sync-client`;

      console.log('🔗 Llamando a endpoint de sincronización:', syncEndpoint);

      const syncRes = await fetch(syncEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          firstName: data.nombre,
          lastName: data.apellido,
          profilePicture: '',
        }),
      });

      console.log('📊 Status sincronización:', syncRes.status);

      const syncResponseText = await syncRes.text();
      console.log('📄 Respuesta sync:', syncResponseText);

      if (!syncRes.ok) {
        let error;
        try {
          error = JSON.parse(syncResponseText);
        } catch (parseError) {
          console.error('❌ Error parseando respuesta de sync:', parseError);
          throw new Error('Error al sincronizar usuario con el servidor');
        }
        console.error('❌ Error en sincronización:', error);
        throw new Error(error.error || error.message || 'Error al sincronizar usuario');
      }

      console.log('✅ Sincronización exitosa');

      // 3. Obtener datos del usuario después de sync
      const userRes = await fetch(`${API_URL}/users/role`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📊 Status obtener usuario:', userRes.status);

      const userResponseText = await userRes.text();
      console.log('📄 Respuesta usuario:', userResponseText);

      let userData;
      try {
        userData = JSON.parse(userResponseText);
      } catch (parseError) {
        console.error('❌ Error parseando respuesta de usuario:', parseError);
        throw new Error('Error al obtener datos del usuario');
      }

      if (!userRes.ok) {
        console.error('❌ Error obteniendo usuario después de sync:', userData);
        throw new Error(userData.error || 'Error al obtener datos del usuario');
      }

      console.log('👤 Usuario obtenido después de sync:', userData);

      // 4. Guardar en AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // 5. Actualizar estado
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, token } });

      console.log('🎉 Flujo de verificación y sincronización completado exitosamente');

    } catch (error) {
      console.error('🚨 Error completo en verificación y sincronización:', error);
      dispatch({ type: 'STOP_LOADING' });
      throw error;
    }
  };

  const checkIfManagerHasCafe = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return false;

      const cafeRes = await fetch(`${API_URL}/managers/me/cafe`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (cafeRes.status === 404) {
        return false; // No tiene café
      } else if (cafeRes.ok) {
        return true; // Tiene café
      } else {
        throw new Error('Error al verificar el café');
      }
    } catch (error) {
      console.error('Error checking cafe:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider 
      value={{ 
        state, 
        login, 
        register, 
        verifyAndSync, 
        logout, 
        updateUser, 
        checkIfManagerHasCafe 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};