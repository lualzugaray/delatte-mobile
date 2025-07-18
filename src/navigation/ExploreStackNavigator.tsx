// @ts-nocheck
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ExploreScreen from '../screens/ExploreScreen';
import CafeDetails   from '../screens/CafeDetails';

const Stack = createNativeStackNavigator();

export default function ExploreStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ExploreList"
        component={ExploreScreen}
        options={{ title: 'Explorar' }}
      />
    </Stack.Navigator>
  );
}
