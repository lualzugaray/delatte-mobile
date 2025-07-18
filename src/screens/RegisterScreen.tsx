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
    Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const [stage, setStage] = useState<'form' | 'verify'>('form');
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

    const handleSubmit = async () => {
        setError(null);
        console.log('=== REGISTER DEBUG ===');
        console.log('AUTH0_CLIENT_ID:', process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID);
        console.log('AUTH0_BACKEND_CLIENT_ID:', process.env.EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_ID);
        console.log('AUTH0_AUDIENCE:', process.env.EXPO_PUBLIC_AUTH0_AUDIENCE);
        console.log('API_URL:', process.env.EXPO_PUBLIC_API_URL);
        console.log('=====================');

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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Ingresá un email válido');
            return;
        }

        setLoading(true);
        try {
            const signupRes = await fetch(
                `https://dev-d82ap42lb6n7381y.us.auth0.com/dbconnections/signup`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
                        email: formData.email,
                        password: formData.password,
                        connection: 'Username-Password-Authentication',
                        name: `${formData.nombre} ${formData.apellido}`,
                    }),
                }
            );
            console.log(signupRes)

            if (!signupRes.ok) {
                const errorData = await signupRes.json();
                if (errorData.code === 'invalid_signup') {
                    setError(
                        activeTab === 'manager'
                            ? 'Este correo ya está registrado. Iniciá sesión para registrar tu cafetería.'
                            : 'Este correo ya está registrado. Iniciá sesión.'
                    );
                } else {
                    setError(errorData.description || 'Ocurrió un error al registrarte.');
                }
                return;
            }

            setStage('verify');
        } catch {
            setError('Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndSync = async () => {
        setError(null);
        setLoading(true);

        try {
            const loginRes = await fetch(
                `https://dev-d82ap42lb6n7381y.us.auth0.com/oauth/token`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grant_type: 'password',
                        username: formData.email,
                        password: formData.password,
                        audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
                        client_id: process.env.EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_ID,
                        connection: 'Username-Password-Authentication',
                        client_secret: process.env.EXPO_PUBLIC_AUTH0_BACKEND_CLIENT_SECRET,
                    }),
                }
            );
            const loginData = await loginRes.json();
            if (!loginRes.ok) {
                throw new Error(
                    loginData.error_description ||
                    'Error al iniciar sesión. Asegúrate de haber verificado tu email.'
                );
            }
            const token = loginData.access_token;

            await AsyncStorage.setItem('token', token);

            const syncEndpoint =
                activeTab === 'manager'
                    ? `${process.env.EXPO_PUBLIC_API_URL}/sync-manager`
                    : `${process.env.EXPO_PUBLIC_API_URL}/sync-client`;
            const syncRes = await fetch(syncEndpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    firstName: formData.nombre,
                    lastName: formData.apellido,
                    profilePicture: '',
                }),
            });
            if (!syncRes.ok) {
                const e = await syncRes.json();
                throw new Error(e.message || 'Error al sincronizar usuario');
            }

            if (activeTab === 'manager') {
                Alert.alert('¡Cuenta creada!', 'Ahora registremos tu cafetería.', [
                    {
                        text: 'Continuar',
                        onPress: () => navigation.navigate('RegisterCafe'),
                    },
                ]);
            } else {
                Alert.alert(
                    'Registro exitoso',
                    'Tu cuenta fue creada correctamente. Ahora podés iniciar sesión.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
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
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>¡unite a delatte!</Text>

                    <View style={styles.tabContainer}>
                        {(['client', 'manager'] as const).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => {
                                    setActiveTab(tab);
                                    setStage('form');
                                    setError(null);
                                }}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab === 'client' ? 'cliente' : 'manager'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.subtitle}>registrate para continuar</Text>

                    {activeTab === 'manager' && stage === 'form' && (
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                <Text style={styles.infoTextBold}>¿Sos el encargado de una cafetería?</Text>
                                {'\n'}Para poder registrar tu café en Delatte, primero necesitamos que crees tu cuenta
                                como <Text style={styles.infoTextBold}>usuario manager</Text>.
                            </Text>
                        </View>
                    )}

                    {error && <Text style={styles.error}>{error}</Text>}

                    {stage === 'form' ? (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="correo electrónico"
                                placeholderTextColor="#7a7a7a"
                                value={formData.email}
                                onChangeText={(t) => updateFormData('email', t)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="nombre"
                                placeholderTextColor="#7a7a7a"
                                value={formData.nombre}
                                onChangeText={(t) => updateFormData('nombre', t)}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="apellido"
                                placeholderTextColor="#7a7a7a"
                                value={formData.apellido}
                                onChangeText={(t) => updateFormData('apellido', t)}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="contraseña"
                                placeholderTextColor="#7a7a7a"
                                secureTextEntry
                                value={formData.password}
                                onChangeText={(t) => updateFormData('password', t)}
                                autoCapitalize="none"
                            />

                            {formData.password.length > 0 && (
                                <View style={styles.passwordValidation}>
                                    <Text style={styles.validationTitle}>Tu contraseña debe tener:</Text>
                                    {Object.entries(passwordValidation).map(([rule, ok]) => (
                                        <Text
                                            key={rule}
                                            style={[
                                                styles.validationText,
                                                ok ? styles.validationSuccess : styles.validationError,
                                            ]}
                                        >
                                            {ok ? '✓' : '✗'}{' '}
                                            {{
                                                length: 'Al menos 8 caracteres',
                                                uppercase: 'Una mayúscula',
                                                lowercase: 'Una minúscula',
                                                number: 'Un número',
                                                symbol: 'Un símbolo (@$!%*?&)',
                                            }[rule as keyof typeof passwordValidation]}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder="confirmar contraseña"
                                placeholderTextColor="#7a7a7a"
                                secureTextEntry
                                value={formData.confirmPassword}
                                onChangeText={(t) => updateFormData('confirmPassword', t)}
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
                    ) : (
                        <View style={styles.verifyBox}>
                            <Text style={styles.successText}>
                                🎉 Te registraste como{' '}
                                {activeTab === 'client' ? 'cliente' : 'manager'}.{'\n'}Verificá tu email para
                                continuar.
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
    logoContainer: { alignItems: 'center', marginBottom: 48 },
    logoPlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 200,
        marginLeft: 8,
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