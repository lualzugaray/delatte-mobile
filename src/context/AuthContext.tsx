import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_AUTH0_DOMAIN, EXPO_PUBLIC_AUTH0_CLIENT_ID, EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_ID, EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_SECRET, EXPO_PUBLIC_AUTH0_AUDIENCE } = Constants.expoConfig!.extra!;
const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL;

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
  needsEmailVerification: boolean;
  pendingUserData: VerifyData | null;
}

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'STOP_LOADING' }
  | { type: 'SET_NEEDS_VERIFICATION'; payload: { userData: VerifyData } };

const initialState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  token: null,
  needsEmailVerification: false,
  pendingUserData: null,
};

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
  login: async () => { },
  register: async () => ({ needsVerification: false, role: 'client' }),
  verifyAndSync: async () => { },
  logout: async () => { },
  updateUser: () => { },
  checkIfManagerHasCafe: async () => false,
});

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

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID;
const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

const AUTH0_BACKEND_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_ID;
const AUTH0_BACKEND_CLIENT_SECRET = process.env.EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_SECRET;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  useEffect(() => {
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
      console.error(error);
      dispatch({ type: 'STOP_LOADING' });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'LOADING' });

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

      if (!loginRes.ok) {
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

      }

      const responseText = await loginRes.text();

      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Error al iniciar sesión. Verifica tus credenciales.');
      }

      if (!loginRes.ok) {
        throw new Error(tokenData.error_description || 'Error al iniciar sesión');
      }

      const token = tokenData.access_token;
      const userRes = await fetch(`${API_URL}/users/role`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userResponseText = await userRes.text();
      let userData;
      try {
        userData = JSON.parse(userResponseText);
      } catch (parseError) {
        console.error(parseError);
        throw new Error('Error al obtener datos del usuario');
      }

      if (!userRes.ok) {
        console.error(userData);
        throw new Error(userData.error || 'Error al obtener rol del usuario');
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, token } });

    } catch (error) {
      console.error(error);
      dispatch({ type: 'STOP_LOADING' });
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<{ needsVerification: boolean; role: string }> => {
    try {
      dispatch({ type: 'LOADING' });

      const auth0Url = `https://${AUTH0_DOMAIN}/dbconnections/signup`;

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

      const responseText = await signupRes.text();

      if (!signupRes.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error(parseError);
          throw new Error('Error de conexión con Auth0. Verifica tu conexión a internet.');
        }

        console.error(errorData);

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
      console.error(error);
      dispatch({ type: 'STOP_LOADING' });
      throw error;
    }
  };

  const verifyAndSync = async (data: VerifyData) => {
    try {
      dispatch({ type: 'LOADING' });
      let loginRes;

      try {
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


        if (!loginRes.ok) {

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

        }

      } catch (error) {
        throw new Error('Error de conexión con Auth0');
      }


      const loginResponseText = await loginRes.text();
      let loginData;
      try {
        loginData = JSON.parse(loginResponseText);
      } catch (parseError) {
        console.error(parseError);
        throw new Error('Error al iniciar sesión después de la verificación. Asegúrate de haber verificado tu email.');
      }

      if (!loginRes.ok) {
        console.error(loginData);
        throw new Error(loginData.error_description || 'Error al iniciar sesión. Asegúrate de haber verificado tu email.');
      }

      const token = loginData.access_token;

      const syncEndpoint = data.role === 'manager'
        ? `${API_URL}/sync-manager`
        : `${API_URL}/sync-client`;


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

      const syncResponseText = await syncRes.text();
      if (!syncRes.ok) {
        let error;
        try {
          error = JSON.parse(syncResponseText);
        } catch (parseError) {
          throw new Error('Error al sincronizar usuario con el servidor');
        }
        throw new Error(error.error || error.message || 'Error al sincronizar usuario');
      }
      const userRes = await fetch(`${API_URL}/users/role`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userResponseText = await userRes.text();

      let userData;
      try {
        userData = JSON.parse(userResponseText);
      } catch (parseError) {
        throw new Error('Error al obtener datos del usuario');
      }

      if (!userRes.ok) {
        throw new Error(userData.error || 'Error al obtener datos del usuario');
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, token } });


    } catch (error) {
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
        return false;
      } else if (cafeRes.ok) {
        return true;
      } else {
        throw new Error('Error al verificar el café');
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error(error);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};