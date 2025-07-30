import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { CommonActions } from '@react-navigation/native';

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleClick = async (name: string) => {
    try {
      // Validar que tenemos un nombre válido
      if (!name || typeof name !== 'string' || !name.trim()) {
        return;
      }

      // Limpiar filtros previos de manera segura
      try {
        await AsyncStorage.removeItem("delatteFilters");
      } catch (storageError) {
        // Silently fail on storage error
      }

      // Intentar navegación principal
      try {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'Explore',
            params: {
              screen: 'ExploreList',
              params: { q: name.trim() },
            }
          })
        );
      } catch (navError) {
        // Fallback: navegación simple
        try {
          (navigation as any).navigate('Explore', {
            screen: 'ExploreList',
            params: { q: name.trim() },
          });
        } catch (fallbackError) {
          // Último fallback: solo Explore
          try {
            (navigation as any).navigate('Explore');
          } catch (finalError) {
            // Silently fail if all navigation attempts fail
          }
        }
      }
    } catch (error) {
      // En caso de cualquier error, silently fail
    }
  };

  // Validar categories de manera defensiva
  const validCategories = Array.isArray(categories) ? categories : STATIC_CATEGORIES;
  const safeCategories = validCategories.filter(cat => 
    cat && 
    typeof cat === 'object' && 
    cat.name && 
    typeof cat.name === 'string'
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>categorías rápidas</Text>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      >
        {safeCategories.map((cat, index) => {
          return (
            <TouchableOpacity
              key={`${cat.name}-${index}`}
              style={styles.categoryCard}
              onPress={() => handleClick(cat.name)}
              activeOpacity={0.8}
            >
              <View style={styles.categoryImageWrapper}>
                <Text style={styles.categoryEmoji}>
                  {cat.image || '📦'}
                </Text>
              </View>
              <Text style={styles.categoryName}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
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