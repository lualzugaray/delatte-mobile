import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../hooks/useNavigation';

interface HeaderProps {
  title?: string;
  showLogout?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title,
  showLogout = true 
}) => {
  const navigation = useNavigation();
  const { state, logout } = useAuth();
  const { isLoading, user } = state;
  const isLoggedIn = !!user;

  if (isLoading) return null;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que querés cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },          
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          </View>
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}
        </View>

        <View style={styles.rightSection}>
          {isLoggedIn && showLogout ? (
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#301b0f" />
              <Text style={styles.logoutText}>cerrar sesión</Text>
            </TouchableOpacity>
          ) : !isLoggedIn && showLogout ? (
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>iniciar sesión</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    backgroundColor: '#301b0f',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#301b0f',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(48, 27, 15, 0.1)',
    borderRadius: 20,
  },
  logoutText: {
    fontSize: 12,
    color: '#301b0f',
    fontWeight: '600',
    marginLeft: 4,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#301b0f',
    borderRadius: 20,
  },
  loginText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  logo: {
    width: 80,
    height: 40,
    marginLeft: 8,
  },
});

export default Header;