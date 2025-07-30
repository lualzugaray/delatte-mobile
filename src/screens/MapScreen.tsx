import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Dimensions,
    Modal,
    Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Cafe, UserLocation } from '../types/navigation';

type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Map'>;

const { width, height } = Dimensions.get('window');
const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;

const StarRating = ({ rating = 0 }: { rating?: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const stars = [];

    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <Text key={`full-${i}`} style={styles.star}>⭐</Text>
        );
    }

    if (hasHalfStar) {
        stars.push(
            <Text key="half" style={styles.star}>⭐</Text>
        );
    }

    for (let i = 0; i < emptyStars; i++) {
        stars.push(
            <Text key={`empty-${i}`} style={styles.emptyStar}>☆</Text>
        );
    }

    return <View style={styles.starsContainer}>{stars}</View>;
};

const MapScreen = () => {
    const navigation = useNavigation<MapScreenNavigationProp>();
    const [cafes, setCafes] = useState<Cafe[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    const defaultRegion = {
        latitude: -34.9011,
        longitude: -56.1645,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    const [region, setRegion] = useState<Region>(defaultRegion);

    useEffect(() => {
        requestLocationPermission();
        fetchCafes();
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status === 'granted') {
                try {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    
                    const userCoords = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };

                    console.log('Ubicación del usuario obtenida:', userCoords);
                    setUserLocation(userCoords);
                    
                    const isInUruguay = 
                        userCoords.latitude >= -35.5 && 
                        userCoords.latitude <= -30 &&
                        userCoords.longitude >= -59 && 
                        userCoords.longitude <= -53;
                    
                    if (isInUruguay) {
                        setRegion({
                            ...userCoords,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        });
                    } else {
                        console.log('Ubicación fuera de Uruguay, manteniendo centrado en Montevideo');
                    }
                } catch (locationError) {
                    console.log('Error obteniendo ubicación:', locationError);
                }
            } else {
                console.log('Permisos de ubicación denegados');
                Alert.alert(
                    'Permisos de ubicación',
                    'Para una mejor experiencia, permite el acceso a tu ubicación',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.log('Error con permisos de ubicación:', error);
        }
    };

    const fetchCafes = async () => {
        try {
            setLoading(true);
            console.log('Obteniendo cafés desde:', API_URL);
            
            if (!API_URL) {
                console.log('API_URL no configurada');
                setCafes([]);
                return;
            }

            const response = await axios.get(`${API_URL}/cafes`, {
                timeout: 10000,
            });

            if (Array.isArray(response.data)) {
                const cafesWithLocation: Cafe[] = response.data.filter(
                    (cafe: Cafe) => cafe.location?.lat && 
                                   cafe.location?.lng &&
                                   typeof cafe.location.lat === 'number' &&
                                   typeof cafe.location.lng === 'number' &&
                                   !isNaN(cafe.location.lat) &&
                                   !isNaN(cafe.location.lng)
                );
                
                console.log('Cafés con ubicación encontrados:', cafesWithLocation.length);
                setCafes(cafesWithLocation);
            } else {
                console.log('Response data no es array:', typeof response.data);
                setCafes([]);
            }
        } catch (error) {
            console.log('Error cargando cafés:', error);
            Alert.alert('Error', 'No se pudieron cargar los cafés');
            setCafes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkerPress = (cafe: Cafe) => {
        try {
            console.log('Marker presionado:', cafe.name);
            setSelectedCafe(cafe);
            setModalVisible(true);
        } catch (error) {
            console.log('Error en handleMarkerPress:', error);
        }
    };

    const handleCafePress = (cafeId: string) => {
        try {
            setModalVisible(false);
            navigation.navigate('CafeDetails', { cafeId });
        } catch (error) {
            console.log('Error navegando a detalles:', error);
            setModalVisible(false);
        }
    };

    const centerOnUserLocation = () => {
        try {
            if (userLocation) {
                console.log('Centrando en ubicación del usuario');
                setRegion({
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                });
            } else {
                console.log('No hay ubicación del usuario disponible');
                Alert.alert(
                    'Ubicación no disponible', 
                    'No se pudo obtener tu ubicación actual'
                );
            }
        } catch (error) {
            console.log('Error centrando ubicación:', error);
        }
    };

    const centerOnMontevideo = () => {
        try {
            console.log('Centrando en Montevideo');
            setRegion(defaultRegion);
        } catch (error) {
            console.log('Error centrando en Montevideo:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#301b0f" />
                <Text style={styles.loadingText}>Cargando cafés...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mapa de Cafés</Text>
                
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.montevideoButton}
                        onPress={centerOnMontevideo}
                    >
                        <Text style={styles.locationButtonText}>🏙️</Text>
                    </TouchableOpacity>
                    
                    {userLocation && (
                        <TouchableOpacity
                            style={styles.locationButton}
                            onPress={centerOnUserLocation}
                        >
                            <Text style={styles.locationButtonText}>📍</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                initialRegion={defaultRegion}
                region={region}
                onRegionChangeComplete={setRegion}
                showsUserLocation={false}
                showsMyLocationButton={false}
                toolbarEnabled={false}
                mapType="standard"
                maxZoomLevel={18}
                minZoomLevel={8}
                onMapReady={() => {
                    console.log('Mapa principal listo');
                }}
            >
                {cafes.map((cafe) => {
                    if (!cafe.location?.lat || !cafe.location?.lng) {
                        return null;
                    }

                    try {
                        return (
                            <Marker
                                key={cafe._id}
                                coordinate={{
                                    latitude: cafe.location.lat,
                                    longitude: cafe.location.lng,
                                }}
                                title={cafe.name}
                                description={cafe.address || 'Toca para ver más detalles'}
                                onPress={() => handleMarkerPress(cafe)}
                            >
                                <View style={styles.markerContainer}>
                                    <Text style={styles.markerIcon}>☕</Text>
                                </View>
                            </Marker>
                        );
                    } catch (error) {
                        console.log('Error renderizando marker:', error);
                        return null;
                    }
                })}
            </MapView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {selectedCafe && (
                            <>
                                <Image
                                    source={{
                                        uri: selectedCafe.coverImage || 
                                             selectedCafe.gallery?.[0] || 
                                             'https://via.placeholder.com/300x200/cccccc/666666?text=Cafe',
                                    }}
                                    style={styles.modalImage}
                                    defaultSource={{
                                        uri: 'https://via.placeholder.com/300x200/cccccc/666666?text=Cafe'
                                    }}
                                />

                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>
                                        {selectedCafe.name || 'Café'}
                                    </Text>

                                    {selectedCafe.averageRating && 
                                     selectedCafe.averageRating > 0 && (
                                        <View style={styles.ratingContainer}>
                                            <StarRating rating={selectedCafe.averageRating} />
                                            <Text style={styles.ratingText}>
                                                ({selectedCafe.averageRating.toFixed(1)})
                                            </Text>
                                        </View>
                                    )}

                                    {selectedCafe.address && (
                                        <Text style={styles.modalAddress}>
                                            {selectedCafe.address}
                                        </Text>
                                    )}

                                    {selectedCafe.description && (
                                        <Text style={styles.modalDescription} numberOfLines={3}>
                                            {selectedCafe.description}
                                        </Text>
                                    )}

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={styles.closeButton}
                                            onPress={() => setModalVisible(false)}
                                        >
                                            <Text style={styles.closeButtonText}>Cerrar</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.detailButton}
                                            onPress={() => handleCafePress(selectedCafe._id)}
                                        >
                                            <Text style={styles.detailButtonText}>Ver más →</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <View style={styles.bottomInfo}>
                <Text style={styles.infoText}>
                    {cafes.length} cafés encontrados en Montevideo
                </Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchCafes}
                >
                    <Text style={styles.refreshText}>🔄 Actualizar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#301b0f',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#301b0f',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#301b0f',
        flex: 1,
        textAlign: 'center',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    montevideoButton: {
        padding: 8,
        backgroundColor: '#AC7851',
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationButton: {
        padding: 8,
        backgroundColor: '#301b0f',
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationButtonText: {
        fontSize: 16,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        backgroundColor: '#301b0f',
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    markerIcon: {
        fontSize: 18,
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.7,
        overflow: 'hidden',
    },
    modalImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        backgroundColor: '#f0f0f0',
    },
    modalContent: {
        padding: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#301b0f',
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingText: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
        fontWeight: '600',
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        fontSize: 16,
        marginRight: 2,
    },
    emptyStar: {
        fontSize: 16,
        marginRight: 2,
        color: '#ddd',
    },
    modalAddress: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
        lineHeight: 22,
    },
    modalDescription: {
        fontSize: 14,
        color: '#888',
        lineHeight: 20,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    closeButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#301b0f',
        fontWeight: '600',
    },
    detailButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#301b0f',
        borderRadius: 12,
        alignItems: 'center',
    },
    detailButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    bottomInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
    refreshButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
    },
    refreshText: {
        fontSize: 12,
        color: '#301b0f',
        fontWeight: '600',
    },
});

export default MapScreen;