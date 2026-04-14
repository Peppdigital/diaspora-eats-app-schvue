import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet, authenticatedPatch } from '@/utils/api';
import { ChevronLeft, Lock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { GradientFill } from '@/components/GradientFill';
import * as Haptics from 'expo-haptics';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  image?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
}

export default function EditProfileScreen() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const paddingTop = Platform.OS === 'android' ? 48 : 60;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    console.log('[EditProfile] Fetching user profile');
    setLoadingProfile(true);
    try {
      const data = await authenticatedGet<{ profile: Profile }>('/api-user-profile');
      console.log('[EditProfile] Profile loaded:', data.profile);
      const p = data.profile;
      setProfile(p);
      setFullName(p.full_name || '');
      setDisplayName(p.name || '');
      setPhone(p.phone || '');
      setAvatarUrl(p.avatar_url || p.image || '');
    } catch (err: any) {
      console.error('[EditProfile] Failed to load profile:', err);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePickPhoto = async () => {
    console.log('[EditProfile] Opening photo picker action sheet');
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Change Photo', '', [
      {
        text: 'Choose from Library',
        onPress: async () => {
          console.log('[EditProfile] Launching image library');
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            console.log('[EditProfile] Photo selected:', result.assets[0].uri);
            setAvatarUrl(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => {
          console.log('[EditProfile] Removing photo');
          setAvatarUrl('');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    console.log('[EditProfile] Save button pressed');
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (fullName !== (profile?.full_name || '')) payload.full_name = fullName;
      if (displayName !== (profile?.name || '')) payload.name = displayName;
      if (phone !== (profile?.phone || '')) payload.phone = phone;
      const originalAvatar = profile?.avatar_url || profile?.image || '';
      if (avatarUrl !== originalAvatar) payload.avatar_url = avatarUrl;

      console.log('[EditProfile] PATCH /api-user-profile payload:', payload);
      const data = await authenticatedPatch<{ profile: Profile }>('/api-user-profile', payload);
      console.log('[EditProfile] Profile saved successfully:', data.profile);

      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('[EditProfile] Failed to save profile:', err);
      Alert.alert('Error', err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    console.log('[EditProfile] Back button pressed');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const email = profile?.email || user?.email || '';
  const initials = (displayName || fullName || email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hasAvatar = !!avatarUrl;

  if (loadingProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </View>
    );
  }

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
          Edit Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Avatar */}
        <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 32 }}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
            {hasAvatar ? (
              <Image
                source={resolveImageSource(avatarUrl)}
                style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#D4AF37' }}
              />
            ) : (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#252525',
                  borderWidth: 2,
                  borderColor: '#D4AF37',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 26, color: '#D4AF37' }}>
                  {initials}
                </Text>
              </View>
            )}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#D4AF37',
                borderRadius: 12,
                width: 24,
                height: 24,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: '#0D0D0D' }}>✎</Text>
            </View>
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#A0A0A0', marginTop: 8 }}>
            Tap to change photo
          </Text>
        </View>

        {/* Form */}
        <View style={{ paddingHorizontal: 20, gap: 20 }}>
          {/* Full Name */}
          <View>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
              Full Name
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#555555"
              style={{
                backgroundColor: '#1A1A1A',
                borderWidth: 1,
                borderColor: '#333333',
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontFamily: 'Poppins-Regular',
                fontSize: 15,
                color: '#F5F5F5',
              }}
            />
          </View>

          {/* Display Name */}
          <View>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor="#555555"
              style={{
                backgroundColor: '#1A1A1A',
                borderWidth: 1,
                borderColor: '#333333',
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontFamily: 'Poppins-Regular',
                fontSize: 15,
                color: '#F5F5F5',
              }}
            />
          </View>

          {/* Phone */}
          <View>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
              Phone Number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor="#555555"
              keyboardType="phone-pad"
              style={{
                backgroundColor: '#1A1A1A',
                borderWidth: 1,
                borderColor: '#333333',
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontFamily: 'Poppins-Regular',
                fontSize: 15,
                color: '#F5F5F5',
              }}
            />
          </View>

          {/* Email (read-only) */}
          <View>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
              Email
            </Text>
            <View
              style={{
                backgroundColor: '#1A1A1A',
                borderWidth: 1,
                borderColor: '#333333',
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: 'Poppins-Regular',
                  fontSize: 15,
                  color: '#555555',
                }}
              >
                {email}
              </Text>
              <Lock color="#555555" size={16} />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
            style={{
              backgroundColor: 'transparent',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              opacity: saving ? 0.6 : 1,
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            {!saving && <GradientFill borderRadius={12} />}
            {saving && <ActivityIndicator color="#0D0D0D" size="small" />}
            <Text
              style={{
                fontFamily: 'Montserrat-SemiBold',
                fontSize: 15,
                color: '#0D0D0D',
                letterSpacing: 1,
              }}
            >
              SAVE CHANGES
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
