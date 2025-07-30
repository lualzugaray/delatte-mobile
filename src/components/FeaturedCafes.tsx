import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL as string;
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

interface Cafe {
    _id: string;
    name: string;
    description: string;
    coverImage?: string;
    gallery?: string[];
    averageRating: number;
    reviewsCount: number;
    address: string;
}

// SafeImage component para manejo robusto de imágenes
const SafeImage = ({ 
  source, 
  style, 
  resizeMode = 'cover'
}: { 
  source: { uri: string }, 
  style: any, 
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (source?.uri) {
      setHasError(false);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [source?.uri]);

  const handleError = useCallback(() => {
    try {
      setHasError(true);
      setIsLoading(false);
    } catch (e) {
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  const handleLoad = useCallback(() => {
    try {
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  }, []);

  const hasValidUri = source?.uri && typeof source.uri === 'string' && source.uri.length > 0;

  if (!hasValidUri || hasError) {
    return (
      <View style={[style, styles.placeholderContainer]}>
        <Text style={styles.placeholderText}>☕</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={source}
        style={style}
        resizeMode={resizeMode}
        onError={handleError}
        onLoad={handleLoad}
        fadeDuration={200}
      />
      {isLoading && (
        <View style={[style, styles.imageLoader]}>
          <ActivityIndicator size="small" color="#301b0f" />
        </View>
      )}
    </View>
  );
};

const FeaturedCafes = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [cafes, setCafes] = useState<Cafe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCafes();
    }, []);

    const fetchCafes = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!API_URL) {
                setCafes([]);
                return;
            }

            const res = await axios.get(`${API_URL}/cafes?sortBy=rating&limit=3`);
            const data = res.data;

            if (Array.isArray(data)) {
                // Filtrar cafés válidos
                const validCafes = data.filter(cafe => 
                    cafe && 
                    typeof cafe === 'object' && 
                    cafe._id && 
                    cafe.name
                );
                setCafes(validCafes);
            } else {
                setCafes([]);
            }
        } catch (err) {
            setError('Error al cargar cafeterías');
            setCafes([]);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (averageRating = 0) => {
        try {
            const safeRating = Math.max(0, Math.min(5, averageRating || 0));
            const fullStars = Math.floor(safeRating);
            const hasHalfStar = safeRating % 1 >= 0.25 && safeRating % 1 < 0.75;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
            const stars = [];

            for (let i = 0; i < fullStars; i++) stars.push("star");
            if (hasHalfStar) stars.push("star_half");
            for (let i = 0; i < emptyStars; i++) stars.push("star_border");

            return stars.map((icon, i) => {
                let iconName: string;
                if (icon === "star") iconName = "star";
                else if (icon === "star_half") iconName = "star-half";
                else iconName = "star-outline";

                return (
                    <Ionicons key={i} name={iconName as any} size={14} color="#AC7851" />
                );
            });
        } catch (error) {
            return [];
        }
    };

    const handleCafePress = (cafeId: string) => {
        try {
            if (cafeId && typeof cafeId === 'string') {
                navigation.navigate('CafeDetails', { cafeId });
            }
        } catch (error) {
            // Silently fail
        }
    };

    const getImageUri = (cafe: Cafe) => {
        if (cafe.coverImage && typeof cafe.coverImage === 'string') {
            return cafe.coverImage;
        }
        if (cafe.gallery && Array.isArray(cafe.gallery) && cafe.gallery[0]) {
            return cafe.gallery[0];
        }
        return null;
    };

    const retryFetch = () => {
        fetchCafes();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>
                    <Text style={styles.brownText}>cafeterías</Text> destacadas ★
                </Text>
                <Text style={styles.subtitle}>(las más queridas por la comunidad)</Text>
                
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#AC7851" />
                    <Text style={styles.loadingText}>Cargando cafeterías...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>
                    <Text style={styles.brownText}>cafeterías</Text> destacadas ★
                </Text>
                <Text style={styles.subtitle}>(las más queridas por la comunidad)</Text>
                
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>❌ {error}</Text>
                    <TouchableOpacity onPress={retryFetch} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                <Text style={styles.brownText}>cafeterías</Text> destacadas ★
            </Text>
            <Text style={styles.subtitle}>(las más queridas por la comunidad)</Text>

            {cafes && cafes.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContainer}
                    snapToInterval={CARD_WIDTH + 16}
                    decelerationRate="fast"
                >
                    {cafes.map((cafe) => {
                        if (!cafe || !cafe._id) return null;
                        
                        const imageUri = getImageUri(cafe);
                        
                        return (
                            <TouchableOpacity
                                key={cafe._id}
                                style={styles.cafeCard}
                                onPress={() => handleCafePress(cafe._id)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.cafeOptionsWrapper} pointerEvents="none">
                                    <View style={styles.cafeOptionsIcon}>
                                        <Ionicons name="open-outline" size={16} color="#301b0f" />
                                    </View>
                                </View>

                                {imageUri ? (
                                    <SafeImage
                                        source={{ uri: imageUri }}
                                        style={styles.cafeImage}
                                    />
                                ) : (
                                    <View style={[styles.cafeImage, styles.placeholderContainer]}>
                                        <Text style={styles.placeholderText}>☕</Text>
                                    </View>
                                )}

                                <View style={styles.cafeInfo}>
                                    <Text style={styles.cafeName} numberOfLines={1}>
                                        {cafe.name || 'Café'}
                                    </Text>

                                    <Text style={styles.cafeDescription} numberOfLines={2}>
                                        {cafe.description || 'Un lugar especial para disfrutar café'}
                                    </Text>

                                    <View style={styles.ratingContainer}>
                                        <View style={styles.starsContainer}>
                                            {renderStars(cafe.averageRating)}
                                        </View>
                                        <Text style={styles.ratingNumber}>
                                            {(cafe.averageRating || 0).toFixed(1)}{" "}
                                            {(cafe.reviewsCount || 0) > 0 && `(${cafe.reviewsCount})`}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyMessage}>☕️</Text>
                    <Text style={styles.emptyText}>Aún no hay cafeterías destacadas</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#301b0f',
        marginBottom: 4,
    },
    brownText: {
        color: '#AC7851',
    },
    subtitle: {
        fontSize: 14,
        color: '#7a7a7a',
        marginBottom: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#7a7a7a',
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#ffc107',
        borderStyle: 'dashed',
    },
    errorText: {
        fontSize: 14,
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: '#301b0f',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    scrollContainer: {
        paddingRight: 20,
        gap: 16,
    },
    cafeCard: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
        position: 'relative',
    },
    cafeOptionsWrapper: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
    },
    cafeOptionsIcon: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cafeImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#f0f0f0',
    },
    placeholderContainer: {
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 32,
        color: '#AC7851',
    },
    imageLoader: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    cafeInfo: {
        padding: 16,
    },
    cafeName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#301b0f',
        marginBottom: 4,
    },
    cafeDescription: {
        fontSize: 13,
        color: '#7a7a7a',
        lineHeight: 18,
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 6,
    },
    ratingNumber: {
        fontSize: 13,
        fontWeight: '600',
        color: '#301b0f',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyMessage: {
        fontSize: 32,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#7a7a7a',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default FeaturedCafes;