import React, { useState, useRef, useEffect } from 'react';
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
  const [loadingGeocoding, setLoadingGeocoding] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setCoordinates(null);
      onAddressChange(address, { lat: 0, lng: 0 });
      return;
    }

    setLoadingGeocoding(true);
    try {
      const geocodeResult = await Location.geocodeAsync(address);
      
      if (geocodeResult.length > 0) {
        const { latitude, longitude } = geocodeResult[0];
        const coords = { lat: latitude, lng: longitude };
        setCoordinates(coords);
        onAddressChange(address, coords);
      } else {
        Alert.alert(
          'Dirección no encontrada', 
          'No se pudo encontrar esta dirección. Intenta ser más específico o usa tu ubicación actual.',
          [{ text: 'OK' }]
        );
        setCoordinates(null);
        onAddressChange(address, { lat: 0, lng: 0 });
      }
    } catch (error) {
      console.warn('Error en geocoding:', error);
      setCoordinates(null);
      onAddressChange(address, { lat: 0, lng: 0 });
    } finally {
      setLoadingGeocoding(false);
    }
  };

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
        
        const coords = { lat: latitude, lng: longitude };
        setCoordinates(coords);
        onAddressChange(fullAddress, coords);
      } else {
        const coordAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        const coords = { lat: latitude, lng: longitude };
        setCoordinates(coords);
        onAddressChange(coordAddress, coords);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleAddressChange = (text: string) => {
    onAddressChange(text, coordinates || { lat: 0, lng: 0 });
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (text.trim().length > 10) { 
        geocodeAddress(text);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const searchAddress = () => {
    if (value.trim()) {
      geocodeAddress(value);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.addressInput}
          placeholder={placeholder}
          placeholderTextColor="#7a7a7a"
          value={value}
          onChangeText={handleAddressChange}
          multiline
        />
        
        {value.trim().length > 5 && !coordinates && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchAddress}
            disabled={loadingGeocoding}
          >
            {loadingGeocoding ? (
              <ActivityIndicator size="small" color="#AC7851" />
            ) : (
              <Text style={styles.searchIcon}>🔍</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

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

      {loadingGeocoding && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#AC7851" />
          <Text style={styles.loadingText}>Buscando dirección...</Text>
        </View>
      )}

      {coordinates && coordinates.lat !== 0 && (
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesIcon}>✅</Text>
          <Text style={styles.coordinatesText}>
            Ubicación confirmada: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </Text>
        </View>
      )}

      {value.trim() && (!coordinates || coordinates.lat === 0) && !loadingGeocoding && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>
            Dirección no válida. Intenta ser más específico o usa tu ubicación actual.
          </Text>
        </View>
      )}

      <Text style={styles.helpText}>
        Escribe la dirección completa de tu cafetería. Se buscará automáticamente las coordenadas.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  addressInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 14,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  searchButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 34,
    height: 34,
    backgroundColor: '#f8f9fa',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    fontSize: 14,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#7a7a7a',
    marginLeft: 8,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeaa7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  errorIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#d63031',
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