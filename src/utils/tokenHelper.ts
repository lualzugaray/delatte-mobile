import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user');
    
    if (token) {
      try {
        const testRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (testRes.ok) {
          const userData = await testRes.json();
        } else {
          const errorText = await testRes.text();
        }
      } catch (testError) {
      }
    }
    
    if (user) {
      try {
        const userData = JSON.parse(user);
      } catch (parseError) {
      }
    }
    
    return { token, user };
  } catch (error) {
    return null;
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  } catch (error) {
  }
};