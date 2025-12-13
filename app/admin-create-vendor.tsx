
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { VendorType, DiasporaSegment, PriceLevel } from '@/types/database.types';
import * as Haptics from 'expo-haptics';

const VENDOR_TYPES: VendorType[] = ['restaurant', 'grocery'];
const DIASPORA_SEGMENTS: DiasporaSegment[] = ['African American', 'Caribbean', 'African', 'Pan-African', 'Other'];
const PRICE_LEVELS: PriceLevel[] = ['$', '$$', '$$$'];

export default function AdminCreateVendorScreen() {
  const router = useRouter();

  const [vendorType, setVendorType] = useState<VendorType>('restaurant');
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [diasporaFocus, setDiasporaFocus] = useState<DiasporaSegment[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [priceLevel, setPriceLevel] = useState<PriceLevel>('$$');

  const toggleDiasporaFocus = (segment: DiasporaSegment) => {
    if (diasporaFocus.includes(segment)) {
      setDiasporaFocus(diasporaFocus.filter(s => s !== segment));
    } else {
      setDiasporaFocus([...diasporaFocus, segment]);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a vendor name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (diasporaFocus.length === 0) {
      Alert.alert('Error', 'Please select at least one diaspora focus');
      return;
    }

    const inviteCode = generateInviteCode();

    // TODO: Save vendor to database and create invite code
    console.log('Creating vendor with invite code:', inviteCode);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      'Vendor Created',
      `Vendor created successfully!\n\nInvite Code: ${inviteCode}\n\nShare this code with the vendor at ${email}`,
      [
        {
          text: 'Copy Code',
          onPress: () => {
            // TODO: Copy to clipboard
            console.log('Copied:', inviteCode);
          },
        },
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol 
                ios_icon_name="chevron.left" 
                android_material_icon_name="arrow_back"
                size={24} 
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Vendor</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info"
              size={20} 
              color="#007AFF"
            />
            <Text style={styles.infoBannerText}>
              After creating the vendor, an invite code will be generated. Share this code with the vendor so they can claim their listing.
            </Text>
          </View>

          {/* Vendor Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendor Type</Text>
            <View style={styles.typeSelector}>
              {VENDOR_TYPES.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.typeButton,
                    vendorType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setVendorType(type)}
                >
                  <IconSymbol 
                    ios_icon_name={type === 'restaurant' ? 'fork.knife' : 'cart.fill'}
                    android_material_icon_name={type === 'restaurant' ? 'restaurant' : 'shopping_cart'}
                    size={24} 
                    color={vendorType === type ? '#FFFFFF' : colors.text}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      vendorType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Vendor name"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tagline</Text>
              <TextInput
                style={styles.input}
                placeholder="Short description"
                placeholderTextColor={colors.textSecondary}
                value={tagline}
                onChangeText={setTagline}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell customers about this business..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Diaspora Focus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diaspora Focus *</Text>
            <View style={styles.chipGrid}>
              {DIASPORA_SEGMENTS.map((segment, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.chip,
                    diasporaFocus.includes(segment) && styles.chipActive,
                  ]}
                  onPress={() => toggleDiasporaFocus(segment)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      diasporaFocus.includes(segment) && styles.chipTextActive,
                    ]}
                  >
                    {segment}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@example.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Line 1</Text>
              <TextInput
                style={styles.input}
                placeholder="Street address"
                placeholderTextColor={colors.textSecondary}
                value={addressLine1}
                onChangeText={setAddressLine1}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="CA"
                  placeholderTextColor={colors.textSecondary}
                  value={state}
                  onChangeText={setState}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                placeholder="90001"
                placeholderTextColor={colors.textSecondary}
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Price Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Level</Text>
            <View style={styles.chipGrid}>
              {PRICE_LEVELS.map((level, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.chip,
                    priceLevel === level && styles.chipActive,
                  ]}
                  onPress={() => setPriceLevel(level)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      priceLevel === level && styles.chipTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>Create Vendor & Generate Invite Code</Text>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.highlight,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
