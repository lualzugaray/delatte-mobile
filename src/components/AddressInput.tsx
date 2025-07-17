import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';

interface AddressInputProps {
  value: string;
  onAddressChange: (address: string, coordinates: { lat: number; lng: number }) => void;
  placeholder?: string;
}

const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onAddressChange,
  placeholder = "Dirección completa *"
}) => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu ubicación para encontrar tu cafetería');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const fullAddress = `${address.streetNumber || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
        
        setCoordinates({ lat: latitude, lng: longitude });
        onAddressChange(fullAddress, { lat: latitude, lng: longitude });
      } else {
        const coordAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setCoordinates({ lat: latitude, lng: longitude });
        onAddressChange(coordAddress, { lat: latitude, lng: longitude });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleAddressChange = (text: string) => {
    onAddressChange(text, coordinates || { lat: 0, lng: 0 });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.addressInput}
        placeholder={placeholder}
        placeholderTextColor="#7a7a7a"
        value={value}
        onChangeText={handleAddressChange}
        multiline
      />

      <TouchableOpacity
        style={styles.locationButton}
        onPress={getCurrentLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <ActivityIndicator size="small" color="#AC7851" />
        ) : (
          <>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationButtonText}>Usar mi ubicación actual</Text>
          </>
        )}
      </TouchableOpacity>

      {coordinates && coordinates.lat !== 0 && (
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesIcon}>✅</Text>
          <Text style={styles.coordinatesText}>
            Ubicación confirmada: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </Text>
        </View>
      )}

      <Text style={styles.helpText}>
        Escribe la dirección de tu cafetería o usa tu ubicación actual si estás en el local.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  addressInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#AC7851',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#AC7851',
    fontWeight: '600',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  coordinatesIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#2e7d32',
    flex: 1,
  },
  helpText: {
    fontSize: 12,
    color: '#7a7a7a',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AddressInput;