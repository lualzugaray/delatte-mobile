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

const RegisterScreen = () => {
  const navigation = useNavigation();
  
  const [activeTab, setActiveTab] = useState<'client' | 'manager'>('client');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'form' | 'verify'>('form'); // IGUAL que DelateWeb
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (password: string) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[@$!%*?&]/.test(password),
  });

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  // IGUAL que DelateWeb: handleSubmit solo registra en Auth0
  const handleSubmit = async () => {
    setError(null);
    
    if (!formData.email || !formData.password || !formData.nombre || !formData.apellido) {
      setError('Por favor completá todos los campos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!isPasswordValid) {
      setError('La contraseña debe cumplir con todos los requisitos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Ingresá un email válido');
      return;
    }

    setLoading(true);

    try {
      // 1. Registrar en Auth0 (IGUAL que DelateWeb)
      const signupRes = await fetch(
        "https://dev-d82ap42lb6n7381y.us.auth0.com/dbconnections/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
            email: formData.email,
            password: formData.password,
            connection: "Username-Password-Authentication",
            name: `${formData.nombre} ${formData.apellido}`,
          }),
        }
      );

      if (!signupRes.ok) {
        const errorData = await signupRes.json();

        if (
          errorData.code === "invalid_signup" &&
          errorData.description === "Invalid sign up"
        ) {
          if (activeTab === "manager") {
            setError("Este correo ya está registrado. Iniciá sesión para registrar tu cafetería.");
          } else {
            setError("Este correo ya está registrado. Iniciá sesión.");
          }
        } else {
          setError(errorData.description || "Ocurrió un error al registrarte.");
        }
        return;
      }

      // 2. Mostrar pantalla de verificación (IGUAL que DelateWeb)
      setStage("verify");
    } catch (err) {
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // IGUAL que DelateWeb: handleVerifyAndSync sincroniza y redirige
  const handleVerifyAndSync = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Login para obtener el token (IGUAL que DelateWeb - usando Delatte Web credentials)
      const loginRes = await fetch("https://dev-d82ap42lb6n7381y.us.auth0.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "password",
          username: formData.email,
          password: formData.password,
          audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
          client_id: process.env.EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_ID, // Usar Backend como DelateWeb
          client_secret: process.env.EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_SECRET, // Usar Backend
        }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.error_description || "Error al iniciar sesión");
      }

      const token = loginData.access_token;

      // 2. Sync con backend según rol (IGUAL que DelateWeb - con /api prefix)
      const syncEndpoint = activeTab === "manager"
        ? `${process.env.EXPO_PUBLIC_API_URL}/sync-manager`
        : `${process.env.EXPO_PUBLIC_API_URL}/sync-client`;

      const syncRes = await fetch(syncEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.nombre,
          lastName: formData.apellido,
          profilePicture: "",
        }),
      });

      if (!syncRes.ok) {
        const error = await syncRes.json();
        throw new Error(error.message || "Error al sincronizar usuario");
      }

      // 3. Redirección (IGUAL que DelateWeb)
      if (activeTab === "manager") {
        // Para managers: ir a registro de café (cuando lo implementes)
        Alert.alert('Registro exitoso', 'Usuario manager creado. Implementar navegación a registro de café.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        // Para clientes: ir al login con mensaje de éxito
        Alert.alert('Registro exitoso', 'Tu cuenta fue creada correctamente. Ahora podés iniciar sesión.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>DELATTE</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>¡unite a delatte!</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'client' && styles.activeTab]}
              onPress={() => { setActiveTab('client'); setStage('form'); setError(null); }}
            >
              <Text style={[styles.tabText, activeTab === 'client' && styles.activeTabText]}>cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manager' && styles.activeTab]}
              onPress={() => { setActiveTab('manager'); setStage('form'); setError(null); }}
            >
              <Text style={[styles.tabText, activeTab === 'manager' && styles.activeTabText]}>manager</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>registrate para continuar</Text>

          {/* Info box para managers */}
          {activeTab === 'manager' && stage === 'form' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoTextBold}>¿Sos el encargado de una cafetería?</Text>
                {'\n'}
                Para poder registrar tu café en Delatte, primero necesitamos que crees tu cuenta como{' '}
                <Text style={styles.infoTextBold}>usuario manager</Text>.
              </Text>
              <Text style={styles.infoText}>
                Una vez que completes este formulario, te llevaremos automáticamente al registro de tu cafetería. 😊
              </Text>
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          {/* FORMULARIO (stage === 'form') */}
          {stage === 'form' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="correo electrónico"
                placeholderTextColor="#7a7a7a"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="nombre"
                placeholderTextColor="#7a7a7a"
                value={formData.nombre}
                onChangeText={(text) => updateFormData('nombre', text)}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="apellido"
                placeholderTextColor="#7a7a7a"
                value={formData.apellido}
                onChangeText={(text) => updateFormData('apellido', text)}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="contraseña"
                placeholderTextColor="#7a7a7a"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
                autoCapitalize="none"
              />

              {/* Indicador de validación de contraseña */}
              {formData.password.length > 0 && (
                <View style={styles.passwordValidation}>
                  <Text style={styles.validationTitle}>Tu contraseña debe tener:</Text>
                  <View style={styles.validationItem}>
                    <Text style={[styles.validationText, passwordValidation.length ? styles.validationSuccess : styles.validationError]}>
                      {passwordValidation.length ? '✓' : '✗'} Al menos 8 caracteres
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Text style={[styles.validationText, passwordValidation.uppercase ? styles.validationSuccess : styles.validationError]}>
                      {passwordValidation.uppercase ? '✓' : '✗'} Una mayúscula
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Text style={[styles.validationText, passwordValidation.lowercase ? styles.validationSuccess : styles.validationError]}>
                      {passwordValidation.lowercase ? '✓' : '✗'} Una minúscula
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Text style={[styles.validationText, passwordValidation.number ? styles.validationSuccess : styles.validationError]}>
                      {passwordValidation.number ? '✓' : '✗'} Un número
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Text style={[styles.validationText, passwordValidation.symbol ? styles.validationSuccess : styles.validationError]}>
                      {passwordValidation.symbol ? '✓' : '✗'} Un símbolo (@$!%*?&)
                    </Text>
                  </View>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="confirmar contraseña"
                placeholderTextColor="#7a7a7a"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {activeTab === 'manager' ? 'crear cuenta de manager' : 'crear cuenta'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* PANTALLA DE VERIFICACIÓN (stage === 'verify') - IGUAL que DelateWeb */}
          {stage === 'verify' && (
            <View style={styles.verifyBox}>
              <Text style={styles.successText}>
                🎉 Te registraste como {activeTab === 'client' ? 'cliente' : 'manager'}.{'\n'}
                Verificá tu email para continuar.
              </Text>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleVerifyAndSync}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>ya verifiqué mi email</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              ¿ya tenés cuenta? <Text style={styles.linkHighlight}>iniciá sesión aquí</Text>
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
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#301b0f',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
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
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 25,
  },
  activeTab: {
    backgroundColor: '#AC7851',
  },
  tabText: {
    fontSize: 16,
    color: '#7a7a7a',
    fontWeight: '300',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#7a7a7a',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#f7f4f2',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#301b0f',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  infoTextBold: {
    fontWeight: 'bold',
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
  passwordValidation: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  validationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  validationItem: {
    marginBottom: 4,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  validationSuccess: {
    color: '#28a745',
  },
  validationError: {
    color: '#dc3545',
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
  verifyBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
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

export default RegisterScreen;