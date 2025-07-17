import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExploreFilters } from '../types/navigation';

interface Props {
  search: string;
  filters: ExploreFilters;
}

const EmptyExplore: React.FC<Props> = ({ search, filters }) => {
  const hasFilters = Object.keys(filters).length > 0 || search;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {hasFilters
          ? 'No encontramos cafeterías con ese resultado 😓'
          : '¿Buscando un buen café? ☕'}
      </Text>
      <Text style={styles.subtext}>
        {hasFilters
          ? 'Probá otra palabra o quitá algunos filtros.'
          : 'Usá los filtros para encontrar cafeterías según tus gustos :)'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 60, alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 18, fontWeight: '600', color: '#301b0f', textAlign: 'center' },
  subtext: { fontSize: 14, color: '#7a7a7a', textAlign: 'center', marginTop: 8 },
});

export default EmptyExplore;
