import React, { useState, useEffect } from 'react';
import {
    View, Text, Modal, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Image, Alert, ActivityIndicator, Dimensions, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const { height: screenHeight } = Dimensions.get('window');

interface Category {
    id: string;
    _id: string;
    name: string;
}

interface ReviewFormModalProps {
    visible: boolean;
    cafeId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
    visible,
    cafeId,
    onClose,
    onSuccess
}) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [image, setImage] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [newCategories, setNewCategories] = useState<string[]>([]);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchCategories();
            resetForm();
        }
    }, [visible]);

    const resetForm = () => {
        setRating(5);
        setComment('');
        setImage('');
        setSelectedCategories([]);
        setNewCategories([]);
        setNewCategoryInput('');
        setShowAllCategories(false);
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/categories`, {
                params: { isActive: true }
            });
            setCategories(response.data);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar las categorías');
        }
    };

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a las fotos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'] as any,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    const uploadImage = async (uri: string) => {
        setUploadingImage(true);
        try {
            if (!CLOUDINARY_CLOUD_NAME || !UPLOAD_PRESET) {
                throw new Error('Configuración de Cloudinary no encontrada. Verifica las variables de entorno.');
            }

            const formData = new FormData();

            const uriParts = uri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            formData.append('file', {
                uri,
                name: `review-image-${Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            } as any);
            formData.append('upload_preset', UPLOAD_PRESET);

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

            const response = await fetch(cloudinaryUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || 'Error uploading image');
            }

            setImage(data.secure_url);
            Alert.alert('¡Éxito!', 'Imagen subida correctamente');
        } catch (error) {
            Alert.alert(
                'Error al subir imagen', 'Verifica tu conexión y que sea una imagen válida. Si persiste, intenta con una imagen más pequeña.'
            );
        } finally {
            setUploadingImage(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const addNewCategory = () => {
        const trimmed = newCategoryInput.trim();
        if (!trimmed) {
            Alert.alert('Error', 'Escribe el nombre de la categoría');
            return;
        }

        if (newCategories.includes(trimmed)) {
            Alert.alert('Error', 'Esta categoría ya está agregada');
            return;
        }

        if (trimmed.length > 50) {
            Alert.alert('Error', 'El nombre de la categoría es muy largo');
            return;
        }

        setNewCategories(prev => [...prev, trimmed]);
        setNewCategoryInput('');
    };

    const removeNewCategory = (category: string) => {
        setNewCategories(prev => prev.filter(cat => cat !== category));
    };

    const handleSubmit = async () => {
        const trimmedComment = comment.trim();

        if (!trimmedComment) {
            Alert.alert('Error', 'Por favor escribe un comentario');
            return;
        }

        if (trimmedComment.length < 10) {
            Alert.alert('Error', 'El comentario debe tener al menos 10 caracteres');
            return;
        }

        if (uploadingImage) {
            Alert.alert('Espera', 'La imagen se está subiendo, por favor espera');
            return;
        }

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert(
                    'Inicio de sesión requerido',
                    'Debes iniciar sesión como cliente para escribir una reseña',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Iniciar sesión', onPress: onClose }
                    ]
                );
                setSubmitting(false);
                return;
            }

            const payload = {
                cafeId,
                rating,
                comment: trimmedComment,
                image: image || undefined,
                selectedCategoryIds: selectedCategories,
                newCategoryNames: newCategories,
            };

            const response = await axios.post(`${API_URL}/reviews`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });


            Alert.alert(
                '¡Reseña enviada!',
                'Tu reseña ha sido enviada correctamente',
                [{
                    text: 'OK', onPress: () => {
                        resetForm();
                        onSuccess();
                    }
                }]
            );
        } catch (error: any) {

            let errorMessage = 'Ocurrió un error al enviar la reseña';

            if (error.response?.status === 401) {
                errorMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Ya has enviado una reseña para este café';
            } else if (error.response?.status === 403) {
                errorMessage = 'Solo los clientes registrados pueden enviar reseñas';
            } else if (error.response?.status === 404) {
                errorMessage = 'No se encontró el café o el endpoint. Verifica la configuración.';
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={`star-${i}`} onPress={() => setRating(i)}>
                    <Ionicons
                        name={i <= rating ? 'star' : 'star-outline'}
                        size={30}
                        color={i <= rating ? '#FFD700' : '#DDD'}
                        style={styles.star}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
    };

    const renderCategoryItem = ({ item: category }: { item: Category }) => {
        const categoryId = category.id || category._id;
        const isSelected = selectedCategories.includes(categoryId);

        return (
            <TouchableOpacity
                style={[
                    styles.categoryButton,
                    isSelected && styles.categoryButtonSelected
                ]}
                onPress={() => toggleCategory(categoryId)}
            >
                <Text style={[
                    styles.categoryButtonText,
                    isSelected && styles.categoryButtonTextSelected
                ]}>
                    {category.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderNewCategoryItem = ({ item, index }: { item: string; index: number }) => (
        <View style={styles.newCategoryTag} key={`new-category-${index}`}>
            <Text style={styles.newCategoryTagText}>{item}</Text>
            <TouchableOpacity onPress={() => removeNewCategory(item)}>
                <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
        </View>
    );

    const visibleCategories = showAllCategories ? categories : categories.slice(0, 6);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#301b0f" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Escribir Reseña</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Calificación</Text>
                        <View style={styles.starsContainer}>
                            {renderStars()}
                        </View>
                        <Text style={styles.ratingText}>{rating} de 5 estrellas</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Comentario *</Text>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Contanos tu experiencia en este café... (mínimo 10 caracteres)"
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <Text style={styles.characterCount}>
                            {comment.length}/500 caracteres
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Foto (opcional)</Text>
                        {image ? (
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: image }} style={styles.selectedImage} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => setImage('')}
                                >
                                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.imagePickerButton}
                                onPress={pickImage}
                                disabled={uploadingImage}
                            >
                                {uploadingImage ? (
                                    <ActivityIndicator color="#301b0f" />
                                ) : (
                                    <>
                                        <Ionicons name="camera-outline" size={24} color="#301b0f" />
                                        <Text style={styles.imagePickerText}>Subir foto</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Categorías</Text>
                        <Text style={styles.sectionSubtitle}>
                            Selecciona las categorías que mejor describan tu experiencia
                        </Text>

                        <FlatList
                            data={visibleCategories}
                            keyExtractor={(item) => `category-${item.id || item._id}`}
                            numColumns={2}
                            scrollEnabled={false}
                            renderItem={renderCategoryItem}
                            contentContainerStyle={styles.categoriesGrid}
                            ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
                        />

                        {categories.length > 6 && (
                            <TouchableOpacity
                                style={styles.moreButton}
                                onPress={() => setShowAllCategories(!showAllCategories)}
                            >
                                <Text style={styles.moreButtonText}>
                                    {showAllCategories ? '− Ver menos' : '+ Ver más categorías'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sugerir nueva categoría</Text>
                        <View style={styles.newCategoryContainer}>
                            <TextInput
                                style={styles.newCategoryInput}
                                placeholder="Ej: Pet-friendly, WiFi rápido..."
                                value={newCategoryInput}
                                onChangeText={setNewCategoryInput}
                                maxLength={50}
                                onSubmitEditing={addNewCategory}
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                style={[
                                    styles.addCategoryButton,
                                    !newCategoryInput.trim() && styles.addCategoryButtonDisabled
                                ]}
                                onPress={addNewCategory}
                                disabled={!newCategoryInput.trim()}
                            >
                                <Text style={styles.addCategoryButtonText}>Agregar</Text>
                            </TouchableOpacity>
                        </View>

                        {newCategories.length > 0 && (
                            <FlatList
                                data={newCategories}
                                keyExtractor={(item, index) => `new-category-${index}`}
                                numColumns={2}
                                scrollEnabled={false}
                                renderItem={renderNewCategoryItem}
                                contentContainerStyle={styles.newCategoriesList}
                            />
                        )}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (submitting || !comment.trim()) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting || !comment.trim()}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Enviar Reseña</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingTop: 50,
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#301b0f',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    section: {
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#301b0f',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 12,
    },
    star: {
        marginHorizontal: 4,
    },
    ratingText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#301b0f',
        fontWeight: '500',
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        backgroundColor: '#f9f9f9',
    },
    characterCount: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: 4,
    },
    imageContainer: {
        position: 'relative',
        alignSelf: 'flex-start',
    },
    selectedImage: {
        width: 120,
        height: 120,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    imagePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    imagePickerText: {
        fontSize: 16,
        color: '#301b0f',
        marginLeft: 8,
        fontWeight: '500',
    },
    categoriesGrid: {
        gap: 8,
    },
    categorySeparator: {
        height: 8,
    },
    categoryButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        flex: 1,
        alignItems: 'center',
    },
    categoryButtonSelected: {
        backgroundColor: '#301b0f',
        borderColor: '#301b0f',
    },
    categoryButtonText: {
        fontSize: 14,
        color: '#301b0f',
        textAlign: 'center',
    },
    categoryButtonTextSelected: {
        color: '#fff',
    },
    moreButton: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
        alignItems: 'center',
    },
    moreButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    newCategoryContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    newCategoryInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    addCategoryButton: {
        backgroundColor: '#301b0f',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    addCategoryButtonDisabled: {
        backgroundColor: '#ccc',
    },
    addCategoryButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    newCategoriesList: {
        marginTop: 12,
        gap: 8,
    },
    newCategoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
        flex: 1,
    },
    newCategoryTagText: {
        fontSize: 14,
        color: '#2e7d32',
        marginRight: 6,
        flex: 1,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    submitButton: {
        backgroundColor: '#301b0f',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ReviewFormModal;