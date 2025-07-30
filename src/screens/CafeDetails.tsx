import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView,
  Linking,
  FlatList,
  SafeAreaView, Modal
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import axios from 'axios';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import ReviewFormModal from '../components/ReviewFormModal';
import { Image, Alert, Share, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL as string;

type CafeDetailsRouteProp = RouteProp<RootStackParamList, 'CafeDetails'>;
type CafeDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CafeDetails'>;

const SafeImage = ({ 
  source, 
  style, 
  resizeMode = 'cover',
  onPress 
}: { 
  source: { uri: string }, 
  style: any, 
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center',
  onPress?: () => void 
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

  const handleLoadStart = useCallback(() => {
    try {
      setIsLoading(true);
    } catch (e) {
    }
  }, []);

  const hasValidUri = source?.uri && typeof source.uri === 'string' && source.uri.length > 0;

  const ImageComponent = (
    <View style={style}>
      {!hasError && hasValidUri ? (
        <>
          <Image
            source={source}
            style={style}
            resizeMode={resizeMode}
            onError={handleError}
            onLoad={handleLoad}
            onLoadStart={handleLoadStart}
            fadeDuration={200}
          />
          {isLoading && (
            <View style={[style, styles.imageLoader]}>
              <ActivityIndicator size="small" color="#301b0f" />
            </View>
          )}
        </>
      ) : (
        <Image
          source={require('../assets/default-cafe.jpg')} 
          style={style}
          resizeMode={resizeMode}
        />
      )}
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {ImageComponent}
    </TouchableOpacity>
  ) : ImageComponent;
};

const CafeDetails = () => {
  const route = useRoute<CafeDetailsRouteProp>();
  const navigation = useNavigation<CafeDetailsNavigationProp>();
  const { cafeId } = route.params;
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [cafe, setCafe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (cafeId) {
      fetchCafeDetails();
      checkFavorite();
    }
  }, [cafeId]);

  const fetchCafeDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!cafeId) {
        throw new Error('No cafe ID provided');
      }

      const response = await axios.get(`${API_URL}/cafes/${cafeId}`);
      const cafeData = response.data;
      
      if (!cafeData) {
        throw new Error('No cafe data received');
      }

      setCafe(cafeData);
      if (Array.isArray(cafeData.reviews)) {
        setReviews(cafeData.reviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setError('Error al cargar los detalles del café');
      setCafe(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      if (!cafeId) return;
      
      const { data } = await axios.get(`${API_URL}/reviews?cafeId=${cafeId}`);
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (error) {
      setReviews([]);
    }
  };

  const checkFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !cafeId) return;
      
      const { data } = await axios.get(`${API_URL}/clients/me/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(data)) {
        setIsFavorite(data.some((f: any) => f?._id === cafeId));
      }
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert(
          'Inicio de sesión requerido',
          'Debes iniciar sesión como cliente para agregar favoritos',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login' as never) }
          ]
        );
        return;
      }

      if (!cafeId) return;

      const url = `${API_URL}/clients/me/favorites/${cafeId}`;
      if (isFavorite) {
        await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
        Alert.alert('¡Éxito!', 'Café removido de tus favoritos');
      } else {
        await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
        Alert.alert('¡Éxito!', 'Café agregado a tus favoritos');
      }
      setIsFavorite(!isFavorite);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Solo los clientes registrados pueden agregar favoritos';
      Alert.alert('Error', errorMessage);
    }
  };

  const openMap = async () => {
    try {
      if (!cafe?.location?.lat || !cafe?.location?.lng) {
        Alert.alert('Error', 'Ubicación no disponible');
        return;
      }
      const { lat, lng } = cafe.location;
      const url = `https://maps.google.com/?q=${lat},${lng}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir el mapa');
      }
    } catch (error) {
      Alert.alert('Error', 'No se puede abrir el mapa');
    }
  };

  const openImageGallery = (index: number) => {
    try {
      const gallery = (cafe as any)?.gallery ?? [];
      if (!gallery || gallery.length === 0) {
        Alert.alert('Error', 'No hay imágenes para mostrar');
        return;
      }
      
      if (index < 0 || index >= gallery.length) {
        setSelectedImageIndex(0);
      } else {
        setSelectedImageIndex(index);
      }
      
      setShowImageModal(true);
    } catch (error) {
    }
  };

  const schedule = (cafe as any)?.schedule;
  const gallery: string[] = (cafe as any)?.gallery ?? [];
  const categories: { _id: string; name: string }[] = (cafe as any)?.categories ?? [];

  const renderStars = (rating: number) => {
    try {
      const icons = [];
      const safeRating = Math.max(0, Math.min(5, rating || 0)); 
      const full = Math.floor(safeRating);
      const half = safeRating % 1 >= 0.5;

      for (let i = 0; i < full; i++) {
        icons.push(<Ionicons key={`full-${i}`} name="star" size={16} color="#FFD700" />);
      }
      if (half) {
        icons.push(<Ionicons key="half" name="star-half" size={16} color="#FFD700" />);
      }
      for (let i = 0; i < 5 - full - (half ? 1 : 0); i++) {
        icons.push(<Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#DDD" />);
      }
      return <View style={styles.starsContainer}>{icons}</View>;
    } catch (error) {
      return <View style={styles.starsContainer}></View>;
    }
  };

  const formatSchedule = (s: any) => {
    if (!s || typeof s !== 'object') return [];
    
    const daysMapping = [
      { key: 'lunes', label: 'Lunes' },
      { key: 'martes', label: 'Martes' },
      { key: 'miércoles', label: 'Miércoles' },
      { key: 'jueves', label: 'Jueves' },
      { key: 'viernes', label: 'Viernes' },
      { key: 'sábado', label: 'Sábado' },
      { key: 'domingo', label: 'Domingo' }
    ];

    return daysMapping.map(({ key, label }) => {
      try {
        const dayData = s[key];
        let hours = 'Cerrado';

        if (dayData && !dayData.isClosed && dayData.open && dayData.close) {
          hours = `${dayData.open} - ${dayData.close}`;
        }

        return {
          day: label,
          hours,
          key: `schedule-${key}`,
          isOpen: dayData && !dayData.isClosed && dayData.open && dayData.close
        };
      } catch (error) {
        return {
          day: label,
          hours: 'Cerrado',
          key: `schedule-${key}`,
          isOpen: false
        };
      }
    });
  };

  const renderGalleryItem = ({ item, index }: { item: string; index: number }) => {
    if (!item || typeof item !== 'string') {
      return null;
    }
    
    return (
      <SafeImage
        source={{ uri: item }}
        style={styles.galleryImage}
        onPress={() => openImageGallery(index)}
      />
    );
  };

  const renderImageModalContent = () => {
    if (!gallery || gallery.length === 0) {
      return (
        <View style={styles.modalImageContainer}>
          <Text style={{ color: 'white', textAlign: 'center' }}>No hay imágenes disponibles</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={gallery}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={selectedImageIndex}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        keyExtractor={(item, index) => `gallery-modal-${index}`}
        renderItem={({ item }) => {
          if (!item || typeof item !== 'string') {
            return (
              <View style={styles.modalImageContainer}>
                <Text style={{ color: 'white', textAlign: 'center' }}>Imagen no disponible</Text>
              </View>
            );
          }
          
          return (
            <View style={styles.modalImageContainer}>
              <SafeImage 
                source={{ uri: item }} 
                style={styles.modalImage} 
                resizeMode="contain" 
              />
            </View>
          );
        }}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#301b0f" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (error || !cafe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error || 'Café no encontrado'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#301b0f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{cafe?.name || 'Café'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.iconBtn}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color="#e74c3c" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                await Share.share({ 
                  message: `Echa un vistazo a ${cafe?.name || 'este café'}: https://delatte.app/cafes/${cafeId}` 
                });
              } catch (error) {
              }
            }}
            style={styles.iconBtn}>
            <Ionicons name="share-outline" size={24} color="#301b0f" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {gallery && gallery.length > 0 && (
          <FlatList
            data={gallery.filter(item => item && typeof item === 'string')}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderGalleryItem}
            keyExtractor={(item, index) => `gallery-${index}`}
            contentContainerStyle={styles.galleryContainer}
          />
        )}

        <View style={styles.cafeInfo}>
          <Text style={styles.cafeName}>{cafe?.name || 'Café'}</Text>
          <Text style={styles.location}>{cafe?.address || 'Dirección no disponible'}</Text>

          <View style={styles.ratingContainer}>
            {renderStars(cafe?.averageRating || 0)}
            <Text style={styles.ratingText}>
              {(cafe?.averageRating || 0).toFixed(1)} ({reviews?.length || 0} reseñas)
            </Text>
          </View>

          {cafe?.description && typeof cafe.description === 'string' && (
            <Text style={styles.description}>{cafe.description}</Text>
          )}

          {categories && Array.isArray(categories) && categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {categories.filter(cat => cat && cat.name).map((cat, index) => (
                <View key={`category-${cat._id || index}`} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{cat.name}</Text>
                </View>
              ))}
            </View>
          )}

          {schedule && typeof schedule === 'object' && (
            <View style={styles.scheduleContainer}>
              <Text style={styles.scheduleTitle}>Horarios:</Text>
              {formatSchedule(schedule).map(({ day, hours, key, isOpen }) => (
                <View key={key} style={styles.scheduleRow}>
                  <Text style={[styles.scheduleDay, isOpen && styles.openDay]}>{day}:</Text>
                  <Text style={[styles.scheduleHours, isOpen && styles.openHours]}>{hours}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={openMap} style={styles.mapButton}>
            <Ionicons name="map-outline" size={20} color="#fff" />
            <Text style={styles.mapButtonText}>Ver en Maps</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowReviewForm(true)} style={styles.reviewButton}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.reviewButtonText}>Escribir Reseña</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Reseñas ({reviews?.length || 0})</Text>
          {!reviews || reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>Todavía no hay reseñas</Text>
          ) : (
            reviews.filter(rev => rev && typeof rev === 'object').map((rev, idx) => (
              <View key={rev._id || `review-${idx}`} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Ionicons name="person-circle" size={32} color="#888" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.reviewName}>
                      {rev.clientId?.firstName || 'Usuario'} {rev.clientId?.lastName || ''}
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                      {renderStars(rev.rating || 0)}
                    </View>
                  </View>
                </View>
                {rev.comment && typeof rev.comment === 'string' && (
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal 
        visible={showImageModal} 
        transparent={true} 
        animationType="slide" 
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          {renderImageModalContent()}
          <TouchableOpacity 
            onPress={() => setShowImageModal(false)} 
            style={styles.modalCloseButton}
          >
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      <ReviewFormModal 
        visible={showReviewForm} 
        cafeId={cafeId} 
        onClose={() => setShowReviewForm(false)} 
        onSuccess={fetchReviews} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#301b0f',
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#301b0f',
    marginVertical: 16,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  rating: {
    fontSize: 18,
    fontWeight: '600',
    color: '#301b0f',
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#301b0f',
    marginBottom: 8,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#301b0f',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 50,
    marginHorizontal: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  galleryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  galleryItem: {
    marginRight: 10,
  },
  galleryImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    width: Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalCloseButton: {
    marginTop: 20,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    position: 'absolute',
    right: 16,
    top: 12,
  },
  iconBtn: {
    marginLeft: 12,
  },
  cafeInfo: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  cafeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#301b0f',
  },
  location: {
    fontSize: 16,
    color: '#777',
    marginVertical: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  scheduleContainer: {
    marginVertical: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#301b0f',
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
    paddingVertical: 2,
  },
  scheduleDay: {
    fontSize: 14,
    color: '#666',
  },
  scheduleHours: {
    fontSize: 14,
    color: '#666',
  },
  openDay: {
    color: '#27ae60',
    fontWeight: '500',
  },
  openHours: {
    color: '#27ae60',
    fontWeight: '500',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#301b0f',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  mapButtonText: {
    color: '#fff',
    marginLeft: 8,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e67e22',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  reviewButtonText: {
    color: '#fff',
    marginLeft: 8,
  },
  reviewsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  reviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#301b0f',
  },
  reviewComment: {
    fontSize: 15,
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
  },
  imageLoader: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default CafeDetails;