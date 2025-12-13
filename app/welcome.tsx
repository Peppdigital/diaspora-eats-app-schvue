
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary, colors.accent]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          <Text style={styles.brandTitle}>Jambalaya x Jerk x Jollof</Text>
          <Text style={styles.brandTagline}>
            Discover the flavors of the Black diaspora
          </Text>
        </View>

        {/* Illustration or Icon */}
        <View style={styles.iconContainer}>
          <IconSymbol
            ios_icon_name="fork.knife"
            android_material_icon_name="restaurant"
            size={120}
            color="#FFFFFF"
          />
        </View>

        {/* Role Selection */}
        <View style={styles.roleSection}>
          <Text style={styles.roleTitle}>Welcome! How can we help you?</Text>

          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => router.push('/auth/customer-auth')}
            activeOpacity={0.8}
          >
            <View style={styles.roleButtonContent}>
              <IconSymbol
                ios_icon_name="fork.knife.circle.fill"
                android_material_icon_name="restaurant_menu"
                size={32}
                color={colors.primary}
              />
              <View style={styles.roleButtonText}>
                <Text style={styles.roleButtonTitle}>I'm here to EAT</Text>
                <Text style={styles.roleButtonSubtitle}>
                  Discover and order from Black-owned restaurants
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => router.push('/auth/vendor-auth')}
            activeOpacity={0.8}
          >
            <View style={styles.roleButtonContent}>
              <IconSymbol
                ios_icon_name="storefront.fill"
                android_material_icon_name="store"
                size={32}
                color={colors.primary}
              />
              <View style={styles.roleButtonText}>
                <Text style={styles.roleButtonTitle}>I own a restaurant/grocery</Text>
                <Text style={styles.roleButtonSubtitle}>
                  Join our platform and reach more customers
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  roleSection: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  roleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  roleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  roleButtonText: {
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  roleButtonSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
