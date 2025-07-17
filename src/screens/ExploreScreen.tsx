import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, FlatList, ActivityIndicator, Modal
} from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import { normalizeText } from '../utils/text';
import EmptyExplore from '../components/EmptyExplore';
import ExploreFiltersModal from '../components/ExploreFiltersModal';
import ExploreCafeCard from '../components/ExploreCafeCard';
import { Cafe, ExploreFilters } from '../types/navigation';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';

const API_URL = Constants.expoConfig!.extra!.EXPO_PUBLIC_API_URL;

type ExploreStackParamList = {
    ExploreList: {
        category?: string;
        q?: string;
    };
    CafeDetails: {
        cafeId: string;
    };
};

const ExploreScreen = () => {
    type ExploreRouteProp = RouteProp<ExploreStackParamList, 'ExploreList'>;
    const navigation = useNavigation();
    const route = useRoute<ExploreRouteProp>();

    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ExploreFilters>({});
    const [cafes, setCafes] = useState<Cafe[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const newQueryParam = route.params?.q || '';

            if (newQueryParam) {
                setSearch(newQueryParam);
                setSearchQuery(newQueryParam);
                setFilters({});
                setPage(0);
                setCafes([]);
            }
        }, [route.params?.q])
    );

    const limit = 10;

    const buildQuery = useCallback((currentPage: number) => {
        const params = new URLSearchParams();
        if (filters.selectedCategorias?.length) params.append("categories", filters.selectedCategorias.join(","));
        if (filters.ratingMin !== undefined) params.append("ratingMin", String(filters.ratingMin));
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.openNow) params.append("openNow", "true");
        if (searchQuery) {
            const normalizedQuery = normalizeText(searchQuery);
            params.append("q", normalizedQuery);
        }
        params.append("limit", String(limit));
        params.append("skip", String(currentPage * limit));
        return params.toString();
    }, [filters, searchQuery]);

    const fetchCafes = useCallback(async (currentPage: number, reset: boolean = false) => {
        setLoading(true);
        try {
            const query = buildQuery(currentPage);
            const res = await axios.get(`${API_URL}/cafes?${query}`);
            const newCafes = Array.isArray(res.data) ? res.data : [];

            setCafes(prev => reset ? newCafes : [...prev, ...newCafes]);
            setHasMore(newCafes.length === limit);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [buildQuery]);

    useEffect(() => {
        setPage(0);
        fetchCafes(0, true);
    }, [filters, searchQuery, fetchCafes]);

    useEffect(() => {
        if (page > 0) {
            fetchCafes(page, false);
        }
    }, [page, fetchCafes]);

    const handleSearchSubmit = () => {
        setSearchQuery(search);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Explorar Cafés</Text>
            </View>

            <View style={{ padding: 10, backgroundColor: '#f0f0f0' }}>
                <Text style={{ fontSize: 10 }}>Debug - Query: {searchQuery} | Search: {search}</Text>
                <Text style={{ fontSize: 10 }}>Filters: {JSON.stringify(filters)}</Text>
            </View>
            x
            <View style={styles.searchBar}>
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="romántico, silencioso, calidad/precio..."
                    style={styles.input}
                    returnKeyType="search"
                    onSubmitEditing={handleSearchSubmit}
                />
                <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
                    <Text style={styles.filterText}>Filtros ⚙️</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showFilters} animationType="slide">
                <ExploreFiltersModal
                    currentFilters={filters}
                    onApply={(f) => {
                        setFilters(f);
                        setShowFilters(false);
                    }}
                    onClose={() => setShowFilters(false)}
                />
            </Modal>

            {loading && page === 0 ? (
                <ActivityIndicator size="large" color="#301b0f" style={{ marginTop: 40 }} />
            ) : cafes.length === 0 && !loading ? (
                <EmptyExplore search={searchQuery} filters={filters} />
            ) : (
                <FlatList
                    data={cafes}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <ExploreCafeCard cafe={item} />}
                    contentContainerStyle={styles.listContainer}
                    onEndReached={() => {
                        if (hasMore && !loading) {
                            setPage(prev => prev + 1);
                        }
                    }}
                    onEndReachedThreshold={0.8}
                    ListFooterComponent={
                        loading && page > 0 ? (
                            <ActivityIndicator size="small" color="#301b0f" style={{ marginVertical: 16 }} />
                        ) : hasMore && !loading ? (
                            <TouchableOpacity
                                onPress={() => setPage(prev => prev + 1)}
                                style={styles.moreBtn}
                            >
                                <Text style={styles.moreBtnText}>Ver más resultados</Text>
                            </TouchableOpacity>
                        ) : null
                    }
                />
            )}
        </View>
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
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#301b0f',
        textAlign: 'center',
    },
    searchBar: {
        flexDirection: 'column',
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    input: {
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 8,
        fontSize: 16,
        color: '#333',
        minHeight: 44,
    },
    filterButton: {
        backgroundColor: '#301b0f',
        paddingVertical: 10,
        borderRadius: 16,
        alignItems: 'center',
    },
    filterText: {
        color: '#fff',
        fontWeight: '600',
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    moreBtn: {
        marginVertical: 16,
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#eee',
        borderRadius: 12,
    },
    moreBtnText: {
        fontWeight: '600',
        color: '#301b0f',
    },
});

export default ExploreScreen;