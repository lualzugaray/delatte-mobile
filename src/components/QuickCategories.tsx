import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
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
      if (!name || typeof name !== 'string' || !name.trim()) {
        return;
      }

      try {
        await AsyncStorage.removeItem("delatteFilters");
      } catch (storageError) {
      }

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
        try {
          (navigation as any).navigate('Explore', {
            screen: 'ExploreList',
            params: { q: name.trim() },
          });
        } catch (fallbackError) {
          try {
            (navigation as any).navigate('Explore');
          } catch (finalError) {
          }
        }
      }
    } catch (error) {
    }
  };

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
        style={styles.scrollContainer}
      >
        {safeCategories.map((cat, index) => {
          return (
            <TouchableOpacity
              key={`${cat.name}-${index}`}
              style={styles.categoryCard}
              onPress={() => handleClick(cat.name)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryImageWrapper}>
                <Text style={styles.categoryEmoji}>
                  {cat.image || '📦'}
                </Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.categoryName} numberOfLines={2}>
                  {cat.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#301b0f',
    marginBottom: 16,
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  scrollContainer: {
  },
  categoriesList: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingVertical: 4,
  },
  categoryCard: {
    padding: 14,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(172, 120, 81, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 95,
    minHeight: 120,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  categoryImageWrapper: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(172, 120, 81, 0.15)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    ...Platform.select({
      android: {
        elevation: 1,
      },
    }),
  },
  categoryEmoji: {
    fontSize: 22,
    ...Platform.select({
      android: {
        textAlignVertical: 'center',
        includeFontPadding: false,
      },
    }),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#301b0f',
    textAlign: 'center',
    lineHeight: 14,
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif-medium',
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
});

export default QuickCategories;