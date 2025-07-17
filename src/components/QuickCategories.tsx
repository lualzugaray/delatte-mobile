import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '../hooks/useNavigation';

const STATIC_CATEGORIES = [
  {
    name: "Café de especialidad",
    image: "☕",
  },
  {
    name: "Espacio tranquilo",
    image: "🤫",
  },
  {
    name: "Espacio para trabajar",
    image: "💻",
  },
  {
    name: "Pet-friendly",
    image: "🐕",
  },
];

interface QuickCategoriesProps {
  categories?: typeof STATIC_CATEGORIES;
}

const QuickCategories: React.FC<QuickCategoriesProps> = ({ 
  categories = STATIC_CATEGORIES 
}) => {
  const navigation = useNavigation();

  const handleClick = async (name: string) => {
    try {
      await AsyncStorage.removeItem("delatteFilters");
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
    navigation.navigate('Explore', {
        screen: 'ExploreList',
        params: { q: name },
      } as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>categorías rápidas</Text>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.name}
            style={styles.categoryCard}
            onPress={() => handleClick(cat.name)}
            activeOpacity={0.8}
          >
            <View style={styles.categoryImageWrapper}>
              <Text style={styles.categoryEmoji}>{cat.image}</Text>
            </View>
            <Text style={styles.categoryName}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryCard: {
    padding: 16,
    marginRight: 16,
    borderRadius: 20,
    shadowColor: '#000',
    backgroundColor: 'rgba(172, 120, 81, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    minWidth: 90,
    width: 90, 
  },
  categoryImageWrapper: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(172, 120, 81, 0.1)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#301b0f',
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
    width: '100%',
  },
});

export default QuickCategories;