import React, { useEffect, useState } from 'react';
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

const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL;

type CafeDetailsRouteProp = RouteProp<RootStackParamList, 'CafeDetails'>;
type CafeDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CafeDetails'>;

const CafeDetails = () => {
  const route = useRoute<CafeDetailsRouteProp>();
  const navigation = useNavigation<CafeDetailsNavigationProp>();
  const { cafeId } = route.params;
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [cafe, setCafe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    fetchCafeDetails();
  }, [cafeId]);

  const fetchCafeDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/cafes/${cafeId}`);
      const cafeData = response.data;
      setCafe(cafeData);
      if (Array.isArray(cafeData.reviews)) {
        setReviews(cafeData.reviews);
      }
    } catch (err) {
      setError('Error al cargar los detalles del café');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/reviews?cafeId=${cafeId}`);
      setReviews(data);
    } catch (error) {
      console.error(error);
    }
  };

  const checkFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const { data } = await axios.get(`${API_URL}/clients/me/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFavorite(data.some((f: any) => f._id === cafeId));
    } catch { }
  };

  const toggleFavorite = async () => {
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

    try {
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
      const errorMessage = error.response?.data?.message || 'Solo los clientes registrados pueden agregar favoritos';
      Alert.alert('Error', errorMessage);
    }
  };

  const openMap = () => {
    if (!cafe?.location) return;
    const { lat, lng } = cafe.location;
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  };

  const openImageGallery = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const schedule = (cafe as any)?.schedule;
  const gallery: string[] = (cafe as any)?.gallery ?? [];
  const categories: { _id: string; name: string }[] = (cafe as any)?.categories ?? [];

  const isOpenNow = () => {
    if (!schedule) return false;
    const now = new Date();
    const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayObj = schedule[keys[now.getDay()]];
    if (!dayObj || dayObj.isClosed || !dayObj.open || !dayObj.close) return false;

    const [oh, om] = dayObj.open.split(':').map(Number);
    const [ch, cm] = dayObj.close.split(':').map(Number);
    const openTime = new Date().setHours(oh, om, 0, 0);
    const closeTime = new Date().setHours(ch, cm, 0, 0);
    const currentTime = now.getTime();

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const renderStars = (rating: number) => {
    const icons = [];
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;

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
  };

  const formatSchedule = (s: any) => {
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
    });
  };


  const renderGalleryItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      onPress={() => openImageGallery(index)}
      style={styles.galleryItem}
    >
      <Image
        source={{ uri: item }}
        style={styles.galleryImage}
        onError={(e) => console.error( e.nativeEvent.error)}
      />
    </TouchableOpacity>
  );

  const renderImageModalContent = () => (
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
      renderItem={({ item }) => (
        <View style={styles.modalImageContainer}>
          <Image source={{ uri: item }} style={styles.modalImage} resizeMode="contain" />
        </View>
      )}
    />
  );


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#301b0f" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#301b0f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{cafe.name}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.iconBtn}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color="#e74c3c" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Share.share({ message: `Echa un vistazo a ${cafe.name}: https://delatte.app/cafes/${cafeId}` })}
            style={styles.iconBtn}>
            <Ionicons name="share-outline" size={24} color="#301b0f" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {gallery.length > 0 && (
          <FlatList
            data={gallery}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderGalleryItem}
            keyExtractor={(item, index) => `gallery-${index}`}
          />
        )}

        <View style={styles.cafeInfo}>
          <Text style={styles.cafeName}>{cafe.name}</Text>
          <Text style={styles.location}>{cafe.address}</Text>

          <View style={styles.ratingContainer}>
            {renderStars(cafe.averageRating)}
            <Text style={styles.ratingText}>{cafe.averageRating?.toFixed(1)} ({reviews.length} reseñas)</Text>
          </View>

          <Text style={styles.description}>{cafe.description}</Text>
x
          <View style={styles.categoriesRow}>
            {categories.map(cat => (
              <View key={cat._id} style={styles.categoryTag}>
                <Text style={styles.categoryText}>{cat.name}</Text>
              </View>
            ))}
          </View>
x
          {schedule && formatSchedule(schedule).map(({ day, hours, key }) => (
            <View key={key} style={styles.scheduleRow}>
              <Text>{day}:</Text>
              <Text>{hours}</Text>
            </View>
          ))}

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
          <Text style={styles.sectionTitle}>Reseñas ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text>Todavía no hay reseñas</Text>
          ) : reviews.map((rev, idx) => (
            <View key={rev._id || `review-${idx}`} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Ionicons name="person-circle" size={32} color="#888" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.reviewName}>
                    {rev.clientId?.firstName} {rev.clientId?.lastName}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {renderStars(rev.rating)}
                  </View>
                </View>
              </View>
              <Text style={styles.reviewComment}>{rev.comment}</Text>
            </View>
          ))}

        </View>

      </ScrollView>

      <Modal visible={showImageModal} transparent={true} animationType="slide" onRequestClose={() => setShowImageModal(false)}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {renderImageModalContent()}
          <TouchableOpacity onPress={() => setShowImageModal(false)} style={{ marginTop: 20 }}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      <ReviewFormModal visible={showReviewForm} cafeId={cafeId} onClose={() => setShowReviewForm(false)} onSuccess={fetchReviews} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#301b0f',
    fontSize: 16,
    fontWeight: '600',
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
  galleryItem: {
    marginRight: 10,
  },
  galleryImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
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
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
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
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
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
  },

});

export default CafeDetails;
