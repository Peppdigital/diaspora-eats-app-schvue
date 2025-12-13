
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { MenuItem, DiasporaSegment, SpicyLevel } from '@/types/database.types';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const DIASPORA_SEGMENTS: DiasporaSegment[] = ['African American', 'Caribbean', 'African', 'Pan-African', 'Other'];
const SPICY_LEVELS: SpicyLevel[] = ['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'];
const CUISINE_TAGS = ['Nigerian', 'Jamaican', 'Soul Food', 'Ethiopian', 'Ghanaian', 'Haitian', 'Trinidadian', 'Senegalese', 'Kenyan', 'Other'];

export default function VendorMenuItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { itemId, categoryId } = params;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [diasporaSegment, setDiasporaSegment] = useState<DiasporaSegment>('African');
  const [cuisineTag, setCuisineTag] = useState('Nigerian');
  const [price, setPrice] = useState('');
  const [spicyLevel, setSpicyLevel] = useState<SpicyLevel>('None');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [itemImage, setItemImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (itemId) {
      // Load existing item data
      // TODO: Fetch from database
      console.log('Loading item:', itemId);
    }
  }, [itemId]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setItemImage(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const menuItem: Partial<MenuItem> = {
      name: name.trim(),
      description: description.trim(),
      diaspora_segment_tag: diasporaSegment,
      cuisine_tag: cuisineTag,
      price: parseFloat(price),
      spicy_level: spicyLevel,
      is_vegetarian: isVegetarian,
      is_vegan: isVegan,
      is_gluten_free: isGlutenFree,
      is_available: isAvailable,
      is_highlighted: isHighlighted,
      item_image: itemImage,
    };

    // TODO: Save to database
    console.log('Saving menu item:', menuItem);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Menu item saved successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
            <Text style={styles.headerTitle}>
              {itemId ? 'Edit Menu Item' : 'Add Menu Item'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Image Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Image</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={handlePickImage}>
              {itemImage ? (
                <Image source={{ uri: itemImage }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <IconSymbol 
                    ios_icon_name="camera.fill" 
                    android_material_icon_name="add_a_photo"
                    size={40} 
                    color={colors.textSecondary}
                  />
                  <Text style={styles.imagePlaceholderText}>Tap to upload image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Jollof Rice with Chicken"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your dish..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diaspora Segment</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <View style={styles.chipContainer}>
                  {DIASPORA_SEGMENTS.map((segment, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.chip,
                        diasporaSegment === segment && styles.chipActive,
                      ]}
                      onPress={() => setDiasporaSegment(segment)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          diasporaSegment === segment && styles.chipTextActive,
                        ]}
                      >
                        {segment}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cuisine</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <View style={styles.chipContainer}>
                  {CUISINE_TAGS.map((cuisine, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.chip,
                        cuisineTag === cuisine && styles.chipActive,
                      ]}
                      onPress={() => setCuisineTag(cuisine)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          cuisineTag === cuisine && styles.chipTextActive,
                        ]}
                      >
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Spicy Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spicy Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipContainer}>
                {SPICY_LEVELS.map((level, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.chip,
                      spicyLevel === level && styles.chipActive,
                    ]}
                    onPress={() => setSpicyLevel(level)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        spicyLevel === level && styles.chipTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Dietary Flags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Information</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Vegetarian</Text>
              <Switch
                value={isVegetarian}
                onValueChange={setIsVegetarian}
                trackColor={{ false: colors.highlight, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Vegan</Text>
              <Switch
                value={isVegan}
                onValueChange={setIsVegan}
                trackColor={{ false: colors.highlight, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Gluten Free</Text>
              <Switch
                value={isGlutenFree}
                onValueChange={setIsGlutenFree}
                trackColor={{ false: colors.highlight, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Availability & Highlight */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Available</Text>
                <Text style={styles.toggleDescription}>
                  Customers can order this item
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: colors.highlight, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Featured Item</Text>
                <Text style={styles.toggleDescription}>
                  Highlight as signature dish
                </Text>
              </View>
              <Switch
                value={isHighlighted}
                onValueChange={setIsHighlighted}
                trackColor={{ false: colors.highlight, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Menu Item</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  imageUpload: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  uploadedImage: {
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
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
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
  chipScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chipContainer: {
    flexDirection: 'row',
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
  toggleDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
