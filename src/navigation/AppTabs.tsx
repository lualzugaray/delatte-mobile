// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import HomeScreen   from '../screens/HomeScreen';
import ExploreStack from './ExploreStackNavigator';
import MapScreen    from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyCafeScreen from '../screens/MyCafeScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const [role, setRole] = useState<'client'|'manager'|null>(null);
  
  useEffect(() => {
    AsyncStorage.getItem('user').then(raw => {
      if (!raw) return setRole('client');
      const u = JSON.parse(raw); 
      setRole(u.role);
    });
  }, []);
  
  if (role === null) return null;

  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          // Definir íconos para cada tab
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Explore':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'MyCafe':
              iconName = focused ? 'storefront' : 'storefront-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#301b0f',        // Color café oscuro cuando está activo
        tabBarInactiveTintColor: '#7a7a7a',     // Color gris cuando está inactivo
        tabBarStyle: {
          backgroundColor: '#ffffff',           // Fondo blanco
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          height: Platform.OS === 'ios' ? 85 : 65,
          elevation: 8,                         // Sombra en Android
          shadowColor: '#000',                  // Sombra en iOS
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        // Animación suave al cambiar tabs
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Inicio',
          tabBarBadge: undefined, // Puedes agregar badges aquí si necesitas
        }} 
      />
      
      <Tab.Screen 
        name="Explore" 
        component={ExploreStack} 
        options={{ 
          title: 'Explorar',
        }} 
      />
      
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ 
          title: 'Mapa',
        }} 
      />

      {role === 'client' && (
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ 
            title: 'Perfil',
          }} 
        />
      )}
      
      {role === 'manager' && (
        <Tab.Screen 
          name="MyCafe" 
          component={MyCafeScreen} 
          options={{ 
            title: 'Mi Cafetería',
          }} 
        />
      )}
    </Tab.Navigator>
  );
}