// @ts-nocheck
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen        from '../screens/LoginScreen';
import RegisterScreen     from '../screens/RegisterScreen';
import RegisterCafeScreen from '../screens/RegisterCafeScreen';
import CafeDetails from '../screens/CafeDetails';
import MainTabs            from './AppTabs';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"        component={LoginScreen}        />
      <Stack.Screen name="Register"     component={RegisterScreen}     />
      <Stack.Screen name="RegisterCafe" component={RegisterCafeScreen} />
      <Stack.Screen name="AppTabs" component={MainTabs}           />
      <Stack.Screen name="CafeDetails"  component={CafeDetails}  />
    </Stack.Navigator>
  );
}
