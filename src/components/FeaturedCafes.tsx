import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL;
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

const FeaturedCafes = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [cafes, setCafes] = useState<Cafe[]>([]);

    useEffect(() => {
        const fetchCafes = async () => {
            try {
                const res = await axios.get(`${API_URL}/cafes?sortBy=rating&limit=3`);
                const data = res.data;

                if (Array.isArray(data)) {
                    setCafes(data);
                } else {
                    setCafes([]);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchCafes();
    }, []);

    const renderStars = (averageRating = 0) => {
        const fullStars = Math.floor(averageRating);
        const hasHalfStar = averageRating % 1 >= 0.25 && averageRating % 1 < 0.75;
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
    };

    const handleCafePress = (cafeId: string) => {
        navigation.navigate('CafeDetails', { cafeId });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                <Text style={styles.brownText}>cafeterías</Text> destacadas ★
            </Text>
            <Text style={styles.subtitle}>(las más queridas por la comunidad)</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
                snapToInterval={CARD_WIDTH + 16}
                decelerationRate="fast"
            >
                {cafes.map((cafe) => (
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

                        <Image
                            source={{
                                uri: cafe.coverImage || cafe.gallery?.[0] || 'https://via.placeholder.com/300x200/AC7851/FFFFFF?text=Café'
                            }}
                            style={styles.cafeImage}
                        />

                        <View style={styles.cafeInfo}>
                            <Text style={styles.cafeName} numberOfLines={1}>
                                {cafe.name}
                            </Text>

                            <Text style={styles.cafeDescription} numberOfLines={2}>
                                {cafe.description}
                            </Text>

                            <View style={styles.ratingContainer}>
                                <View style={styles.starsContainer}>
                                    {renderStars(cafe.averageRating)}
                                </View>
                                <Text style={styles.ratingNumber}>
                                    {cafe.averageRating?.toFixed(1) || "0.0"}{" "}
                                    {cafe.reviewsCount > 0 && `(${cafe.reviewsCount})`}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

            </ScrollView>

            {cafes.length === 0 && (
                <Text style={styles.emptyMessage}>Aún no hay cafeterías destacadas cargadas ☕️</Text>
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
    emptyMessage: {
        fontSize: 14,
        color: '#7a7a7a',
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
});

export default FeaturedCafes;