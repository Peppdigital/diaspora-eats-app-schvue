
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If user is not authenticated, show welcome screen
  if (!user) {
    return <Redirect href="/welcome" />;
  }

  // If user is authenticated, redirect based on role
  if (user.role === 'vendor') {
    return <Redirect href="/vendor-dashboard" />;
  }

  // Default to customer home
  return <Redirect href="/(tabs)/(home)/" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
