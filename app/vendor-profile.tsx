
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
  Switch,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { GradientFill } from '@/components/GradientFill';
import { Vendor, DiasporaSegment, PriceLevel } from '@/types/database.types';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const DIASPORA_SEGMENTS: DiasporaSegment[] = ['African American', 'Caribbean', 'African', 'Pan-African', 'Other'];
const PRICE_LEVELS: PriceLevel[] = ['$', '$$', '$$$'];
const CUISINES = ['Nigerian', 'Jamaican', 'Soul Food', 'Ethiopian', 'Ghanaian', 'Haitian', 'Trinidadian', 'Senegalese', 'Kenyan', 'Other'];
const DELIVERY_PARTNERS = ['In-house', 'UberEats', 'DoorDash', 'Grubhub', 'Other'];

export default function VendorProfileScreen() {
  const router = useRouter();

  // Basic Info
  const [name, setName] = useState('Mama Oliseh\'s Kitchen');
  const [tagline, setTagline] = useState('Authentic Nigerian Cuisine');
  const [description, setDescription] = useState('Experience the rich flavors of Nigeria with our traditional dishes made from family recipes passed down through generations.');
  const [logoImage, setLogoImage] = useState<string | undefined>(undefined);
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);

  // Contact Info
  const [phone, setPhone] = useState('(555) 123-4567');
  const [email, setEmail] = useState('contact@mamaoliseh.com');
  const [website, setWebsite] = useState('www.mamaoliseh.com');
  const [instagram, setInstagram] = useState('@mamaoliseh');

  // Location
  const [addressLine1, setAddressLine1] = useState('123 Main Street');
  const [addressLine2, setAddressLine2] = useState('Suite 100');
  const [city, setCity] = useState('Los Angeles');
  const [state, setState] = useState('CA');
  const [zipCode, setZipCode] = useState('90001');

  // Business Details
  const [diasporaFocus, setDiasporaFocus] = useState<DiasporaSegment[]>(['African']);
  const [cuisines, setCuisines] = useState<string[]>(['Nigerian']);
  const [priceLevel, setPriceLevel] = useState<PriceLevel>('$$');
  const [minOrderAmount, setMinOrderAmount] = useState('15.00');

  // Service Options
  const [offersDineIn, setOffersDineIn] = useState(true);
  const [offersPickup, setOffersPickup] = useState(true);
  const [offersDelivery, setOffersDelivery] = useState(true);
  const [selectedDeliveryPartners, setSelectedDeliveryPartners] = useState<string[]>(['In-house', 'UberEats']);

  // Opening Hours
  const [openingHours, setOpeningHours] = useState('Mon-Fri: 11am-9pm, Sat-Sun: 12pm-10pm');

  // Onboarding Status
  const [onboardingStatus] = useState<'pending' | 'active'>('active');

  const handlePickImage = async (type: 'logo' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'logo') {
        setLogoImage(result.assets[0].uri);
      } else {
        setCoverImage(result.assets[0].uri);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleDiasporaFocus = (segment: DiasporaSegment) => {
    if (diasporaFocus.includes(segment)) {
      setDiasporaFocus(diasporaFocus.filter(s => s !== segment));
    } else {
      setDiasporaFocus([...diasporaFocus, segment]);
    }
  };

  const toggleCuisine = (cuisine: string) => {
    if (cuisines.includes(cuisine)) {
      setCuisines(cuisines.filter(c => c !== cuisine));
    } else {
      setCuisines([...cuisines, cuisine]);
    }
  };

  const toggleDeliveryPartner = (partner: string) => {
    if (selectedDeliveryPartners.includes(partner)) {
      setSelectedDeliveryPartners(selectedDeliveryPartners.filter(p => p !== partner));
    } else {
      setSelectedDeliveryPartners([...selectedDeliveryPartners, partner]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a vendor name');
      return;
    }

    // TODO: Save to database
    console.log('Saving vendor profile');

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Profile updated successfully');
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
                android_material_icon_name="arrow-back"
                size={24} 
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vendor Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Onboarding Status */}
          {onboardingStatus === 'pending' && (
            <View style={styles.statusBanner}>
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="schedule"
                size={20} 
                color="#FF9500"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Pending Approval</Text>
                <Text style={styles.statusText}>
                  Your listing is under review. Contact support if you have questions.
                </Text>
              </View>
            </View>
          )}

          {/* Images */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Images</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cover Image</Text>
              <TouchableOpacity style={styles.coverImageUpload} onPress={() => handlePickImage('cover')}>
                {coverImage ? (
                  <Image source={{ uri: coverImage }} style={styles.coverImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <IconSymbol 
                      ios_icon_name="photo" 
                      android_material_icon_name="image"
                      size={40} 
                      color={colors.textSecondary}
                    />
                    <Text style={styles.imagePlaceholderText}>Tap to upload cover image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Logo</Text>
              <TouchableOpacity style={styles.logoImageUpload} onPress={() => handlePickImage('logo')}>
                {logoImage ? (
                  <Image source={{ uri: logoImage }} style={styles.logoImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <IconSymbol 
                      ios_icon_name="building.2" 
                      android_material_icon_name="store"
                      size={40} 
                      color={colors.textSecondary}
                    />
                    <Text style={styles.imagePlaceholderText}>Tap to upload logo</Text>
                  </View>
                )}
              </TouchableOpacity>
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
                placeholder="Tell customers about your business..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone *</Text>
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                placeholder="www.example.com"
                placeholderTextColor={colors.textSecondary}
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instagram</Text>
              <TextInput
                style={styles.input}
                placeholder="@username"
                placeholderTextColor={colors.textSecondary}
                value={instagram}
                onChangeText={setInstagram}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput
                style={styles.input}
                placeholder="Street address"
                placeholderTextColor={colors.textSecondary}
                value={addressLine1}
                onChangeText={setAddressLine1}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                placeholder="Apt, suite, etc."
                placeholderTextColor={colors.textSecondary}
                value={addressLine2}
                onChangeText={setAddressLine2}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>State *</Text>
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
              <Text style={styles.label}>ZIP Code *</Text>
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

          {/* Business Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diaspora Focus</Text>
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
                    {diasporaFocus.includes(segment) && <GradientFill borderRadius={20} />}
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cuisines</Text>
              <View style={styles.chipGrid}>
                {CUISINES.map((cuisine, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.chip,
                      cuisines.includes(cuisine) && styles.chipActive,
                    ]}
                    onPress={() => toggleCuisine(cuisine)}
                  >
                    {cuisines.includes(cuisine) && <GradientFill borderRadius={20} />}
                    <Text
                      style={[
                        styles.chipText,
                        cuisines.includes(cuisine) && styles.chipTextActive,
                      ]}
                    >
                      {cuisine}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price Level</Text>
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
                    {priceLevel === level && <GradientFill borderRadius={20} />}
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Minimum Order Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={minOrderAmount}
                onChangeText={setMinOrderAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Service Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Options</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Dine-In</Text>
              <Switch
                value={offersDineIn}
                onValueChange={setOffersDineIn}
                trackColor={{ false: colors.highlight, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Pickup</Text>
              <Switch
                value={offersPickup}
                onValueChange={setOffersPickup}
                trackColor={{ false: colors.highlight, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Delivery</Text>
              <Switch
                value={offersDelivery}
                onValueChange={setOffersDelivery}
                trackColor={{ false: colors.highlight, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            {offersDelivery && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Delivery Partners</Text>
                <View style={styles.chipGrid}>
                  {DELIVERY_PARTNERS.map((partner, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.chip,
                        selectedDeliveryPartners.includes(partner) && styles.chipActive,
                      ]}
                      onPress={() => toggleDeliveryPartner(partner)}
                    >
                      {selectedDeliveryPartners.includes(partner) && <GradientFill borderRadius={20} />}
                      <Text
                        style={[
                          styles.chipText,
                          selectedDeliveryPartners.includes(partner) && styles.chipTextActive,
                        ]}
                      >
                        {partner}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Opening Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Mon-Fri: 11am-9pm, Sat-Sun: 12pm-10pm"
                placeholderTextColor={colors.textSecondary}
                value={openingHours}
                onChangeText={setOpeningHours}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <GradientFill borderRadius={12} />
            <Text style={styles.saveButtonText}>Save Profile</Text>
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#856404',
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
  coverImageUpload: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoImageUpload: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: colors.card,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.highlight,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
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
  chipTextActive: {
    color: '#1A1000',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1000',
  },
});
