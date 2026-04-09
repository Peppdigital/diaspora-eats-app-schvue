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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { GradientFill } from '@/components/GradientFill';
import { IconSymbol } from '@/components/IconSymbol';
import { DiasporaSegment, VendorType } from '@/types/database.types';
import { US_STATES, MAJOR_CITIES_BY_STATE } from '@/constants/LocationData';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { AppleIcon, GoogleIcon } from '@/components/SocialIcons';

type Mode = 'select' | 'signin' | 'claim' | 'request';

export default function VendorAuthScreen() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>('select');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState('');

  // Sign-in form fields
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  // Track whether we need to check role after OAuth sign-in on vendor screen
  const [pendingVendorCheck, setPendingVendorCheck] = useState(false);

  // Claim form fields
  const [inviteCode, setInviteCode] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimConfirmPassword, setClaimConfirmPassword] = useState('');

  // Request form fields
  const [businessName, setBusinessName] = useState('');
  const [vendorType, setVendorType] = useState<VendorType>('restaurant');
  const [requestEmail, setRequestEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [diasporaFocus, setDiasporaFocus] = useState<DiasporaSegment[]>([]);
  const [cuisines, setCuisines] = useState('');
  const [requestPassword, setRequestPassword] = useState('');
  const [requestConfirmPassword, setRequestConfirmPassword] = useState('');

  const diasporaOptions: DiasporaSegment[] = [
    'African American',
    'Caribbean',
    'African',
    'Pan-African',
    'Other',
  ];

  // After OAuth sign-in on vendor screen, check role
  useEffect(() => {
    if (user && pendingVendorCheck) {
      setPendingVendorCheck(false);
      checkVendorRole(user.id);
    }
  }, [user, pendingVendorCheck]);

  const checkVendorRole = async (userId: string) => {
    console.log('[VendorAuth] Checking vendor role for user:', userId);
    const { data, error: profileError } = await supabase
      .from('user_profile')
      .select('role')
      .eq('user_id', userId)
      .single();

    console.log('[VendorAuth] Role check result:', data, profileError);

    if (data?.role === 'vendor') {
      console.log('[VendorAuth] Vendor role confirmed, navigating to dashboard');
      router.replace('/vendor-dashboard');
    } else {
      console.log('[VendorAuth] Not a vendor account, role:', data?.role);
      setError('This account is not registered as a vendor.');
      setOauthLoading(null);
      setLoading(false);
    }
  };

  const toggleDiaspora = (segment: DiasporaSegment) => {
    if (diasporaFocus.includes(segment)) {
      setDiasporaFocus(diasporaFocus.filter((s) => s !== segment));
    } else {
      setDiasporaFocus([...diasporaFocus, segment]);
    }
  };

  const handleSignIn = async () => {
    setError('');
    if (!signinEmail.trim()) { setError('Please enter your email'); return; }
    if (!signinPassword) { setError('Please enter your password'); return; }

    console.log('[VendorAuth] Sign in pressed:', signinEmail);
    setLoading(true);
    try {
      const authedUser = await signInWithEmail(signinEmail.trim().toLowerCase(), signinPassword);
      console.log('[VendorAuth] Sign in success, checking vendor role');
      const userId = authedUser?.id;
      if (userId) {
        await checkVendorRole(userId);
      } else {
        // Fallback: wait for user state via useEffect
        setPendingVendorCheck(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      console.log('[VendorAuth] Sign in error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorAppleSignIn = async () => {
    console.log('[VendorAuth] Apple sign-in pressed');
    setError('');
    setOauthLoading('apple');
    try {
      await signInWithApple();
      console.log('[VendorAuth] Apple sign-in success, checking vendor role');
      setPendingVendorCheck(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Apple sign-in failed';
      console.log('[VendorAuth] Apple sign-in error:', msg);
      if (msg !== 'Authentication cancelled') {
        setError(msg);
      }
      setOauthLoading(null);
    }
  };

  const handleVendorGoogleSignIn = async () => {
    console.log('[VendorAuth] Google sign-in pressed');
    setError('');
    setOauthLoading('google');
    try {
      await signInWithGoogle();
      console.log('[VendorAuth] Google sign-in success, checking vendor role');
      setPendingVendorCheck(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      console.log('[VendorAuth] Google sign-in error:', msg);
      if (msg !== 'Authentication cancelled') {
        setError(msg);
      }
      setOauthLoading(null);
    }
  };

  const handleClaimSubmit = async () => {
    setError('');
    if (!inviteCode.trim()) { setError('Please enter your invite code'); return; }
    if (!claimEmail.trim()) { setError('Please enter your email'); return; }
    if (!claimPassword) { setError('Please enter a password'); return; }
    if (claimPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (claimPassword !== claimConfirmPassword) { setError('Passwords do not match'); return; }

    console.log('[VendorAuth] Claim listing pressed — email:', claimEmail, 'invite code:', inviteCode);
    setLoading(true);
    try {
      type InviteCode = { id: string; vendor_id: string; is_used: boolean; expires_at: string | null };

      // 1. Validate invite code
      const { data: inviteData, error: inviteError } = await supabase
        .from('vendor_invite_codes')
        .select('id, vendor_id, is_used, expires_at')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .eq('email_sent_to', claimEmail.trim().toLowerCase())
        .single() as { data: InviteCode | null; error: unknown };

      console.log('[VendorAuth] Invite code lookup result:', inviteData, inviteError);

      if (inviteError || !inviteData) {
        setError('Invalid invite code or email. Please check and try again.');
        return;
      }
      if (inviteData.is_used) {
        setError('This invite code has already been used.');
        return;
      }
      if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
        setError('This invite code has expired. Please contact support.');
        return;
      }

      // 2. Create account
      console.log('[VendorAuth] Creating account for:', claimEmail);
      const authedUser = await signUpWithEmail(claimEmail.trim().toLowerCase(), claimPassword, 'Vendor');
      console.log('[VendorAuth] Sign-up success');

      // 3. Get the new user id from the returned auth user
      const userId = authedUser?.id;
      console.log('[VendorAuth] New user id:', userId);

      if (!userId) {
        setError('Account creation failed. Please try again.');
        return;
      }

      // 4. Upsert user_profile with vendor role
      const { error: profileError } = await supabase
        .from('user_profile')
        .upsert({ user_id: userId, role: 'vendor', full_name: 'Vendor' }, { onConflict: 'user_id' });
      console.log('[VendorAuth] user_profile upsert error:', profileError);
      if (profileError) throw new Error('Failed to set up vendor profile. Please contact support.');

      // 5. Link user to vendor and mark invite used
      const { error: vendorUpdateError } = await supabase
        .from('vendors')
        .update({ user_id: userId, onboarding_status: 'claimed' })
        .eq('id', inviteData.vendor_id);
      console.log('[VendorAuth] Vendor claim update error:', vendorUpdateError);
      if (vendorUpdateError) throw new Error('Failed to link vendor account. Please contact support.');

      const { error: inviteMarkError } = await supabase
        .from('vendor_invite_codes')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', inviteData.id);
      console.log('[VendorAuth] Invite mark-used error:', inviteMarkError);

      console.log('[VendorAuth] Claim success — navigating to vendor dashboard');
      router.replace('/vendor-dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      console.log('[VendorAuth] Claim error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async () => {
    setError('');
    if (!businessName.trim()) { setError('Please enter your business name'); return; }
    if (!requestEmail.trim()) { setError('Please enter your email'); return; }
    if (!phone.trim()) { setError('Please enter your phone number'); return; }
    if (!selectedState) { setError('Please select a state'); return; }
    if (!selectedCity) { setError('Please select a city'); return; }
    if (diasporaFocus.length === 0) { setError('Please select at least one diaspora focus'); return; }
    if (!requestPassword) { setError('Please enter a password'); return; }
    if (requestPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (requestPassword !== requestConfirmPassword) { setError('Passwords do not match'); return; }

    console.log('[VendorAuth] Request new listing pressed — business:', businessName, 'email:', requestEmail);
    setLoading(true);
    try {
      // 1. Create Better Auth account
      console.log('[VendorAuth] Calling signUpWithEmail for:', requestEmail);
      const newUser = await signUpWithEmail(requestEmail.trim().toLowerCase(), requestPassword, businessName.trim());
      console.log('[VendorAuth] Better Auth sign-up success');

      // 2. Get user id from returned user
      const userId = newUser?.id;
      console.log('[VendorAuth] New user id:', userId);

      if (!userId) {
        setError('Account creation failed. Please try again.');
        return;
      }

      // 3. Upsert user_profile with vendor role
      const { error: profileError } = await supabase
        .from('user_profile')
        .upsert(
          { user_id: userId, role: 'vendor', full_name: businessName.trim() },
          { onConflict: 'user_id' }
        );
      console.log('[VendorAuth] user_profile upsert error:', profileError);

      // 4. Insert vendor record
      const cuisineList = cuisines
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const { data: vendorData, error: vendorInsertError } = await supabase
        .from('vendors')
        .insert({
          user_id: userId,
          vendor_type: vendorType,
          name: businessName.trim(),
          tagline: '',
          description: '',
          diaspora_focus: diasporaFocus,
          cuisines: cuisineList,
          phone: phone.trim(),
          email: requestEmail.trim().toLowerCase(),
          city: selectedCity,
          state: selectedState,
          address_line1: '',
          zip_code: '',
          country: 'US',
          is_active: false,
          onboarding_status: 'pending',
          created_by_admin: false,
          offers_dine_in: false,
          offers_pickup: true,
          offers_delivery: false,
          delivery_partners: [],
          avg_price_level: '$$',
          rating_average: 0,
          rating_count: 0,
        })
        .select('id')
        .single();

      console.log('[VendorAuth] Vendor insert result — id:', vendorData?.id, 'error:', vendorInsertError);

      if (vendorInsertError) {
        console.log('[VendorAuth] Vendor profile insert failed (non-fatal):', vendorInsertError.message);
      }

      console.log('[VendorAuth] Request submission success — showing confirmation');
      Alert.alert(
        'Application Submitted!',
        'Your vendor application has been submitted. Please check your email to confirm your account. Our team will review your application and get back to you within 2-3 business days.',
        [{ text: 'OK', onPress: () => router.replace('/welcome') }]
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      console.log('[VendorAuth] Request error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const cities = selectedState ? MAJOR_CITIES_BY_STATE[selectedState] || [] : [];
  const isAnyLoading = loading || oauthLoading !== null;

  // ─── SELECT SCREEN ───────────────────────────────────────────────────────────
  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                console.log('[VendorAuth] Back pressed from select screen');
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
            <Text style={styles.title}>Vendor Portal</Text>
            <Text style={styles.subtitle}>
              Sign in or join our platform
            </Text>
          </View>

          <View style={styles.modeSelection}>
            {/* Sign In card — first */}
            <TouchableOpacity
              style={[styles.modeCard, styles.modeCardHighlight]}
              onPress={() => {
                console.log('[VendorAuth] Selected: Sign In');
                setMode('signin');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={48}
                color={colors.primary}
              />
              <Text style={styles.modeTitle}>Sign In</Text>
              <Text style={styles.modeDescription}>
                Already have a vendor account? Sign in to access your dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeCard}
              onPress={() => {
                console.log('[VendorAuth] Selected: Claim Existing Listing');
                setMode('claim');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="key.fill"
                android_material_icon_name="vpn-key"
                size={48}
                color={colors.primary}
              />
              <Text style={styles.modeTitle}>Claim Existing Listing</Text>
              <Text style={styles.modeDescription}>
                If you received an invite code from our team, use it to claim
                your business listing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeCard}
              onPress={() => {
                console.log('[VendorAuth] Selected: Request New Listing');
                setMode('request');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={48}
                color={colors.primary}
              />
              <Text style={styles.modeTitle}>Request New Listing</Text>
              <Text style={styles.modeDescription}>
                Submit an application to add your restaurant or grocery store to
                our platform
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── SIGN IN SCREEN ──────────────────────────────────────────────────────────
  if (mode === 'signin') {
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
                console.log('[VendorAuth] Back pressed from signin screen');
                setMode('select');
                setError('');
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
            <Text style={styles.title}>Vendor Sign In</Text>
            <Text style={styles.subtitle}>
              Access your vendor dashboard
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
  onPress={handleVendorAppleSignIn}
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
  onPress={handleVendorGoogleSignIn}
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                value={signinEmail}
                onChangeText={setSigninEmail}
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
                value={signinPassword}
                onChangeText={setSigninPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isAnyLoading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isAnyLoading}
              activeOpacity={0.8}
            >
              {!loading && <GradientFill borderRadius={12} />}
              {loading ? (
                <ActivityIndicator color="#1A1000" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── CLAIM SCREEN ────────────────────────────────────────────────────────────
  if (mode === 'claim') {
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
                console.log('[VendorAuth] Back pressed from claim screen');
                setMode('select');
                setError('');
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
            <Text style={styles.title}>Claim Your Listing</Text>
            <Text style={styles.subtitle}>
              Enter the invite code we sent you
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Invite Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your invite code"
                placeholderTextColor={colors.textSecondary}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                value={claimEmail}
                onChangeText={setClaimEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password (min. 6 characters)"
                placeholderTextColor={colors.textSecondary}
                value={claimPassword}
                onChangeText={setClaimPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textSecondary}
                value={claimConfirmPassword}
                onChangeText={setClaimConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleClaimSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {!loading && <GradientFill borderRadius={12} />}
              {loading ? (
                <ActivityIndicator color="#1A1000" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Claim Listing</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── REQUEST SCREEN ──────────────────────────────────────────────────────────
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
              console.log('[VendorAuth] Back pressed from request screen');
              setMode('select');
              setError('');
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
          <Text style={styles.title}>Request New Listing</Text>
          <Text style={styles.subtitle}>
            Tell us about your business
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your business name"
              placeholderTextColor={colors.textSecondary}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Type</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  vendorType === 'restaurant' && styles.typeButtonSelected,
                ]}
                onPress={() => {
                  console.log('[VendorAuth] Business type selected: restaurant');
                  setVendorType('restaurant');
                }}
                activeOpacity={0.7}
              >
                {vendorType === 'restaurant' && <GradientFill borderRadius={12} />}
                <Text
                  style={[
                    styles.typeButtonText,
                    vendorType === 'restaurant' && styles.typeButtonTextSelected,
                  ]}
                >
                  Restaurant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  vendorType === 'grocery' && styles.typeButtonSelected,
                ]}
                onPress={() => {
                  console.log('[VendorAuth] Business type selected: grocery');
                  setVendorType('grocery');
                }}
                activeOpacity={0.7}
              >
                {vendorType === 'grocery' && <GradientFill borderRadius={12} />}
                <Text
                  style={[
                    styles.typeButtonText,
                    vendorType === 'grocery' && styles.typeButtonTextSelected,
                  ]}
                >
                  Grocery Store
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={requestEmail}
              onChangeText={setRequestEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {US_STATES.map((state, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      selectedState === state.code && styles.chipSelected,
                    ]}
                    onPress={() => {
                      console.log('[VendorAuth] State selected:', state.code);
                      setSelectedState(state.code);
                      setSelectedCity('');
                    }}
                    activeOpacity={0.7}
                  >
                    {selectedState === state.code && <GradientFill borderRadius={20} />}
                    <Text
                      style={[
                        styles.chipText,
                        selectedState === state.code && styles.chipTextSelected,
                      ]}
                    >
                      {state.code}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </ScrollView>
          </View>

          {selectedState && cities.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <View style={styles.chipContainer}>
                {cities.map((city, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        selectedCity === city && styles.chipSelected,
                      ]}
                      onPress={() => {
                        console.log('[VendorAuth] City selected:', city);
                        setSelectedCity(city);
                      }}
                      activeOpacity={0.7}
                    >
                      {selectedCity === city && <GradientFill borderRadius={20} />}
                      <Text
                        style={[
                          styles.chipText,
                          selectedCity === city && styles.chipTextSelected,
                        ]}
                      >
                        {city}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Diaspora Focus</Text>
            <View style={styles.chipContainer}>
              {diasporaOptions.map((segment, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      diasporaFocus.includes(segment) && styles.chipSelected,
                    ]}
                    onPress={() => {
                      console.log('[VendorAuth] Diaspora segment toggled:', segment);
                      toggleDiaspora(segment);
                    }}
                    activeOpacity={0.7}
                  >
                    {diasporaFocus.includes(segment) && <GradientFill borderRadius={20} />}
                    <Text
                      style={[
                        styles.chipText,
                        diasporaFocus.includes(segment) && styles.chipTextSelected,
                      ]}
                    >
                      {segment}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cuisines (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Nigerian, Jamaican, Soul Food"
              placeholderTextColor={colors.textSecondary}
              value={cuisines}
              onChangeText={setCuisines}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password (min. 6 characters)"
              placeholderTextColor={colors.textSecondary}
              value={requestPassword}
              onChangeText={setRequestPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textSecondary}
              value={requestConfirmPassword}
              onChangeText={setRequestConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleRequestSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {!loading && <GradientFill borderRadius={12} />}
            {loading ? (
              <ActivityIndicator color="#1A1000" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Application</Text>
            )}
          </TouchableOpacity>
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
  modeSelection: {
    gap: 20,
  },
  modeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
  },
  modeCardHighlight: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
  // Outer wrappers carry the shadow (shadows on LinearGradient are unreliable on Android)
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
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: 'transparent',
    borderColor: '#9C7C1A',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  typeButtonTextSelected: {
    color: '#1A1000',
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: 'transparent',
    borderColor: '#9C7C1A',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: '#1A1000',
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
});
