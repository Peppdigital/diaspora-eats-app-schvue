import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { GradientFill } from '@/components/GradientFill';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { api } from '@/utils/api';

const SPICY_LEVELS = ['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'];

export default function VendorMenuItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { itemId, categoryId, vendorId } = params as { itemId?: string; categoryId?: string; vendorId?: string };

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [spicyLevel, setSpicyLevel] = useState('None');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!itemId);

  useEffect(() => {
    if (!itemId || !vendorId) { setInitialLoading(false); return; }
    console.log('[VendorMenuItem] Loading item:', itemId);
    api.get(`/api-menu-items/${vendorId}`)
      .then((data) => {
        const items = data?.menu_items || data?.items || data || [];
        const item = items.find((i: { id: string }) => i.id === itemId);
        if (item) {
          setName(item.name || '');
          setDescription(item.description || '');
          setPrice(String(item.price || ''));
          setImageUrl(item.image_url || item.item_image || '');
          setSpicyLevel(item.spicy_level || 'None');
          setIsAvailable(item.is_available !== false);
          setIsFeatured(item.is_featured || item.is_highlighted || false);
          setTags((item.tags || []).join(', '));
        }
      })
      .catch((err: unknown) => console.log('[VendorMenuItem] Load error:', err instanceof Error ? err.message : err))
      .finally(() => setInitialLoading(false));
  }, [itemId, vendorId]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUrl(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter an item name'); return; }
    if (!price || parseFloat(price) <= 0) { Alert.alert('Error', 'Please enter a valid price'); return; }
    if (!vendorId) { Alert.alert('Error', 'Vendor ID missing'); return; }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      image_url: imageUrl || undefined,
      is_available: isAvailable,
      is_featured: isFeatured,
      spicy_level: spicyLevel,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      category_id: categoryId || undefined,
    };

    console.log('[VendorMenuItem] Save pressed, mode:', itemId ? 'edit' : 'create', 'payload:', JSON.stringify(payload));
    setLoading(true);
    try {
      if (itemId) {
        await api.put(`/api-menu-items/${vendorId}/${itemId}`, payload);
        console.log('[VendorMenuItem] Item updated:', itemId);
      } else {
        await api.post(`/api-menu-items/${vendorId}`, payload);
        console.log('[VendorMenuItem] Item created');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Menu item ${itemId ? 'updated' : 'created'} successfully`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      console.log('[VendorMenuItem] Save error:', msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{itemId ? 'Edit Menu Item' : 'Add Menu Item'}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Image</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={handlePickImage}>
              {imageUrl !== '' ? (
                <Image source={{ uri: imageUrl }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="add-a-photo" size={40} color={colors.textSecondary} />
                  <Text style={styles.imagePlaceholderText}>Tap to upload image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} placeholder="e.g., Jollof Rice with Chicken" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your dish..." placeholderTextColor={colors.textSecondary} value={description} onChangeText={setDescription} multiline numberOfLines={4} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price *</Text>
              <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={colors.textSecondary} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Image URL (optional)</Text>
              <TextInput style={styles.input} placeholder="https://..." placeholderTextColor={colors.textSecondary} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" keyboardType="url" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (comma-separated)</Text>
              <TextInput style={styles.input} placeholder="e.g., spicy, vegan, gluten-free" placeholderTextColor={colors.textSecondary} value={tags} onChangeText={setTags} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spicy Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipContainer}>
                {SPICY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.chip, spicyLevel === level && styles.chipActive]}
                    onPress={() => setSpicyLevel(level)}
                  >
                    {spicyLevel === level && <GradientFill borderRadius={20} />}
                    <Text style={[styles.chipText, spicyLevel === level && styles.chipTextActive]}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Available</Text>
                <Text style={styles.toggleDescription}>Customers can order this item</Text>
              </View>
              <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: colors.highlight, true: colors.primary }} thumbColor="#FFFFFF" />
            </View>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Featured Item</Text>
                <Text style={styles.toggleDescription}>Highlight as signature dish</Text>
              </View>
              <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ false: colors.highlight, true: colors.primary }} thumbColor="#FFFFFF" />
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
            {!loading && <GradientFill borderRadius={12} />}
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Menu Item'}</Text>
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  imageUpload: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.card, elevation: 2 },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.highlight },
  imagePlaceholderText: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.highlight },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  chipContainer: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.highlight },
  chipActive: { backgroundColor: 'transparent', borderColor: '#9C7C1A', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#1A1000' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2 },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  toggleDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  saveButton: { backgroundColor: 'transparent', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#1A1000' },
});
