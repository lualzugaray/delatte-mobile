// src/screens/RegisterCafeStepper.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '../hooks/useNavigation';

const RegisterCafeStepper = () => {
  const navigation = useNavigation();

  const handleSkipForNow = () => {
    // Por ahora, llevamos al dashboard
    navigation.navigate('ManagerDashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Registrar tu cafetería</Text>
        <Text style={styles.subtitle}>
          Configuremos la información de tu café paso a paso
        </Text>
        
        <Text style={styles.description}>
          Aquí implementaremos el flujo completo de registro de cafetería:
          {'\n\n'}• Información básica
          {'\n'}• Horarios
          {'\n'}• Imágenes
          {'\n'}• Categorías
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSkipForNow}
        >
          <Text style={styles.buttonText}>Continuar (temporal)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#301b0f',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#7a7a7a',
    textAlign: 'center',
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: '#7a7a7a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#301b0f',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterCafeStepper;