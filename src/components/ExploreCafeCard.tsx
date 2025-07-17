import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cafe } from '../types/navigation';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import defaultCafe from '../assets/default-cafe.jpg';

const renderStars = (averageRating = 0) => {
  const full = Math.floor(averageRating);
  const half = averageRating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const stars = [];
  for (let i = 0; i < full; i++) {
    stars.push(<Ionicons key={`full-${i}`} name="star" size={14} color="#FFD700" />);
  }
  if (half) {
    stars.push(<Ionicons key="half" name="star-half" size={14} color="#FFD700" />);
  }
  for (let i = 0; i < empty; i++) {
    stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#ccc" />);
  }
  return <View style={styles.starsRow}>{stars}</View>;
};

const ExploreCafeCard = ({ cafe }: { cafe: Cafe }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('CafeDetails', { cafeId: cafe._id })}
      style={styles.card}
      activeOpacity={0.8}
    >
      <Image
        source={
          cafe.coverImage
            ? { uri: cafe.coverImage }
            : defaultCafe
        }
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{cafe.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{cafe.description}</Text>
        <View style={styles.ratingContainer}>
          {renderStars(cafe.averageRating)}
          <Text style={styles.ratingText}>
            {cafe.averageRating?.toFixed(1) ?? '0.0'}{cafe.reviewsCount ? ` (${cafe.reviewsCount})` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 140,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#301b0f',
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#96613B',
    marginLeft: 4,
  },
});

export default ExploreCafeCard;