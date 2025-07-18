import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    StyleSheet, Image, ActivityIndicator, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import FavoriteCafeCard from '../components/FavoriteCafeCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL;
const CLOUDINARY_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_CLOUDINARY_URL;
const CLOUDINARY_UPLOAD_PRESET = Constants.expoConfig!.extra!.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function ProfileScreen() {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profileImage, setProfileImage] = useState('');
    const [favorites, setFavorites] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>({
        firstName: '',
        lastName: '',
        bio: '',
        socialLinks: {
            instagram: '',
            twitter: '',
            facebook: '',
            tiktok: '',
        },
    });

    useEffect(() => {
        fetchClientData();
    }, []);

    const fetchClientData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/clients/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setFormData({
                firstName: res.data.firstName || '',
                lastName: res.data.lastName || '',
                bio: res.data.bio || '',
                socialLinks: {
                    instagram: res.data.socialLinks?.instagram || '',
                    twitter: res.data.socialLinks?.twitter || '',
                    facebook: res.data.socialLinks?.facebook || '',
                    tiktok: res.data.socialLinks?.tiktok || '',
                }
            });
            setFavorites(res.data.favorites || []);
            setProfileImage(res.data.profileImage || '');
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error al cargar perfil' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSocialChange = (key: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [key]: value
            }
        }));
    };

    const handleFavoriteToggle = async (cafeId: string) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${API_URL}/clients/me/favorites/${cafeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Toast.show({ type: 'success', text1: 'Café eliminado de favoritos' });
            const res = await axios.get(`${API_URL}/clients/me/favorites`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFavorites(res.data);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'No se pudo eliminar el favorito' });
        }
    };

    const uploadToCloudinary = async (uri: string): Promise<string> => {
        const data = new FormData();
        data.append('file', {
            uri,
            type: 'image/jpeg',
            name: 'profile.jpg'
        } as any);
        data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await axios.post(CLOUDINARY_URL, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.secure_url;
    };

    const normalizeUrl = (url: string) =>
        url && !/^https?:\/\//i.test(url) ? `https://${url}` : url;

    const handleSave = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            const normalizedSocialLinks = Object.fromEntries(
                Object.entries(formData.socialLinks || {}).map(([key, value]) => [
                  key,
                  normalizeUrl(typeof value === 'string' ? value : '')
                ])
              );              

            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                bio: formData.bio,
                profileImage,
                socialLinks: normalizedSocialLinks,
            };

            const { data } = await axios.put(`${API_URL}/clients/me`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsEditing(false);
            Toast.show({ type: 'success', text1: 'Perfil actualizado ✅' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error al guardar cambios ❌' });
        }
    };


    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#8B4513" /></View>;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Mi Perfil</Text>
                    <TouchableOpacity style={styles.editButton} onPress={isEditing ? handleSave : () => setIsEditing(true)}>
                        <Text style={styles.editButtonText}>{isEditing ? 'Guardar' : 'Editar'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={styles.input}
                        editable={isEditing}
                        value={formData.firstName}
                        onChangeText={(text) => handleChange('firstName', text)}
                    />

                    <Text style={styles.label}>Apellido</Text>
                    <TextInput
                        style={styles.input}
                        editable={isEditing}
                        value={formData.lastName}
                        onChangeText={(text) => handleChange('lastName', text)}
                    />

                    <Text style={styles.label}>Biografía</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        editable={isEditing}
                        multiline
                        value={formData.bio}
                        onChangeText={(text) => handleChange('bio', text)}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Redes sociales</Text>
                    {Object.entries(formData.socialLinks || {}).map(([platform, value]) => (
                        <TextInput
                            key={platform}
                            style={styles.input}
                            editable={isEditing}
                            placeholder={platform}
                            value={typeof value === 'string' ? value : ''}
                            onChangeText={(text) => handleSocialChange(platform, text)}
                        />
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.title}>Favoritos</Text>
                    {favorites.length === 0 ? (
                        <Text style={{ color: '#999' }}>No tenés cafeterías favoritas aún.</Text>
                    ) : (
                        favorites.map((cafe) => (
                            <FavoriteCafeCard
                                key={cafe._id}
                                cafe={cafe}
                                onToggleFavorite={() => handleFavoriteToggle(cafe._id)}
                            />

                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    editButton: { backgroundColor: '#8B4513', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
    editButtonText: { color: '#fff', fontWeight: 'bold' },
    section: { paddingHorizontal: 20, paddingVertical: 10 },
    label: { fontSize: 16, color: '#555', marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
    textArea: { height: 100, textAlignVertical: 'top' },
    profileImage: { width: width * 0.4, height: width * 0.4, borderRadius: width * 0.2, alignSelf: 'center', marginBottom: 10 },
    imageLabel: { textAlign: 'center', color: '#8B4513', fontWeight: 'bold' },
});