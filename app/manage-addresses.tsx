import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { authenticatedGet, authenticatedPost, authenticatedPatch, authenticatedDelete } from '@/utils/api';
import { ChevronLeft, Plus, Pencil, Trash2, MapPin, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GradientFill } from '@/components/GradientFill';

interface Address {
  id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  is_default: boolean;
  created_at?: string;
}

const PRESET_LABELS = ['Home', 'Work', 'Other'];

const EMPTY_FORM = {
  label: 'Home',
  customLabel: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
  is_default: false,
};

export default function ManageAddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_FORM });

  const paddingTop = Platform.OS === 'android' ? 48 : 60;

  const loadAddresses = useCallback(async () => {
    console.log('[ManageAddresses] Fetching addresses');
    setLoading(true);
    setError(null);
    try {
      const data = await authenticatedGet<{ addresses: Address[] }>('/api-addresses');
      console.log('[ManageAddresses] Addresses loaded:', data.addresses.length);
      setAddresses(data.addresses);
    } catch (err: any) {
      console.error('[ManageAddresses] Failed to load addresses:', err);
      setError('Failed to load addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openAddSheet = () => {
    console.log('[ManageAddresses] Add new address pressed');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingAddress(null);
    setForm({ ...EMPTY_FORM });
    setSheetVisible(true);
  };

  const openEditSheet = (address: Address) => {
    console.log('[ManageAddresses] Edit address pressed, id:', address.id);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingAddress(address);
    const isPreset = PRESET_LABELS.includes(address.label);
    setForm({
      label: isPreset ? address.label : 'Other',
      customLabel: isPreset ? '' : address.label,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country || 'US',
      is_default: address.is_default,
    });
    setSheetVisible(true);
  };

  const closeSheet = () => {
    console.log('[ManageAddresses] Sheet dismissed');
    setSheetVisible(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = async () => {
    const resolvedLabel = form.label === 'Other' ? form.customLabel.trim() : form.label;
    if (!resolvedLabel) {
      Alert.alert('Validation', 'Please enter a label for this address.');
      return;
    }
    if (!form.address_line1.trim()) {
      Alert.alert('Validation', 'Address Line 1 is required.');
      return;
    }
    if (!form.city.trim() || !form.state.trim() || !form.postal_code.trim()) {
      Alert.alert('Validation', 'City, State, and Zip Code are required.');
      return;
    }

    const payload = {
      label: resolvedLabel,
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim(),
      country: form.country.trim() || 'US',
      is_default: form.is_default,
    };

    setSavingAddress(true);
    try {
      if (editingAddress) {
        console.log('[ManageAddresses] PATCH /api-addresses/' + editingAddress.id, payload);
        await authenticatedPatch(`/api-addresses/${editingAddress.id}`, payload);
        console.log('[ManageAddresses] Address updated successfully');
      } else {
        console.log('[ManageAddresses] POST /api-addresses', payload);
        await authenticatedPost('/api-addresses', payload);
        console.log('[ManageAddresses] Address created successfully');
      }
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      closeSheet();
      loadAddresses();
    } catch (err: any) {
      console.error('[ManageAddresses] Failed to save address:', err);
      Alert.alert('Error', err.message || 'Failed to save address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = (address: Address) => {
    console.log('[ManageAddresses] Delete address pressed, id:', address.id);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      'Delete Address',
      `Remove "${address.label}" from your saved addresses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('[ManageAddresses] DELETE /api-addresses/' + address.id);
            try {
              await authenticatedDelete(`/api-addresses/${address.id}`);
              console.log('[ManageAddresses] Address deleted successfully');
              loadAddresses();
            } catch (err: any) {
              console.error('[ManageAddresses] Failed to delete address:', err);
              Alert.alert('Error', err.message || 'Failed to delete address.');
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    console.log('[ManageAddresses] Back button pressed');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const selectedLabelIsOther = form.label === 'Other';

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      {/* Header */}
      <View
        style={{
          paddingTop,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#333333',
        }}
      >
        <TouchableOpacity onPress={handleBack} style={{ width: 40 }}>
          <ChevronLeft color="#F5F5F5" size={26} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: 'Montserrat-SemiBold',
            fontSize: 18,
            color: '#D4AF37',
          }}
        >
          My Addresses
        </Text>
        <TouchableOpacity onPress={openAddSheet} style={{ width: 40, alignItems: 'flex-end' }}>
          <Plus color="#D4AF37" size={24} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15, color: '#A0A0A0', textAlign: 'center', marginBottom: 20 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadAddresses}
            style={{ backgroundColor: 'transparent', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 }}
          >
            <GradientFill borderRadius={10} />
            <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#1A1000' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : addresses.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <MapPin color="#333333" size={56} />
          <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, color: '#F5F5F5', marginTop: 20, marginBottom: 8 }}>
            No saved addresses
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: '#A0A0A0', textAlign: 'center', marginBottom: 28 }}>
            Add a delivery address to speed up checkout
          </Text>
          <TouchableOpacity
            onPress={openAddSheet}
            style={{ backgroundColor: 'transparent', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 }}
          >
            <GradientFill borderRadius={12} />
            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 14, color: '#1A1000', letterSpacing: 0.5 }}>
              Add your first address
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, gap: 12 }}
        >
          {addresses.map((address) => {
            const line2Text = address.address_line2 ? `, ${address.address_line2}` : '';
            const fullAddress = `${address.address_line1}${line2Text}, ${address.city}, ${address.state} ${address.postal_code}`;
            return (
              <TouchableOpacity
                key={address.id}
                onPress={() => openEditSheet(address)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#333333',
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#D4AF37' }}>
                      {address.label}
                    </Text>
                    {address.is_default && (
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: '#D4AF37',
                          borderRadius: 20,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: '#D4AF37' }}>
                          Default
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: '#A0A0A0', lineHeight: 20 }}>
                    {fullAddress}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => openEditSheet(address)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Pencil color="#A0A0A0" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteAddress(address)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 color="#C41E3A" size={18} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Add/Edit Sheet Modal */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              style={{
                backgroundColor: '#1A1A1A',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 12,
                paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                maxHeight: '92%',
              }}
            >
              {/* Sheet handle */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#333333' }} />
              </View>

              <Text
                style={{
                  fontFamily: 'Montserrat-SemiBold',
                  fontSize: 17,
                  color: '#D4AF37',
                  textAlign: 'center',
                  marginBottom: 20,
                  paddingHorizontal: 20,
                }}
              >
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16, paddingBottom: 8 }}
              >
                {/* Label chips */}
                <View>
                  <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 10 }}>
                    Label
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {PRESET_LABELS.map((preset) => {
                      const isSelected = form.label === preset;
                      return (
                        <TouchableOpacity
                          key={preset}
                          onPress={() => {
                            console.log('[ManageAddresses] Label chip selected:', preset);
                            setForm((f) => ({ ...f, label: preset }));
                          }}
                          style={{
                            paddingHorizontal: 18,
                            paddingVertical: 9,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: isSelected ? '#9C7C1A' : '#333333',
                            backgroundColor: isSelected ? 'transparent' : '#252525',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            shadowColor: isSelected ? '#D4AF37' : 'transparent',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isSelected ? 0.45 : 0,
                            shadowRadius: 4,
                            elevation: isSelected ? 4 : 0,
                          }}
                        >
                          {isSelected && <GradientFill borderRadius={20} />}
                          {isSelected && <Check color="#1A1000" size={13} />}
                          <Text
                            style={{
                              fontFamily: 'Poppins-Medium',
                              fontSize: 13,
                              color: isSelected ? '#1A1000' : '#A0A0A0',
                            }}
                          >
                            {preset}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedLabelIsOther && (
                    <TextInput
                      value={form.customLabel}
                      onChangeText={(v) => setForm((f) => ({ ...f, customLabel: v }))}
                      placeholder="Custom label"
                      placeholderTextColor="#555555"
                      style={{
                        marginTop: 10,
                        backgroundColor: '#0D0D0D',
                        borderWidth: 1,
                        borderColor: '#333333',
                        borderRadius: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        fontFamily: 'Poppins-Regular',
                        fontSize: 15,
                        color: '#F5F5F5',
                      }}
                    />
                  )}
                </View>

                {/* Address Line 1 */}
                <View>
                  <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
                    Address Line 1 *
                  </Text>
                  <TextInput
                    value={form.address_line1}
                    onChangeText={(v) => setForm((f) => ({ ...f, address_line1: v }))}
                    placeholder="Street address"
                    placeholderTextColor="#555555"
                    style={{
                      backgroundColor: '#0D0D0D',
                      borderWidth: 1,
                      borderColor: '#333333',
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      fontFamily: 'Poppins-Regular',
                      fontSize: 15,
                      color: '#F5F5F5',
                    }}
                  />
                </View>

                {/* Address Line 2 */}
                <View>
                  <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
                    Address Line 2
                  </Text>
                  <TextInput
                    value={form.address_line2}
                    onChangeText={(v) => setForm((f) => ({ ...f, address_line2: v }))}
                    placeholder="Apt, suite, unit (optional)"
                    placeholderTextColor="#555555"
                    style={{
                      backgroundColor: '#0D0D0D',
                      borderWidth: 1,
                      borderColor: '#333333',
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      fontFamily: 'Poppins-Regular',
                      fontSize: 15,
                      color: '#F5F5F5',
                    }}
                  />
                </View>

                {/* City + State row */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
                      City *
                    </Text>
                    <TextInput
                      value={form.city}
                      onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                      placeholder="City"
                      placeholderTextColor="#555555"
                      style={{
                        backgroundColor: '#0D0D0D',
                        borderWidth: 1,
                        borderColor: '#333333',
                        borderRadius: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        fontFamily: 'Poppins-Regular',
                        fontSize: 15,
                        color: '#F5F5F5',
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
                      State *
                    </Text>
                    <TextInput
                      value={form.state}
                      onChangeText={(v) => setForm((f) => ({ ...f, state: v.toUpperCase().slice(0, 2) }))}
                      placeholder="CA"
                      placeholderTextColor="#555555"
                      autoCapitalize="characters"
                      maxLength={2}
                      style={{
                        backgroundColor: '#0D0D0D',
                        borderWidth: 1,
                        borderColor: '#333333',
                        borderRadius: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        fontFamily: 'Poppins-Regular',
                        fontSize: 15,
                        color: '#F5F5F5',
                      }}
                    />
                  </View>
                </View>

                {/* Zip + Country row */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
                      Zip Code *
                    </Text>
                    <TextInput
                      value={form.postal_code}
                      onChangeText={(v) => setForm((f) => ({ ...f, postal_code: v }))}
                      placeholder="90210"
                      placeholderTextColor="#555555"
                      keyboardType="numeric"
                      maxLength={10}
                      style={{
                        backgroundColor: '#0D0D0D',
                        borderWidth: 1,
                        borderColor: '#333333',
                        borderRadius: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        fontFamily: 'Poppins-Regular',
                        fontSize: 15,
                        color: '#F5F5F5',
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
                      Country
                    </Text>
                    <TextInput
                      value={form.country}
                      onChangeText={(v) => setForm((f) => ({ ...f, country: v }))}
                      placeholder="US"
                      placeholderTextColor="#555555"
                      autoCapitalize="characters"
                      maxLength={2}
                      style={{
                        backgroundColor: '#0D0D0D',
                        borderWidth: 1,
                        borderColor: '#333333',
                        borderRadius: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        fontFamily: 'Poppins-Regular',
                        fontSize: 15,
                        color: '#F5F5F5',
                      }}
                    />
                  </View>
                </View>

                {/* Set as Default toggle */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#252525',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <View>
                    <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#F5F5F5' }}>
                      Set as Default
                    </Text>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#A0A0A0', marginTop: 2 }}>
                      Use this address by default at checkout
                    </Text>
                  </View>
                  <Switch
                    value={form.is_default}
                    onValueChange={(v) => {
                      console.log('[ManageAddresses] Set as default toggled:', v);
                      setForm((f) => ({ ...f, is_default: v }));
                    }}
                    trackColor={{ false: '#333333', true: 'rgba(212,175,55,0.4)' }}
                    thumbColor={form.is_default ? '#D4AF37' : '#A0A0A0'}
                  />
                </View>

                {/* Cancel */}
                <TouchableOpacity
                  onPress={closeSheet}
                  style={{ alignItems: 'center', paddingVertical: 12 }}
                >
                  <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 15, color: '#A0A0A0' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                {/* Save */}
                <TouchableOpacity
                  onPress={() => {
                    console.log('[ManageAddresses] Save address button pressed');
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    handleSaveAddress();
                  }}
                  disabled={savingAddress}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 10,
                    marginBottom: 4,
                    opacity: savingAddress ? 0.6 : 1,
                    shadowColor: '#D4AF37',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  {!savingAddress && <GradientFill borderRadius={12} />}
                  {savingAddress && <ActivityIndicator color="#0D0D0D" size="small" />}
                  <Text
                    style={{
                      fontFamily: 'Montserrat-SemiBold',
                      fontSize: 15,
                      color: '#0D0D0D',
                      letterSpacing: 1,
                    }}
                  >
                    SAVE ADDRESS
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
