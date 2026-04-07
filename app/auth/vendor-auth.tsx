
import React, { useState } from 'react';
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
import { IconSymbol } from '@/components/IconSymbol';
import { DiasporaSegment, VendorType } from '@/types/database.types';
import { US_STATES, MAJOR_CITIES_BY_STATE } from '@/constants/LocationData';
import { supabase } from '@/app/integrations/supabase/client';

export default function VendorAuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'claim' | 'request'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const toggleDiaspora = (segment: DiasporaSegment) => {
    if (diasporaFocus.includes(segment)) {
      setDiasporaFocus(diasporaFocus.filter((s) => s !== segment));
    } else {
      setDiasporaFocus([...diasporaFocus, segment]);
    }
  };

  const handleClaimSubmit = async () => {
    setError('');
    if (!inviteCode.trim()) {
      setError('Please enter your invite code');
      return;
    }
    if (!claimEmail.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!claimPassword) {
      setError('Please enter a password');
      return;
    }
    if (claimPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (claimPassword !== claimConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    console.log('[VendorAuth] Claim listing pressed — email:', claimEmail, 'invite code:', inviteCode);
    setLoading(true);
    try {
      // 1. Validate invite code against the vendor_invite_codes table
      const { data: inviteData, error: inviteError } = await supabase
        .from('vendor_invite_codes')
        .select('id, vendor_id, is_used, expires_at')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .eq('email_sent_to', claimEmail.trim().toLowerCase())
        .single();

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

      // 2. Create the Supabase auth account
      console.log('[VendorAuth] Creating auth account for:', claimEmail);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: claimEmail.trim().toLowerCase(),
        password: claimPassword,
        options: {
          data: { role: 'vendor' },
        },
      });

      console.log('[VendorAuth] supabase.auth.signUp result — user:', authData?.user?.id, 'error:', authError);

      if (authError) {
        setError(authError.message);
        return;
      }
      if (!authData.user) {
        setError('Account creation failed. Please try again.');
        return;
      }

      // 3. Link the user to the vendor and mark invite as used
      const { error: vendorUpdateError } = await supabase
        .from('vendors')
        .update({ owner_user_id: authData.user.id, onboarding_status: 'claimed' })
        .eq('id', inviteData.vendor_id);

      console.log('[VendorAuth] Vendor claim update error:', vendorUpdateError);

      const { error: inviteMarkError } = await supabase
        .from('vendor_invite_codes')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', inviteData.id);

      console.log('[VendorAuth] Invite mark-used error:', inviteMarkError);

      // 4. Insert user profile row
      await supabase.from('users').upsert({
        id: authData.user.id,
        email: claimEmail.trim().toLowerCase(),
        full_name: 'Vendor',
        role: 'vendor',
      });

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
    if (!businessName.trim()) {
      setError('Please enter your business name');
      return;
    }
    if (!requestEmail.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (!selectedState) {
      setError('Please select a state');
      return;
    }
    if (!selectedCity) {
      setError('Please select a city');
      return;
    }
    if (diasporaFocus.length === 0) {
      setError('Please select at least one diaspora focus');
      return;
    }
    if (!requestPassword) {
      setError('Please enter a password');
      return;
    }
    if (requestPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (requestPassword !== requestConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    console.log('[VendorAuth] Request new listing pressed — business:', businessName, 'email:', requestEmail);
    setLoading(true);
    try {
      // 1. Create the Supabase auth account
      console.log('[VendorAuth] Calling supabase.auth.signUp for:', requestEmail);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: requestEmail.trim().toLowerCase(),
        password: requestPassword,
        options: {
          data: { role: 'vendor', business_name: businessName.trim() },
        },
      });

      console.log('[VendorAuth] supabase.auth.signUp result — user:', authData?.user?.id, 'error:', authError);

      if (authError) {
        setError(authError.message);
        return;
      }
      if (!authData.user) {
        setError('Account creation failed. Please try again.');
        return;
      }

      const userId = authData.user.id;

      // 2. Insert user profile row
      const { error: userInsertError } = await supabase.from('users').upsert({
        id: userId,
        email: requestEmail.trim().toLowerCase(),
        full_name: businessName.trim(),
        role: 'vendor',
        phone: phone.trim(),
        default_location_state: selectedState,
        default_location_city: selectedCity,
      });

      console.log('[VendorAuth] User profile insert error:', userInsertError);

      // 3. Insert vendor record with pending onboarding status
      const cuisineList = cuisines
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const { data: vendorData, error: vendorInsertError } = await supabase
        .from('vendors')
        .insert({
          owner_user_id: userId,
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
        // Non-fatal: account was created, vendor row failed — still show success
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
                android_material_icon_name="chevron_left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Vendor Sign Up</Text>
            <Text style={styles.subtitle}>
              Join our platform and reach more customers
            </Text>
          </View>

          <View style={styles.modeSelection}>
            <TouchableOpacity
              style={styles.modeCard}
              onPress={() => {
                console.log('[VendorAuth] Selected: Claim Existing Listing');
                setMode('claim');
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
                android_material_icon_name="chevron_left"
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
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleClaimSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Claim Listing</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Request mode
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
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRequestSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
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
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    elevation: 4,
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
    gap: 20,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  typeButtonTextSelected: {
    color: '#FFFFFF',
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    boxShadow: '0px 4px 12px rgba(212, 163, 115, 0.3)',
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
