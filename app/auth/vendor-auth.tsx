
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { DiasporaSegment, VendorType } from '@/types/database.types';
import { US_STATES, MAJOR_CITIES_BY_STATE } from '@/constants/LocationData';

export default function VendorAuthScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [mode, setMode] = useState<'select' | 'claim' | 'request'>('select');
  const [loading, setLoading] = useState(false);

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
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter your invite code');
      return;
    }
    if (!claimEmail.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!claimPassword) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (claimPassword !== claimConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // TODO: Validate invite code and link vendor
      console.log('Claiming vendor with code:', inviteCode);
      await signUp(claimEmail, claimPassword, 'Vendor User', 'vendor');
      router.replace('/vendor-dashboard');
    } catch (error) {
      console.error('Claim error:', error);
      Alert.alert('Error', 'Invalid invite code or email');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async () => {
    if (!businessName.trim()) {
      Alert.alert('Error', 'Please enter your business name');
      return;
    }
    if (!requestEmail.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!selectedState) {
      Alert.alert('Error', 'Please select a state');
      return;
    }
    if (!selectedCity) {
      Alert.alert('Error', 'Please select a city');
      return;
    }
    if (diasporaFocus.length === 0) {
      Alert.alert('Error', 'Please select at least one diaspora focus');
      return;
    }
    if (!requestPassword) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (requestPassword !== requestConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // TODO: Create vendor record with pending status
      console.log('Creating vendor request:', {
        businessName,
        vendorType,
        email: requestEmail,
        phone,
        state: selectedState,
        city: selectedCity,
        diasporaFocus,
        cuisines,
      });
      await signUp(requestEmail, requestPassword, businessName, 'vendor');
      Alert.alert(
        'Success',
        'Your vendor application has been submitted! We will review it and get back to you soon.',
        [{ text: 'OK', onPress: () => router.replace('/welcome') }]
      );
    } catch (error) {
      console.error('Request error:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
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
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="chevron-left"
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
              onPress={() => setMode('claim')}
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
              onPress={() => setMode('request')}
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
              onPress={() => setMode('select')}
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
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
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
              <Text style={styles.submitButtonText}>
                {loading ? 'Claiming...' : 'Claim Listing'}
              </Text>
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
            onPress={() => setMode('select')}
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
                onPress={() => setVendorType('restaurant')}
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
                onPress={() => setVendorType('grocery')}
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
                      onPress={() => setSelectedCity(city)}
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
                    onPress={() => toggleDiaspora(segment)}
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
              placeholder="Create a password"
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
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Text>
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
