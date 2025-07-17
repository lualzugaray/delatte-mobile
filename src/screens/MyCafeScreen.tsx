import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL;
const CLOUDINARY_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_CLOUDINARY_URL;
const CLOUDINARY_UPLOAD_PRESET = Constants.expoConfig!.extra!.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const { width } = Dimensions.get('window');

interface Schedule {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
}

interface Category {
    id: string;
    name: string;
}

interface Review {
    _id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

interface Cafe {
    _id: string;
    name: string;
    address: string;
    description: string;
    coverImage: string;
    gallery: string[];
    schedule: Schedule[];
    categories: string[];
}

export default function MyCafeScreen() {
    const [cafe, setCafe] = useState<Cafe | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [coverPreview, setCoverPreview] = useState('');
    const [coverUploading, setCoverUploading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reportingReview, setReportingReview] = useState<Review | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    const navigation = useNavigation();

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    useEffect(() => {
        if (cafe?._id) fetchReviews();
    }, [cafe]);

    const checkAuthAndFetch = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userStr = await AsyncStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};

            if (!token || user.role !== 'manager') {
                navigation.navigate('Login' as never);
                return;
            }

            await Promise.all([fetchCafe(), fetchCategories()]);
        } catch (error) {
            navigation.navigate('Login' as never);
        } finally {
            setLoading(false);
        }
    };

    const fetchCafe = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/managers/me/cafe`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const scheduleArray = Object.entries(data.schedule || {}).map(
                ([day, { open, close, isClosed }]: [string, any]) => ({ day, open, close, isClosed })
            );

            const initialCats = Array.isArray(data.categories) ? data.categories : [];
            setCafe(data);
            setFormData({
                schedule: scheduleArray,
                categories: initialCats,
                name: data.name,
                address: data.address,
                description: data.description,
                coverImage: data.coverImage,
                gallery: data.gallery || [],
            });
            setCoverPreview(data.coverImage || '');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error al cargar la cafetería',
            });
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get(
                `${API_URL}/categories?type=structural&isActive=true`
            );
            setCategories(data);
        } catch (error) {
        }
    };

    const fetchReviews = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/managers/me/reviews`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReviews(data);
        } catch (error) {
        }
    };

    const handleEdit = () => setIsEditing(true);

    const handleChange = (name: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const uploadToCloudinary = async (uri: string): Promise<string> => {
        const formData = new FormData();
        formData.append('file', {
            uri,
            type: 'image/jpeg',
            name: 'image.jpg',
        } as any);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await axios.post(CLOUDINARY_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.secure_url;
    };

    const handleCoverImagePicker = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setCoverUploading(true);
            try {
                const url = await uploadToCloudinary(result.assets[0].uri);
                setCoverPreview(url);
                setFormData((prev: any) => ({ ...prev, coverImage: url }));
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Error al subir la portada',
                });
            } finally {
                setCoverUploading(false);
            }
        }
    };

    const handleGalleryImagePicker = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setGalleryUploading(true);
            try {
                const url = await uploadToCloudinary(result.assets[0].uri);
                setFormData((prev: any) => ({
                    ...prev,
                    gallery: [...(prev.gallery || []), url],
                }));
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Error al subir imagen',
                });
            } finally {
                setGalleryUploading(false);
            }
        }
    };

    const handleGalleryRemove = (img: string) => {
        setFormData((prev: any) => ({
            ...prev,
            gallery: prev.gallery.filter((i: string) => i !== img),
        }));
    };

    const toggleCategory = (id: string) => {
        setFormData((prev: any) => ({
            ...prev,
            categories: prev.categories.includes(id)
                ? prev.categories.filter((c: string) => c !== id)
                : [...prev.categories, id],
        }));
    };

    const handleScheduleChange = (index: number, field: string, value: string) => {
        setFormData((prev: any) => {
            const schedule = [...prev.schedule];
            schedule[index] = { ...schedule[index], [field]: value };
            return { ...prev, schedule };
        });
    };

    const handleSave = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            const scheduleObj = (formData.schedule || []).reduce((acc: any, { day, open, close, isClosed }: Schedule) => {
                acc[day] = { open, close, isClosed: !!(open || close) };
                return acc;
            }, {});

            const payload = {
                name: formData.name,
                address: formData.address,
                description: formData.description,
                coverImage: coverPreview,
                gallery: formData.gallery,
                schedule: scheduleObj,
                categories: formData.categories,
            };

            const { data } = await axios.put(
                `${API_URL}/managers/me/cafe`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const scheduleArray = Object.entries(data.cafe.schedule || {}).map(
                ([day, { open, close, isClosed }]: [string, any]) => ({ day, open, close, isClosed })
            );

            const savedCats = Array.isArray(data.cafe.categories) ? data.cafe.categories : [];
            setCafe(data.cafe);
            setFormData((prev: any) => ({
                ...prev,
                schedule: scheduleArray,
                categories: savedCats,
            }));
            setIsEditing(false);
            Toast.show({
                type: 'success',
                text1: 'Cafetería actualizada correctamente ✅',
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error al guardar los cambios ❌',
            });
        }
    };

    const openReport = (review: Review) => {
        setReportingReview(review);
        setReportReason('');
    };

    const submitReport = async () => {
        if (!reportReason.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Ingresa un motivo',
            });
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                `${API_URL}/managers/me/reviews/${reportingReview?._id}/report`,
                { reason: reportReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Toast.show({
                type: 'success',
                text1: 'Denuncia enviada',
            });
            setReportingReview(null);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error al enviar denuncia',
            });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B4513" />
            </View>
        );
    }

    if (!cafe) return null;

    const scheduleArray = Array.isArray(formData.schedule) ? formData.schedule : [];
    const savedSchedule = Array.isArray(cafe.schedule) ? cafe.schedule : [];
    const displaySchedule = scheduleArray.length > 0 ? scheduleArray : savedSchedule;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                {isEditing ? (
                    <TextInput
                        style={styles.titleInput}
                        value={formData.name}
                        onChangeText={(text) => handleChange('name', text)}
                        placeholder="Nombre de la cafetería"
                    />
                ) : (
                    <Text style={styles.title}>{cafe.name}</Text>
                )}
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={isEditing ? handleSave : handleEdit}
                >
                    <Text style={styles.editButtonText}>
                        {isEditing ? 'Guardar' : 'Editar'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dirección</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={formData.address || ''}
                        onChangeText={(text) => handleChange('address', text)}
                        placeholder="Dirección"
                    />
                ) : (
                    <Text style={styles.sectionText}>{cafe.address}</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Descripción</Text>
                {isEditing ? (
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.description || ''}
                        onChangeText={(text) => handleChange('description', text)}
                        placeholder="Descripción"
                        multiline
                        numberOfLines={4}
                    />
                ) : (
                    <Text style={styles.sectionText}>{cafe.description}</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Portada</Text>
                {isEditing ? (
                    <View style={styles.coverEdit}>
                        {coverPreview ? (
                            <Image source={{ uri: coverPreview }} style={styles.coverImage} />
                        ) : null}
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={handleCoverImagePicker}
                            disabled={coverUploading}
                        >
                            {coverUploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.uploadButtonText}>
                                    {coverPreview ? 'Cambiar Portada' : 'Subir Portada'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Image source={{ uri: cafe.coverImage }} style={styles.coverImage} />
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Galería</Text>
                {isEditing && (
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handleGalleryImagePicker}
                        disabled={galleryUploading}
                    >
                        {galleryUploading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.uploadButtonText}>Agregar Imagen</Text>
                        )}
                    </TouchableOpacity>
                )}
                <View style={styles.gallery}>
                    {(formData.gallery || []).map((img: string, idx: number) => (
                        <View key={idx} style={styles.galleryItem}>
                            <Image source={{ uri: img }} style={styles.galleryImage} />
                            {isEditing && (
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleGalleryRemove(img)}
                                >
                                    <Text style={styles.removeButtonText}>❌</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categorías</Text>
                {isEditing ? (
                    <View style={styles.categoriesContainer}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryButton,
                                    formData.categories.includes(cat.id) && styles.categoryButtonSelected,
                                ]}
                                onPress={() => toggleCategory(cat.id)}
                            >
                                <Text
                                    style={[
                                        styles.categoryButtonText,
                                        formData.categories.includes(cat.id) && styles.categoryButtonTextSelected,
                                    ]}
                                >
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.categoriesContainer}>
                        {formData.categories.map((id: string) => {
                            const cat = categories.find((c) => c.id === id);
                            return (
                                <View key={id} style={styles.categoryTag}>
                                    <Text style={styles.categoryTagText}>{cat?.name || id}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Horarios</Text>
                {isEditing ? (
                    <View style={styles.scheduleContainer}>
                        {displaySchedule.map((schedule: Schedule, index: number) => (
                            <View key={schedule.day} style={styles.scheduleRow}>
                                <Text style={styles.dayLabel}>
                                    {schedule.day.charAt(0).toUpperCase() + schedule.day.slice(1)}
                                </Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={schedule.open}
                                    onChangeText={(text) => handleScheduleChange(index, 'open', text)}
                                    placeholder="08:00"
                                />
                                <Text style={styles.timeSeparator}>-</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={schedule.close}
                                    onChangeText={(text) => handleScheduleChange(index, 'close', text)}
                                    placeholder="22:00"
                                />
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.scheduleDisplay}>
                        {displaySchedule.map((schedule: Schedule) => (
                            <View key={schedule.day} style={styles.scheduleDisplayRow}>
                                <Text style={styles.scheduleDisplayText}>
                                    {schedule.day.charAt(0).toUpperCase() + schedule.day.slice(1)}:{' '}
                                    {schedule.open || '–'} – {schedule.close || '–'}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reseñas</Text>
                {reviews.length === 0 ? (
                    <Text style={styles.noReviewsText}>No hay reseñas aún.</Text>
                ) : (
                    reviews.map((review) => (
                        <View key={review._id} style={styles.reviewItem}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewUser}>
                                    {review.userName || 'Usuario'}
                                </Text>
                                <Text style={styles.reviewDate}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
                            <Text style={styles.reviewComment}>{review.comment}</Text>
                            <TouchableOpacity
                                style={styles.reportButton}
                                onPress={() => openReport(review)}
                            >
                                <Text style={styles.reportButtonText}>Denunciar</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>

            <Modal
                visible={!!reportingReview}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReportingReview(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Denunciar reseña de {reportingReview?.userName || 'Usuario'}
                        </Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={reportReason}
                            onChangeText={setReportReason}
                            placeholder="Motivo de la denuncia"
                            multiline
                            numberOfLines={4}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.primaryButton]}
                                onPress={submitReport}
                            >
                                <Text style={styles.buttonText}>Enviar denuncia</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={() => setReportingReview(null)}
                            >
                                <Text style={styles.secondaryButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 100,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 5,
    },
    editButton: {
        backgroundColor: '#8B4513',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: '#fff',
        marginVertical: 5,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    sectionText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    coverEdit: {
        alignItems: 'center',
    },
    coverImage: {
        width: width - 40,
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
    },
    uploadButton: {
        backgroundColor: '#8B4513',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
    },
    uploadButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    gallery: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    galleryItem: {
        position: 'relative',
        width: (width - 60) / 3,
        height: (width - 60) / 3,
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        fontSize: 12,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#8B4513',
        backgroundColor: '#fff',
    },
    categoryButtonSelected: {
        backgroundColor: '#8B4513',
    },
    categoryButtonText: {
        color: '#8B4513',
        fontSize: 14,
    },
    categoryButtonTextSelected: {
        color: '#fff',
    },
    categoryTag: {
        backgroundColor: '#8B4513',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    categoryTagText: {
        color: '#fff',
        fontSize: 12,
    },
    scheduleContainer: {
        gap: 10,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dayLabel: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    timeInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 8,
        textAlign: 'center',
    },
    timeSeparator: {
        fontSize: 16,
        color: '#666',
    },
    scheduleDisplay: {
        gap: 5,
    },
    scheduleDisplayRow: {
        paddingVertical: 5,
    },
    scheduleDisplayText: {
        fontSize: 16,
        color: '#666',
    },
    noReviewsText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
    reviewItem: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#8B4513',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    reviewUser: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    reviewDate: {
        fontSize: 14,
        color: '#666',
    },
    reviewRating: {
        fontSize: 16,
        marginBottom: 5,
    },
    reviewComment: {
        fontSize: 15,
        color: '#666',
        marginBottom: 10,
        lineHeight: 20,
    },
    reportButton: {
        backgroundColor: '#dc3545',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: width - 40,
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#8B4513',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
});