import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import Constants from 'expo-constants';
import Header from '../components/Header';
import QuickCategories from '../components/QuickCategories';
import FeaturedCafes from '../components/FeaturedCafes';
import CafeMap from '../components/CafeMap';
import { useAuth } from '../context/AuthContext';

const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL;

interface Cafe {
    _id: string;
    name: string;
    location?: {
        lat: number;
        lng: number;
    };
}

const HomeScreen = () => {
    const navigation = useNavigation();
    const [search, setSearch] = useState('');
    const [cafes, setCafes] = useState<Cafe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { state } = useAuth();

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

            const response = await axios.get(`${API_URL}/cafes`);
            
            if (response.data && Array.isArray(response.data)) {
                // Filtrar cafés válidos
                const validCafes = response.data.filter(cafe => 
                    cafe && 
                    typeof cafe === 'object' && 
                    cafe._id && 
                    cafe.name
                );
                setCafes(validCafes);
            } else {
                setCafes([]);
            }
        } catch (error) {
            setError('Error al cargar cafés');
            setCafes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        try {
            if (!search.trim()) return;

            navigation.dispatch(
                CommonActions.navigate({
                    name: 'Explore',
                    params: {
                        screen: 'ExploreList',
                        params: { q: search.trim() }
                    }
                })
            );
        } catch (error) {
            // Navegación fallback
            try {
                navigation.navigate('Explore' as any);
            } catch (fallbackError) {
                // Silently fail
            }
        }
    };

    const handleMapNavigation = () => {
        try {
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'Map'
                })
            );
        } catch (error) {
            // Silently fail
        }
    };

    const retryFetch = () => {
        fetchCafes();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <Header />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.bannerSection}>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>
                            buscando dónde{'\n'}tomar tu cafecito hoy?
                        </Text>
                        <Text style={styles.bannerSubtitle}>
                            te ayudamos a encontrar el lugar perfecto ;)
                        </Text>

                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="romántico, silencioso, calidad/precio..."
                                placeholderTextColor="#7a7a7a"
                                value={search}
                                onChangeText={setSearch}
                                returnKeyType="search"
                                onSubmitEditing={handleSearch}
                            />
                            <TouchableOpacity
                                style={[styles.searchButton, !search.trim() && styles.searchButtonDisabled]}
                                onPress={handleSearch}
                                disabled={!search.trim()}
                            >
                                <Text style={styles.searchButtonText}>buscar 🔍</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.bannerImageContainer}>
                        <Text style={styles.coffeIcon}>☕</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <QuickCategories />
                </View>

                <View style={styles.section}>
                    <FeaturedCafes />
                </View>

                <View style={styles.section}>
                    <View style={styles.mapHeader}>
                        <Text style={styles.sectionTitle}>Cafés cerca de vos</Text>
                        <TouchableOpacity
                            style={styles.viewMapButton}
                            onPress={handleMapNavigation}
                        >
                            <Text style={styles.viewMapText}>Ver mapa completo →</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#301b0f" />
                            <Text style={styles.loadingText}>Cargando mapa...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>❌ {error}</Text>
                            <TouchableOpacity onPress={retryFetch} style={styles.retryButton}>
                                <Text style={styles.retryButtonText}>Reintentar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <CafeMap cafes={cafes} isPreview={true} />
                    )}
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fbfb',
    },
    scrollView: {
        flex: 1,
    },
    bannerSection: {
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: '#fff',
        flexDirection: 'column-reverse',
        alignItems: 'center',
    },
    bannerContent: {
        alignItems: 'center',
        width: '100%',
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#301b0f',
        lineHeight: 28,
        marginBottom: 8,
        textAlign: 'center',
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#7a7a7a',
        marginBottom: 20,
        lineHeight: 20,
        textAlign: 'center',
    },
    searchContainer: {
        width: '100%',
        flexDirection: 'column',
        gap: 8,
    },
    searchInput: {
        width: '100%',
        height: 48,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 999,
        paddingHorizontal: 20,
        fontSize: 15,
        color: '#301b0f',
        textAlignVertical: 'center',
    },
    searchButton: {
        backgroundColor: '#301b0f',
        borderRadius: 999,
        paddingVertical: 10,
        paddingHorizontal: 24,
        alignItems: 'center',
        alignSelf: 'center',
        minWidth: 120,
    },
    searchButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    bannerImageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coffeIcon: {
        fontSize: 60,
        marginBottom: 10,
    },
    beansIcon: {
        fontSize: 40,
    },
    section: {
        paddingVertical: 20,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#301b0f',
    },
    viewMapButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(48, 27, 15, 0.1)',
        borderRadius: 16,
    },
    viewMapText: {
        fontSize: 12,
        color: '#301b0f',
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 20,
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#7a7a7a',
    },
    errorContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default HomeScreen;