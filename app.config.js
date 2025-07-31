export default {
  expo: {
    name: 'delatte-mobile',
    slug: 'delatte-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    platforms: ['ios', 'android'], 
    icon: './src/assets/icon.png',
    scheme: 'delatte',
    updates: {
      url: 'https://u.expo.dev/c7705c53-d3e0-4d4a-9fc5-67863529c818'
    },
    runtimeVersion: '1.0.0',
    splash: {
      image: './src/assets/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      bundleIdentifier: 'com.delatte.mobile',
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false, 
        NSPhotoLibraryUsageDescription: 'La app necesita acceso a tus fotos para subir imágenes del café.',
        NSCameraUsageDescription: 'La app necesita acceso a tu cámara para tomar fotos del café.',
        NSLocationWhenInUseUsageDescription: 'La app necesita acceso a tu ubicación para ayudarte a registrar la dirección de tu cafetería.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'La app necesita acceso a tu ubicación para ayudarte a registrar la dirección de tu cafetería.'
      }
    },
    android: {
      package: 'com.delatte.mobile',
      adaptiveIcon: {
        foregroundImage: './src/assets/icon-delatte.png',
        backgroundColor: '#ffffff'
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY
        }
      },
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION'
      ]
    },
    web: {
      bundler: 'metro'
    },
    plugins: [
      'expo-font',
      'expo-secure-store',
      [
        'expo-image-picker',
        {
          photosPermission: 'La app necesita acceso a tus fotos para subir imágenes del café.',
          cameraPermission: 'La app necesita acceso a tu cámara para tomar fotos del café.'
        }
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'La app necesita acceso a tu ubicación para ayudarte a registrar la dirección de tu cafetería.',
          isAndroidBackgroundLocationEnabled: false
        }
      ],
    ],
    extra: {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_AUTH0_DOMAIN: process.env.EXPO_PUBLIC_AUTH0_DOMAIN,
      EXPO_PUBLIC_AUTH0_CLIENT_ID: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
      EXPO_PUBLIC_AUTH0_AUDIENCE: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
      EXPO_PUBLIC_GOOGLE_MAPS_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
      EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      eas: {
        projectId: 'c7705c53-d3e0-4d4a-9fc5-67863529c818'
      }
    }
  }
};