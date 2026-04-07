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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { api } from '@/utils/api';
import * as Haptics from 'expo-haptics';

type DiasporaSegment = 'African American' | 'Caribbean' | 'African' | 'Pan-African' | 'Other';
type VendorType = 'restaurant' | 'grocery';

const VENDOR_TYPES: VendorType[] = ['restaurant', 'grocery'];
const DIASPORA_SEGMENTS: DiasporaSegment[] = ['African American', 'Caribbean', 'African', 'Pan-African', 'Other'];

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
  const [loading, setLoading] = useState(false);

  const toggleDiasporaFocus = (segment: DiasporaSegment) => {
    if (diasporaFocus.includes(segment)) {
      setDiasporaFocus(diasporaFocus.filter((s) => s !== segment));
    } else {
      setDiasporaFocus([...diasporaFocus, segment]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a vendor name'); return; }
    if (!email.trim()) { Alert.alert('Error', 'Please enter an email address'); return; }
    if (diasporaFocus.length === 0) { Alert.alert('Error', 'Please select at least one diaspora focus'); return; }

    const payload = {
      vendor_type: vendorType,
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      diaspora_focus: diasporaFocus,
      phone: phone.trim(),
      email: email.trim(),
      address_line1: addressLine1.trim(),
      city: city.trim(),
      state: state.trim(),
      zip_code: zipCode.trim(),
    };

    console.log('[AdminCreateVendor] Create vendor pressed:', JSON.stringify(payload));
    setLoading(true);
    try {
      const data = await api.post('/api-vendors', payload);
      console.log('[AdminCreateVendor] Vendor created:', data?.vendor?.id || data?.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Vendor Created', 'Vendor created successfully!', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create vendor';
      console.log('[AdminCreateVendor] Create error:', msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Vendor</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.infoBanner}>
            <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={20} color="#007AFF" />
            <Text style={styles.infoBannerText}>
              Create a vendor listing. The vendor can then sign in and manage their profile.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendor Type</Text>
            <View style={styles.typeSelector}>
              {VENDOR_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, vendorType === type && styles.typeButtonActive]}
                  onPress={() => setVendorType(type)}
                >
                  <IconSymbol
                    ios_icon_name={type === 'restaurant' ? 'fork.knife' : 'cart.fill'}
                    android_material_icon_name={type === 'restaurant' ? 'restaurant' : 'shopping-cart'}
                    size={24}
                    color={vendorType === type ? '#FFFFFF' : colors.text}
                  />
                  <Text style={[styles.typeButtonText, vendorType === type && styles.typeButtonTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} placeholder="Vendor name" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tagline</Text>
              <TextInput style={styles.input} placeholder="Short description" placeholderTextColor={colors.textSecondary} value={tagline} onChangeText={setTagline} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Tell customers about this business..." placeholderTextColor={colors.textSecondary} value={description} onChangeText={setDescription} multiline numberOfLines={4} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diaspora Focus *</Text>
            <View style={styles.chipGrid}>
              {DIASPORA_SEGMENTS.map((segment) => (
                <TouchableOpacity
                  key={segment}
                  style={[styles.chip, diasporaFocus.includes(segment) && styles.chipActive]}
                  onPress={() => toggleDiasporaFocus(segment)}
                >
                  <Text style={[styles.chipText, diasporaFocus.includes(segment) && styles.chipTextActive]}>{segment}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} placeholder="(555) 123-4567" placeholderTextColor={colors.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} placeholder="contact@example.com" placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Line 1</Text>
              <TextInput style={styles.input} placeholder="Street address" placeholderTextColor={colors.textSecondary} value={addressLine1} onChangeText={setAddressLine1} />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput style={styles.input} placeholder="City" placeholderTextColor={colors.textSecondary} value={city} onChangeText={setCity} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput style={styles.input} placeholder="CA" placeholderTextColor={colors.textSecondary} value={state} onChangeText={setState} maxLength={2} autoCapitalize="characters" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput style={styles.input} placeholder="90001" placeholderTextColor={colors.textSecondary} value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" />
            </View>
          </View>

          <TouchableOpacity style={[styles.createButton, loading && { opacity: 0.6 }]} onPress={handleCreate} disabled={loading}>
            <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'Create Vendor'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingTop: Platform.OS === 'android' ? 48 : 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, marginBottom: 24, gap: 12 },
  infoBannerText: { flex: 1, fontSize: 14, color: '#1565C0', lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  typeSelector: { flexDirection: 'row', gap: 12 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.highlight },
  typeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  typeButtonTextActive: { color: '#FFFFFF' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.highlight },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.highlight },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#FFFFFF' },
  createButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  createButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
