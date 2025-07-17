import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface Cafe {
    _id: string;
    name: string;
    description: string;
    coverImage?: string;
    averageRating?: number;
}

interface Props {
    cafe: Cafe;
    onToggleFavorite: () => void;
}

const FavoriteCafeCard: React.FC<Props> = ({ cafe, onToggleFavorite }) => {
    return (
        <View style={styles.card}>
            <Image
                source={{ uri: cafe.coverImage || 'https://placehold.co/300x200' }}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={styles.title}>{cafe.name}</Text>
                <Text numberOfLines={2} style={styles.description}>{cafe.description}</Text>
                <View style={styles.actions}>
                    <Text>{(cafe.averageRating || 0).toFixed(1)} ⭐</Text>
                    <TouchableOpacity onPress={onToggleFavorite}>
                        <Text style={styles.removeText}>Quitar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 2,
    },
    image: {
        width: 100,
        height: 80,
    },
    info: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-between',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#555',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    removeText: {
        color: '#8B4513',
        fontWeight: 'bold',
    },
});

export default FavoriteCafeCard;
