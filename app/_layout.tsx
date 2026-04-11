
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';

SystemUI.setBackgroundColorAsync('#0D0D0D');
import {
  Montserrat_800ExtraBold,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_300Light,
} from '@expo-google-fonts/poppins';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Montserrat fonts for headlines
    'Montserrat-ExtraBold': Montserrat_800ExtraBold,
    'Montserrat-Bold': Montserrat_700Bold,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    
    // Poppins fonts for body and UI
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Light': Poppins_300Light,
    
    // Keep SpaceMono for backwards compatibility
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0D0D0D' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="auth/customer-auth" />
          <Stack.Screen name="auth/location-setup" />
          <Stack.Screen name="auth/vendor-auth" />
          <Stack.Screen name="vendor-dashboard" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="menu-item-detail" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="order-status" />
          <Stack.Screen name="favorites" />
          <Stack.Screen name="auth-popup" />
          <Stack.Screen name="auth-callback" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="formsheet" options={{ presentation: 'formSheet' }} />
          <Stack.Screen name="transparent-modal" options={{ presentation: 'transparentModal' }} />
          <Stack.Screen name="manage-addresses" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="vendor-detail" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
