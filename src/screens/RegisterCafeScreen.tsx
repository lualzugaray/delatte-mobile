import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '../hooks/useNavigation';
import {
    getCategoriesService,
    createCafeService,
    uploadImageToCloudinary,
    CafeFormData
} from '../services/api/cafeService';
import { debugToken } from '../utils/tokenHelper';
import AddressInput from '../components/AddressInput';

interface Category {
    id: string;
    name: string;
}

const STEPS = [
    { id: 1, title: 'Información básica', icon: '🏪' },
    { id: 2, title: 'Detalles', icon: '📝' },
    { id: 3, title: 'Fotos', icon: '📸' },
    { id: 4, title: 'Categorías', icon: '🏷️' },
    { id: 5, title: 'Horarios', icon: '🕐' },
];

const DAYS = [
    'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'
];

const RegisterCafeScreen = () => {
    const navigation = useNavigation();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState<CafeFormData>({
        name: '',
        address: '',
        phone: '',
        email: '',
        instagram: '',
        menuUrl: '',
        description: '',
        location: { lat: 0, lng: 0 },
        categories: [],
        schedule: DAYS.map(day => ({ day, open: '', close: '' })),
        hasPowerOutlets: false,
        isPetFriendly: false,
        isDigitalNomadFriendly: false,
        gallery: [],
        coverImage: '',
        suggestedCategories: [],
    });

    useEffect(() => {
        loadCategories();
        debugToken();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategoriesService();
            setCategories(data);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar las categorías');
        }
    };

    const updateFormData = (field: keyof CafeFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!(
                    formData.name &&
                    formData.address &&
                    formData.phone &&
                    formData.email &&
                    formData.location.lat !== 0 &&
                    formData.location.lng !== 0
                );
            case 2:
                return !!formData.description;
            case 3:
                return formData.gallery.length >= 3;
            case 4:
                return formData.categories.length > 0;
            case 5:
                return formData.schedule.some(day => day.open && day.close);
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (!validateStep(currentStep)) {
            Alert.alert('Error', 'Por favor completa todos los campos requeridos');
            return;
        }
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const pickImages = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 10,
            });

            if (!result.canceled && result.assets) {
                setLoading(true);
                const uploadPromises = result.assets.map(asset =>
                    uploadImageToCloudinary(asset.uri)
                );

                try {
                    const uploadedUrls = await Promise.all(uploadPromises);
                    updateFormData('gallery', [...formData.gallery, ...uploadedUrls]);

                    if (!formData.coverImage && uploadedUrls.length > 0) {
                        updateFormData('coverImage', uploadedUrls[0]);
                    }
                } catch (error) {
                    Alert.alert('Error', 'Error al subir las imágenes');
                } finally {
                    setLoading(false);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Error al seleccionar imágenes');
        }
    };

    const toggleCategory = (categoryId: string) => {
        const isSelected = formData.categories.includes(categoryId);
        if (isSelected) {
            updateFormData('categories', formData.categories.filter(id => id !== categoryId));
        } else {
            updateFormData('categories', [...formData.categories, categoryId]);
        }
    };

    const updateSchedule = (dayIndex: number, field: 'open' | 'close', value: string) => {
        let formattedValue = value;

        if (value) {
            formattedValue = value.replace(/[^\d:]/g, '');
            formattedValue = formattedValue.replace(/:+/g, ':');
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (formattedValue && !timeRegex.test(formattedValue)) {
                const parts = formattedValue.split(':');
                if (parts.length >= 2) {
                    const hours = parts[0].padStart(2, '0');
                    const minutes = parts[1].padStart(2, '0');
                    formattedValue = `${hours}:${minutes}`;
                }
            }
        }

        const newSchedule = [...formData.schedule];
        newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: formattedValue };
        updateFormData('schedule', newSchedule);
    };

    const submitForm = async () => {
        if (!validateStep(5)) {
            Alert.alert('Error', 'Por favor completa todos los campos requeridos');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                Alert.alert('Error', 'No estás autenticado. Por favor, inicia sesión nuevamente.');
                navigation.navigate('Login');
                return;
            }

            await createCafeService(formData, token);

            Alert.alert(
                '¡Éxito!',
                'Tu cafetería ha sido registrada correctamente',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Error al registrar la cafetería');
        } finally {
            setLoading(false);
        }
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(currentStep / 5) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>Paso {currentStep} de 5</Text>

            <TouchableOpacity
                style={styles.debugButton}
                onPress={debugToken}
            >
                <Text style={styles.debugButtonText}>🔍 Debug Token</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStepIndicators = () => (
        <View style={styles.stepIndicators}>
            {STEPS.map((step) => (
                <View key={step.id} style={styles.stepIndicator}>
                    <View style={[
                        styles.stepCircle,
                        currentStep >= step.id && styles.stepCircleActive,
                        currentStep === step.id && styles.stepCircleCurrent
                    ]}>
                        <Text style={[
                            styles.stepIcon,
                            currentStep >= step.id && styles.stepIconActive
                        ]}>
                            {step.icon}
                        </Text>
                    </View>
                    <Text style={[
                        styles.stepTitle,
                        currentStep === step.id && styles.stepTitleActive
                    ]}>
                        {step.title}
                    </Text>
                </View>
            ))}
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepHeader}>Información básica de tu cafetería</Text>

            <TextInput
                style={styles.input}
                placeholder="Nombre de la cafetería *"
                placeholderTextColor="#7a7a7a"
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
            />

            <AddressInput
                value={formData.address}
                onAddressChange={(address, coordinates) => {
                    updateFormData('address', address);
                    updateFormData('location', coordinates);
                }}
                placeholder="Dirección completa *"
            />

            <TextInput
                style={styles.input}
                placeholder="Teléfono *"
                placeholderTextColor="#7a7a7a"
                value={formData.phone}
                onChangeText={(text) => updateFormData('phone', text)}
                keyboardType="phone-pad"
            />

            <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor="#7a7a7a"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepHeader}>Cuéntanos más sobre tu café</Text>

            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción de tu cafetería *"
                placeholderTextColor="#7a7a7a"
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                multiline
                numberOfLines={4}
            />

            <TextInput
                style={styles.input}
                placeholder="Instagram (opcional)"
                placeholderTextColor="#7a7a7a"
                value={formData.instagram}
                onChangeText={(text) => updateFormData('instagram', text)}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="URL del menú (opcional)"
                placeholderTextColor="#7a7a7a"
                value={formData.menuUrl}
                onChangeText={(text) => updateFormData('menuUrl', text)}
                autoCapitalize="none"
            />
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepHeader}>Fotos de tu cafetería</Text>
            <Text style={styles.stepSubtitle}>Sube al menos 3 fotos atractivas</Text>

            <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImages}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#301b0f" />
                ) : (
                    <>
                        <Text style={styles.uploadIcon}>📷</Text>
                        <Text style={styles.uploadText}>Seleccionar fotos</Text>
                    </>
                )}
            </TouchableOpacity>

            {formData.gallery.length > 0 && (
                <View style={styles.imageGrid}>
                    {formData.gallery.map((uri, index) => (
                        <View key={index} style={styles.imageContainer}>
                            <Image source={{ uri }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.coverButton}
                                onPress={() => updateFormData('coverImage', uri)}
                            >
                                <Text style={[
                                    styles.coverButtonText,
                                    formData.coverImage === uri && styles.coverButtonTextSelected
                                ]}>
                                    {formData.coverImage === uri ? '✅ Portada' : 'Usar como portada'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => {
                                    const newGallery = formData.gallery.filter((_, i) => i !== index);
                                    updateFormData('gallery', newGallery);
                                    if (formData.coverImage === uri) {
                                        updateFormData('coverImage', newGallery[0] || '');
                                    }
                                }}
                            >
                                <Text style={styles.deleteButtonText}>❌</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <Text style={styles.imageCount}>
                {formData.gallery.length} de 3+ fotos requeridas
            </Text>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepHeader}>Características del café</Text>

            <Text style={styles.sectionTitle}>Categorías</Text>
            <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryChip,
                            formData.categories.includes(category.id) && styles.categoryChipSelected
                        ]}
                        onPress={() => toggleCategory(category.id)}
                    >
                        <Text style={[
                            styles.categoryChipText,
                            formData.categories.includes(category.id) && styles.categoryChipTextSelected
                        ]}>
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Características especiales</Text>

            <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Enchufes disponibles</Text>
                <Switch
                    value={formData.hasPowerOutlets}
                    onValueChange={(value) => updateFormData('hasPowerOutlets', value)}
                    trackColor={{ false: '#ddd', true: '#AC7851' }}
                    thumbColor={formData.hasPowerOutlets ? '#301b0f' : '#f4f3f4'}
                />
            </View>

            <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Pet friendly</Text>
                <Switch
                    value={formData.isPetFriendly}
                    onValueChange={(value) => updateFormData('isPetFriendly', value)}
                    trackColor={{ false: '#ddd', true: '#AC7851' }}
                    thumbColor={formData.isPetFriendly ? '#301b0f' : '#f4f3f4'}
                />
            </View>

            <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Apto para nómadas digitales</Text>
                <Switch
                    value={formData.isDigitalNomadFriendly}
                    onValueChange={(value) => updateFormData('isDigitalNomadFriendly', value)}
                    trackColor={{ false: '#ddd', true: '#AC7851' }}
                    thumbColor={formData.isDigitalNomadFriendly ? '#301b0f' : '#f4f3f4'}
                />
            </View>
        </View>
    );

    const renderStep5 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepHeader}>Horarios de atención</Text>
            <Text style={styles.stepSubtitle}>Define al menos un día de atención</Text>

            {formData.schedule.map((daySchedule, index) => (
                <View key={daySchedule.day} style={styles.scheduleRow}>
                    <Text style={styles.dayLabel}>
                        {daySchedule.day.charAt(0).toUpperCase() + daySchedule.day.slice(1)}
                    </Text>
                    <View style={styles.timeInputs}>
                        <TextInput
                            style={styles.timeInput}
                            placeholder="09:00"
                            value={daySchedule.open}
                            onChangeText={(text) => updateSchedule(index, 'open', text)}
                        />
                        <Text style={styles.timeSeparator}>a</Text>
                        <TextInput
                            style={styles.timeInput}
                            placeholder="18:00"
                            value={daySchedule.close}
                            onChangeText={(text) => updateSchedule(index, 'close', text)}
                        />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            default: return renderStep1();
        }
    };

    return (
        <View style={styles.container}>
            {renderProgressBar()}
            {renderStepIndicators()}

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {renderCurrentStep()}
            </ScrollView>

            <View style={styles.navigationButtons}>
                {currentStep > 1 && (
                    <TouchableOpacity
                        style={[styles.navButton, styles.prevButton]}
                        onPress={prevStep}
                    >
                        <Text style={styles.prevButtonText}>← Anterior</Text>
                    </TouchableOpacity>
                )}

                {currentStep < 5 ? (
                    <TouchableOpacity
                        style={[styles.navButton, styles.nextButton]}
                        onPress={nextStep}
                    >
                        <Text style={styles.nextButtonText}>Siguiente →</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.navButton, styles.submitButton]}
                        onPress={submitForm}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Registrar Cafetería ✨</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    progressContainer: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#eee',
        borderRadius: 2,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#AC7851',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: '#7a7a7a',
        textAlign: 'center',
    },
    debugButton: {
        marginTop: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        alignSelf: 'center',
    },
    debugButtonText: {
        fontSize: 10,
        color: '#666',
    },
    stepIndicators: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
    },
    stepIndicator: {
        alignItems: 'center',
        flex: 1,
    },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepCircleActive: {
        backgroundColor: '#AC7851',
    },
    stepCircleCurrent: {
        backgroundColor: '#301b0f',
    },
    stepIcon: {
        fontSize: 16,
    },
    stepIconActive: {
        color: '#fff',
    },
    stepTitle: {
        fontSize: 10,
        color: '#7a7a7a',
        textAlign: 'center',
    },
    stepTitleActive: {
        color: '#301b0f',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    stepContent: {
        padding: 20,
    },
    stepHeader: {
        fontSize: 24,
        fontWeight: '700',
        color: '#301b0f',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#7a7a7a',
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        marginBottom: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    uploadButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#AC7851',
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 32,
        alignItems: 'center',
        marginBottom: 16,
    },
    uploadIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    uploadText: {
        fontSize: 16,
        color: '#AC7851',
        fontWeight: '600',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    imageContainer: {
        width: '48%',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 8,
    },
    coverButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingVertical: 4,
        alignItems: 'center',
        marginBottom: 4,
    },
    coverButtonText: {
        fontSize: 10,
        color: '#7a7a7a',
    },
    coverButtonTextSelected: {
        color: '#28a745',
        fontWeight: '600',
    },
    deleteButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 12,
    },
    imageCount: {
        fontSize: 12,
        color: '#7a7a7a',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#301b0f',
        marginBottom: 12,
        marginTop: 8,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    categoryChip: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    categoryChipSelected: {
        backgroundColor: '#AC7851',
        borderColor: '#AC7851',
    },
    categoryChipText: {
        fontSize: 12,
        color: '#7a7a7a',
    },
    categoryChipTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 8,
    },
    switchLabel: {
        fontSize: 14,
        color: '#301b0f',
        flex: 1,
    },
    scheduleRow: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dayLabel: {
        fontSize: 14,
        color: '#301b0f',
        fontWeight: '600',
        width: 80,
    },
    timeInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    timeInput: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 12,
        width: 60,
        textAlign: 'center',
    },
    timeSeparator: {
        fontSize: 12,
        color: '#7a7a7a',
        marginHorizontal: 8,
    },
    navigationButtons: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 34,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 12,
    },
    navButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    prevButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    nextButton: {
        backgroundColor: '#AC7851',
    },
    submitButton: {
        backgroundColor: '#301b0f',
    },
    prevButtonText: {
        fontSize: 14,
        color: '#7a7a7a',
        fontWeight: '600',
    },
    nextButtonText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    submitButtonText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
});

export default RegisterCafeScreen;