import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
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

    const cafesWithLocation = cafes.filter(
        cafe => cafe.location?.lat && cafe.location?.lng
    );

    const defaultRegion = {
        latitude: -34.9011,
        longitude: -56.1645,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    const handleMarkerPress = (cafeId: string) => {
        navigation.navigate('CafeDetails', { cafeId });
    };

    const handleExplorePress = () => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'Explore'
            })
        );
    };

    const handleMapPress = () => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'Map'
            })
        );
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

    return (
        <View style={[styles.container, isPreview && styles.previewContainer]}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={defaultRegion}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                scrollEnabled={!isPreview}
                zoomEnabled={!isPreview}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                {cafesWithLocation.map((cafe) => (
                    <Marker
                        key={cafe._id}
                        coordinate={{
                            latitude: cafe.location!.lat,
                            longitude: cafe.location!.lng,
                        }}
                        title={cafe.name}
                        onPress={() => handleMarkerPress(cafe._id)}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.marker}>
                                <Text style={styles.markerText}>☕</Text>
                            </View>
                        </View>
                    </Marker>
                ))}
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
                            {cafesWithLocation.length} cafés encontrados
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