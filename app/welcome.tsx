
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, textStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background with subtle pattern overlay */}
      <LinearGradient
        colors={['#0D0D0D', '#1A1A1A', '#0D0D0D']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Afrocentric pattern overlay */}
      <View style={styles.patternOverlay} />

      <View style={styles.content}>
        {/* Gold accent line */}
        <View style={styles.accentLine} />

        {/* App Title - Using new typography system */}
        <View style={styles.brandSection}>
          <Text style={styles.brandTitle}>JAMBALAYA × JERK × JOLLOF</Text>
          <View style={styles.goldUnderline} />
          <Text style={styles.brandTagline}>
            Discover the flavors of the Black diaspora
          </Text>
          <Text style={styles.brandSubtagline}>
            African American • Caribbean • African
          </Text>
        </View>

        {/* Icon with gold glow */}
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow}>
            <IconSymbol
              ios_icon_name="fork.knife"
              android_material_icon_name="restaurant"
              size={80}
              color={colors.gold}
            />
          </View>
        </View>

        {/* Role Selection Buttons */}
        <View style={styles.roleSection}>
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => router.push('/auth/customer-auth')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.gold, '#B8941F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <IconSymbol
                ios_icon_name="fork.knife.circle.fill"
                android_material_icon_name="restaurant-menu"
                size={28}
                color="#0D0D0D"
              />
              <Text style={styles.roleButtonText}>I&apos;M HERE TO EAT</Text>
              <IconSymbol
                ios_icon_name="arrow.right"
                android_material_icon_name="arrow-forward"
                size={24}
                color="#0D0D0D"
              />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleButtonSecondary}
            onPress={() => router.push('/auth/vendor-auth')}
            activeOpacity={0.9}
          >
            <View style={styles.buttonSecondaryContent}>
              <IconSymbol
                ios_icon_name="storefront.fill"
                android_material_icon_name="store"
                size={28}
                color={colors.gold}
              />
              <Text style={styles.roleButtonTextSecondary}>I&apos;M A VENDOR</Text>
              <IconSymbol
                ios_icon_name="arrow.right"
                android_material_icon_name="arrow-forward"
                size={24}
                color={colors.gold}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom accent */}
        <View style={styles.bottomAccent}>
          <View style={styles.accentDot} />
          <View style={[styles.accentDot, { backgroundColor: colors.red }]} />
          <View style={[styles.accentDot, { backgroundColor: colors.green }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
    justifyContent: 'space-between',
  },
  accentLine: {
    width: 60,
    height: 4,
    backgroundColor: colors.gold,
    alignSelf: 'center',
    borderRadius: 2,
  },
  brandSection: {
    alignItems: 'center',
  },
  brandTitle: {
    // Using Montserrat ExtraBold for strong, geometric headline
    ...typography.h1,
    fontSize: 28,
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  goldUnderline: {
    width: 120,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: 16,
  },
  brandTagline: {
    // Using Poppins Medium for smooth, readable UI text
    ...typography.h6,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  brandSubtagline: {
    // Using Poppins Light for subtle caption
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    boxShadow: '0px 0px 40px rgba(212, 175, 55, 0.2)',
  },
  roleSection: {
    gap: 16,
  },
  roleButton: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  roleButtonText: {
    // Using Poppins SemiBold for button text
    ...typography.button,
    flex: 1,
    fontSize: 16,
    color: '#0D0D0D',
    marginLeft: 16,
  },
  roleButtonSecondary: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    boxShadow: '0px 4px 16px rgba(212, 175, 55, 0.15)',
    elevation: 4,
  },
  buttonSecondaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  roleButtonTextSecondary: {
    // Using Poppins SemiBold for button text
    ...typography.button,
    flex: 1,
    fontSize: 16,
    color: colors.gold,
    marginLeft: 16,
  },
  bottomAccent: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
});
