// src/screens/LoginScreen.tsx (ACTUALIZADO para usar el endpoint correcto)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '../hooks/useNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Login (IGUAL que DelateWeb)
      const tokenRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth0-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error || "Error al iniciar sesión");
      }

      const token = tokenData.access_token;
      await AsyncStorage.setItem("token", token);

      // 2. Obtener rol (IGUAL que DelateWeb)
      const userRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/role`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      if (!userRes.ok) {
        throw new Error(userData.error || "Error al obtener rol del usuario");
      }

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      const role = userData.role;

      // 3. Lógica para manager (IGUAL que DelateWeb)
      if (role === "manager") {
        if (!userData.emailVerified) {
          Alert.alert('Email no verificado', 'Por favor verifica tu email antes de continuar.');
          return;
        }

        // 4. Verificar si ya tiene café registrado (IGUAL que DelateWeb)
        const cafeRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/managers/me/cafe`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cafeRes.status === 404) {
          Alert.alert('Próximamente', 'Registro de cafetería. Por ahora quédate en login.', [
            { text: 'OK' }
          ]);
          // navigation.navigate("/register-cafe"); // Cuando esté implementado
        } else if (cafeRes.ok) {
          Alert.alert('Dashboard', 'Ir a dashboard de manager. Por ahora quédate en login.', [
            { text: 'OK' }
          ]);
          // navigation.navigate("/dashboard"); // Cuando esté implementado
        } else {
          const cafeData = await cafeRes.json();
          throw new Error(cafeData.error || "Error al verificar el café");
        }

        return;
      }

      // Cliente: ir al dashboard/explorar
      Alert.alert('Login exitoso', 'Cliente autenticado. Implementar navegación a home.', [
        { text: 'OK' }
      ]);
      // navigation.navigate("/dashboard"); // Cuando esté implementado

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>DELATTE</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>¡hola!</Text>
          <Text style={styles.subtitle}>iniciá sesión para continuar</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="correo electrónico"
            placeholderTextColor="#7a7a7a"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="contraseña"
            placeholderTextColor="#7a7a7a"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              ¿no tenes una cuenta?{' '}
              <Text style={styles.linkHighlight}>registrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Delatte — hecho con ☕</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoPlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: '#301b0f',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#301b0f',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7a7a7a',
    textAlign: 'center',
    marginBottom: 32,
  },
  error: {
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: '#301b0f',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 14,
    color: '#7a7a7a',
    textAlign: 'center',
  },
  linkHighlight: {
    color: '#301b0f',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#aaa',
  },
});

export default LoginScreen;