// src/navigation/AppNavigator.tsx (SIMPLIFICADO - sin AuthContext complejo)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  // Navegación simple como DelateWeb: solo Login y Register
  // Sin AuthContext complejo, sin estado global complicado
  
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Cuando implementes más pantallas, las agregas aquí */}
        {/* <Stack.Screen name="RegisterCafe" component={RegisterCafeScreen} /> */}
        {/* <Stack.Screen name="Dashboard" component={DashboardScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;