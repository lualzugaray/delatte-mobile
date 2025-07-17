import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch
} from 'react-native';
import { ExploreFilters } from '../types/navigation';

interface Props {
    currentFilters: ExploreFilters;
    onApply: (filters: ExploreFilters) => void;
    onClose: () => void;
  }
  
const ExploreFiltersModal: React.FC<Props> = ({ currentFilters, onApply, onClose }) => {
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>(currentFilters.selectedCategorias || []);
  const [ratingMin, setRatingMin] = useState<number>(currentFilters.ratingMin || 0);
  const [openNow, setOpenNow] = useState<boolean>(currentFilters.openNow || false);

  const toggleCategoria = (cat: string) => {
    setSelectedCategorias((prev: string[]) =>
      prev.includes(cat) ? prev.filter((c: string) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <ScrollView style={styles.modal}>
      <Text style={styles.title}>Filtros</Text>

      <Text style={styles.label}>Categorías:</Text>
      <View style={styles.tagsContainer}>
        {['Romántico', 'Silencioso', 'Nómade', 'Pet Friendly'].map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => toggleCategoria(cat)}
            style={[
              styles.tag,
              selectedCategorias.includes(cat) && styles.tagSelected,
            ]}
          >
            <Text style={selectedCategorias.includes(cat) ? styles.tagTextSelected : styles.tagText}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Rating mínimo: {ratingMin}⭐</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setRatingMin(star)}>
            <Text style={star <= ratingMin ? styles.starFilled : styles.star}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Solo abiertos ahora</Text>
        <Switch value={openNow} onValueChange={setOpenNow} />
      </View>

      <TouchableOpacity style={styles.applyBtn} onPress={() => onApply({ selectedCategorias, ratingMin, openNow })}>
        <Text style={styles.applyText}>Aplicar filtros</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose}>
        <Text style={styles.closeText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  modal: { padding: 20, marginTop: 100, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20, color: '#301b0f' },
  label: { fontSize: 16, marginTop: 20, marginBottom: 8, color: '#301b0f' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderWidth: 1,
    borderColor: '#301b0f',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tagSelected: {
    backgroundColor: '#301b0f',
  },
  tagText: {
    color: '#301b0f',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  stars: { flexDirection: 'row', marginTop: 10 },
  star: { fontSize: 24, color: '#ccc' },
  starFilled: { fontSize: 24, color: '#301b0f' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 24,
  },
  applyBtn: {
    backgroundColor: '#301b0f',
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
  },
  applyText: { color: '#fff', fontWeight: '600' },
  closeText: {
    textAlign: 'center',
    color: '#7a7a7a',
    fontSize: 14,
    marginTop: 10,
  },
});

export default ExploreFiltersModal;
