import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { GradientFill } from '@/components/GradientFill';
import { supabase } from '@/app/integrations/supabase/client';
import { LinearGradient } from 'expo-linear-gradient';
import { AppleIcon, GoogleIcon } from '@/components/SocialIcons';

export default function CustomerAuthScreen() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Navigate after auth resolves
  useEffect(() => {
    if (user) {
      console.log('[CustomerAuth] User authenticated, navigating to tabs:', user.email);
      router.replace('/(tabs)/(home)/');
    }
  }, [user]);

  const upsertCustomerProfile = async (userId: string) => {
    console.log('[CustomerAuth] Upserting customer profile for user:', userId);
    const { error: upsertError } = await supabase
      .from('user_profile')
      .upsert({ user_id: userId, role: 'customer' }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (upsertError) {
      console.log('[CustomerAuth] Profile upsert error (non-fatal):', upsertError.message);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (isSignUp) {
      if (!fullName.trim()) { setError('Please enter your full name'); return; }
      if (!email.trim()) { setError('Please enter your email'); return; }
      if (!password) { setError('Please enter a password'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

      console.log('[CustomerAuth] Sign up pressed:', email);
      setLoading(true);
      try {
        await signUpWithEmail(email.trim().toLowerCase(), password, fullName.trim());
        console.log('[CustomerAuth] Sign up success');
        // user_profile upsert happens after user state updates via useEffect
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create account';
        console.log('[CustomerAuth] Sign up error:', msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim()) { setError('Please enter your email'); return; }
      if (!password) { setError('Please enter your password'); return; }

      console.log('[CustomerAuth] Sign in pressed:', email);
      setLoading(true);
      try {
        await signInWithEmail(email.trim().toLowerCase(), password);
        console.log('[CustomerAuth] Sign in success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid email or password';
        console.log('[CustomerAuth] Sign in error:', msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAppleSignIn = async () => {
    console.log('[CustomerAuth] Apple sign-in pressed');
    setError('');
    setOauthLoading('apple');
    try {
      await signInWithApple();
      console.log('[CustomerAuth] Apple sign-in success');
      // upsert after user state updates — handled in useEffect via user.id
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Apple sign-in failed';
      console.log('[CustomerAuth] Apple sign-in error:', msg);
      if (msg !== 'Authentication cancelled') {
        setError(msg);
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[CustomerAuth] Google sign-in pressed');
    setError('');
    setOauthLoading('google');
    try {
      await signInWithGoogle();
      console.log('[CustomerAuth] Google sign-in success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      console.log('[CustomerAuth] Google sign-in error:', msg);
      if (msg !== 'Authentication cancelled') {
        setError(msg);
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const isAnyLoading = loading || oauthLoading !== null;
  const submitLabel = loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              console.log('[CustomerAuth] Back pressed');
              router.back();
            }}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="chevron-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Join the diaspora food community' : 'Sign in to continue'}
          </Text>
        </View>

        <View style={styles.form}>
          {error !== '' && (
            <View style={styles.errorBanner}>
              <IconSymbol
                ios_icon_name="exclamationmark.circle.fill"
                android_material_icon_name="error"
                size={16}
                color="#FF3B30"
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Apple Sign In */}
          <TouchableOpacity
            style={[styles.appleButtonOuter, isAnyLoading && styles.buttonDisabled]}
            onPress={handleAppleSignIn}
            disabled={isAnyLoading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#1C1C1E', '#0A0A0A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.appleButton}
            >
              {/* Subtle top sheen */}
              <LinearGradient
                colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.socialSheen}
                pointerEvents="none"
              />
              {oauthLoading === 'apple' ? (
                <ActivityIndicator color="rgba(255,255,255,0.7)" size="small" />
              ) : (
                <>
          
          <View style={styles.socialIconWrap}>
            <AppleIcon />
          </View>
          
          
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  <View style={styles.socialButtonChevron}>
                    <Text style={styles.socialChevronText}>›</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.googleButtonOuter, isAnyLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isAnyLoading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F5F5F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.googleButton}
            >
              {/* Subtle top sheen */}
              <LinearGradient
                colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.socialSheen}
                pointerEvents="none"
              />
              {oauthLoading === 'google' ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <>
          {/* Google button — replace googleLogoWrap + googleLogoText with: */}
          <View style={styles.socialIconWrap}>
            <GoogleIcon />
          </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                  <View style={styles.socialButtonChevron}>
                    <Text style={[styles.socialChevronText, { color: 'rgba(0,0,0,0.2)' }]}>›</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isAnyLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isAnyLoading}
            activeOpacity={0.8}
          >
            <GradientFill borderRadius={12} />
            {loading ? (
              <ActivityIndicator color="#1A1000" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{submitLabel}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                console.log('[CustomerAuth] Toggle mode to:', isSignUp ? 'signin' : 'signup');
                setIsSignUp(!isSignUp);
                setError('');
              }}
            >
              <Text style={styles.toggleLink}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  appleButtonOuter: {
  borderRadius: 14,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.5,
  shadowRadius: 14,
  elevation: 9,
},
appleButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  borderRadius: 14,
  paddingVertical: 15,
  paddingHorizontal: 20,
  minHeight: 56,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.07)',
  overflow: 'hidden',
},

googleButtonOuter: {
  borderRadius: 14,
  shadowColor: 'rgba(0,0,0,0.15)',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 4,
},
googleButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  borderRadius: 14,
  paddingVertical: 15,
  paddingHorizontal: 20,
  minHeight: 56,
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.08)',
  overflow: 'hidden',
},

// Shared sheen overlay — sits on top of the gradient, doesn't block touches
socialSheen: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '50%',
  borderTopLeftRadius: 14,
  borderTopRightRadius: 14,
},

// Remove appleLogoWrap, appleLogoText, googleLogoWrap, googleLogoText
// Add this single shared style:
socialIconWrap: {
  width: 24,
  height: 24,
  alignItems: 'center',
  justifyContent: 'center',
},
appleButtonText: {
  flex: 1,
  fontSize: 15.5,
  fontWeight: '600',
  color: '#FFFFFF',
  letterSpacing: 0.1,
},

googleButtonText: {
  flex: 1,
  fontSize: 15.5,
  fontWeight: '600',
  color: '#1F1F1F',
  letterSpacing: 0.1,
},
socialButtonChevron: {
  width: 20,
  alignItems: 'flex-end',
},
socialChevronText: {
  fontSize: 20,
  fontWeight: '300',
  color: 'rgba(255,255,255,0.3)',
  lineHeight: 22,
},
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.highlight,
  },
  dividerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 4,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1000',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
