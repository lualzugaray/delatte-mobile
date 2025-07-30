import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { CommonActions } from '@react-navigation/native';

interface Cafe {
    _id: string;
    name: string;
    location?: {
        lat: number;
        lng: number;
    };
}

interface CafeMapProps {
    cafes: Cafe[];
    isPreview?: boolean;
}

const CafeMap: React.FC<CafeMapProps> = ({ cafes, isPreview = false }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [mapError, setMapError] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    const safeCafes = Array.isArray(cafes) ? cafes : [];
    const cafesWithLocation = safeCafes.filter(
        cafe => cafe && 
               cafe.location && 
               typeof cafe.location.lat === 'number' && 
               typeof cafe.location.lng === 'number' &&
               !isNaN(cafe.location.lat) && 
               !isNaN(cafe.location.lng)
    );

    const defaultRegion = {
        latitude: -34.9011, 
        longitude: -56.1645,
        latitudeDelta: 0.05, 
        longitudeDelta: 0.05,
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!mapLoaded) {
                setMapError(true);
            }
        }, 15000);

        return () => clearTimeout(timeout);
    }, [mapLoaded]);

    const handleMarkerPress = (cafeId: string) => {
        try {
            if (cafeId && typeof cafeId === 'string') {
                console.log('Navegando a café:', cafeId);
                navigation.navigate('CafeDetails', { cafeId });
            }
        } catch (error) {
            console.log('Error navegando a café:', error);
        }
    };

    const handleExplorePress = () => {
        try {
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'Explore'
                })
            );
        } catch (error) {
            console.log('Error navegando a explorar:', error);
        }
    };

    const handleMapPress = () => {
        try {
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'Map'
                })
            );
        } catch (error) {
            console.log('Error navegando a mapa:', error);
        }
    };

    const handleMapReady = () => {
        console.log('CafeMap: Mapa listo');
        setMapLoaded(true);
    };

    const handleMapError = (error: any) => {
        console.log('CafeMap: Error del mapa:', error);
        setMapError(true);
    };

    if (cafesWithLocation.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>📍</Text>
                <Text style={styles.emptySubtext}>
                    No hay cafés con ubicación disponible
                </Text>
                <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={handleExplorePress}
                >
                    <Text style={styles.exploreButtonText}>Explorar cafés</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (mapError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>🗺️</Text>
                <Text style={styles.errorTitle}>Mapa no disponible</Text>
                <Text style={styles.errorSubtext}>
                    {cafesWithLocation.length} cafés encontrados en Montevideo
                </Text>
                <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={handleExplorePress}
                >
                    <Text style={styles.exploreButtonText}>Ver lista de cafés</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, isPreview && styles.previewContainer]}>
            <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                initialRegion={defaultRegion} 
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                scrollEnabled={!isPreview}
                zoomEnabled={!isPreview}
                rotateEnabled={false}
                pitchEnabled={false}
                onMapReady={handleMapReady}
                loadingEnabled={true}
                loadingIndicatorColor="#301b0f"
                loadingBackgroundColor="#f8f9fa"
                mapType="standard"
                maxZoomLevel={18}
                minZoomLevel={10}
            >
                {cafesWithLocation.map((cafe) => {
                    if (!cafe || !cafe._id || !cafe.location) {
                        return null;
                    }

                    return (
                        <Marker
                            key={cafe._id}
                            coordinate={{
                                latitude: cafe.location.lat,
                                longitude: cafe.location.lng,
                            }}
                            title={cafe.name || 'Café'}
                            description="Toca para ver detalles"
                            onPress={() => handleMarkerPress(cafe._id)}
                        >
                            <View style={styles.markerContainer}>
                                <View style={styles.marker}>
                                    <Text style={styles.markerText}>☕</Text>
                                </View>
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            {isPreview && (
                <TouchableOpacity
                    style={styles.mapOverlay}
                    onPress={handleMapPress}
                    activeOpacity={0.7}
                >
                    <View style={styles.overlayContent}>
                        <Text style={styles.overlayText}>Ver mapa completo</Text>
                        <Text style={styles.overlaySubtext}>
                            {cafesWithLocation.length} cafés en Montevideo
                        </Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    previewContainer: {
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    emptyContainer: {
        height: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#eee',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 32,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#7a7a7a',
        textAlign: 'center',
        marginBottom: 16,
    },
    errorContainer: {
        height: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffc107',
        borderStyle: 'dashed',
    },
    errorIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#301b0f',
        marginBottom: 4,
    },
    errorSubtext: {
        fontSize: 12,
        color: '#7a7a7a',
        textAlign: 'center',
        marginBottom: 16,
    },
    exploreButton: {
        backgroundColor: '#AC7851',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    exploreButtonText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    marker: {
        backgroundColor: '#301b0f',
        borderRadius: 20,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    markerText: {
        fontSize: 16,
        color: '#fff',
    },
    mapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(48, 27, 15, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    overlayText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#301b0f',
        marginBottom: 2,
    },
    overlaySubtext: {
        fontSize: 12,
        color: '#7a7a7a',
    },
});

export default CafeMap;