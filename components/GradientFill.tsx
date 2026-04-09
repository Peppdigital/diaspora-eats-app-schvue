import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientFillProps {
  borderRadius?: number;
}

/**
 * Renders the app's signature gold gradient + white gloss sheen as an
 * absolute-fill background. Drop inside any TouchableOpacity / Pressable
 * to give it the same 3D gradient feel as the FAB button.
 *
 * The container does NOT need overflow:'hidden' — the borderRadius on each
 * gradient layer clips it natively.
 */
export function GradientFill({ borderRadius = 12 }: GradientFillProps) {
  const style = [StyleSheet.absoluteFillObject, { borderRadius }] as const;
  return (
    <>
      <LinearGradient
        colors={['#F5D67A', '#D4AF37', '#9C7C1A']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={style}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={style}
      />
    </>
  );
}
