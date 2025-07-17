import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const u = JSON.parse(raw); setRole(u.role);
    });
  }, []);
  if (role === null) return null;

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"    component={HomeScreen}    options={{ title: 'Inicio'   }} />
      <Tab.Screen name="Explore" component={ExploreStack} options={{ title: 'Explorar' }} />
      <Tab.Screen name="Map"     component={MapScreen}     options={{ title: 'Mapa'     }} />

      {role === 'client'  && <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />}
      {role === 'manager' && <Tab.Screen name="MyCafe"  component={MyCafeScreen}  options={{ title: 'Mi Cafetería'}} />}
    </Tab.Navigator>
  );
}
