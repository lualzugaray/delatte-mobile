import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL as string;

const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setError(null);
        if (!formData.email || !formData.password) {
            setError('Por favor completa todos los campos');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Por favor ingresa un email válido');
            return;
        }

        setLoading(true);
        try {
            const tokenRes = await fetch(`${API_URL}/auth0-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok) throw new Error(tokenData.error || 'Login fallido');

            const token = tokenData.access_token;
            await AsyncStorage.setItem('token', token);

            const userRes = await fetch(`${API_URL}/users/role`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = await userRes.json();
            if (!userRes.ok) throw new Error(userData.error || 'No se pudo leer rol');

            await AsyncStorage.setItem('user', JSON.stringify(userData));

            const role = userData.role;
            if (role === 'manager') {
                if (!userData.emailVerified) {
                    Alert.alert('Email no verificado', 'Por favor verifica tu email.');
                    return;
                }
                const cafeRes = await fetch(`${API_URL}/managers/me/cafe`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (cafeRes.status === 404) {
                    navigation.replace('RegisterCafe');
                } else if (cafeRes.ok) {
                    navigation.replace('AppTabs');
                } else {
                    const err = await cafeRes.json();
                    throw new Error(err.error || 'Error validando café');
                }
            } else {
                navigation.replace('AppTabs');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado');
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
                    <Text style={styles.title}>¡hola!</Text>
                    <Text style={styles.subtitle}>iniciá sesión para continuar</Text>
                    {error && <Text style={styles.error}>{error}</Text>}

                    <TextInput
                        style={styles.input}
                        placeholder="correo electrónico"
                        placeholderTextColor="#7a7a7a"
                        value={formData.email}
                        onChangeText={email => setFormData(f => ({ ...f, email }))}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="contraseña"
                        placeholderTextColor="#7a7a7a"
                        value={formData.password}
                        onChangeText={password => setFormData(f => ({ ...f, password }))}
                        secureTextEntry
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
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    logoContainer: { alignItems: 'center', marginBottom: 48 },
    logoPlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
    title: { fontSize: 28, fontWeight: '700', color: '#301b0f', textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#7a7a7a', textAlign: 'center', marginBottom: 32 },
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
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 16,
        elevation: 2,
    },
    submitButton: {
        backgroundColor: '#301b0f',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 24,
        elevation: 4,
    },
    logo: {
        width: 200,
        height: 200,
        marginLeft: 8,
    },
    disabledButton: { opacity: 0.6 },
    submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    linkText: { fontSize: 14, color: '#7a7a7a', textAlign: 'center' },
    linkHighlight: { color: '#301b0f', textDecorationLine: 'underline' },
    footer: { marginTop: 32, alignItems: 'center' },
    footerText: { fontSize: 12, color: '#aaa' },
});

export default LoginScreen;