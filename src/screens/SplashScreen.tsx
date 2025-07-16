import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>DELATTE</Text>
      </View>
      <ActivityIndicator size="large" color="#301b0f" />
      <Text style={styles.loadingText}>Cargando...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  logoContainer: {
    width: 160,
    height: 160,
    backgroundColor: '#301b0f',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7a7a7a',
  },
});

export default SplashScreen;