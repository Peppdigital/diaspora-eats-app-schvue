
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { GradientFill } from '@/components/GradientFill';
import { MOCK_MENU_ITEMS } from '@/constants/MockMenuData';
import { MOCK_VENDORS } from '@/constants/MockVendorData';
import { useCart } from '@/contexts/CartContext';
import * as Haptics from 'expo-haptics';

export default function MenuItemDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { addItem } = useCart();
  
  const itemId = params.id as string;
  const menuItem = MOCK_MENU_ITEMS.find(item => item.id === itemId);
  const vendor = menuItem ? MOCK_VENDORS.find(v => v.id === menuItem.vendor_id) : null;

  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!menuItem || !vendor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(menuItem, quantity, specialInstructions);
    router.back();
  };

  const incrementQuantity = () => {
    Haptics.selectionAsync();
    setQuantity(q => q + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      Haptics.selectionAsync();
      setQuantity(q => q - 1);
    }
  };

  const getSpicyColor = (level: string) => {
    switch (level) {
      case 'Extra Hot': return '#FF0000';
      case 'Hot': return '#FF4500';
      case 'Medium': return '#FF8C00';
      case 'Mild': return '#FFA500';
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
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
        </View>

        {/* Image */}
        {menuItem.item_image && (
          <Image 
            source={{ uri: menuItem.item_image }} 
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Name and Price */}
          <View style={styles.titleRow}>
            <Text style={styles.name}>{menuItem.name}</Text>
            <Text style={styles.price}>${menuItem.price.toFixed(2)}</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{menuItem.diaspora_segment_tag}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{menuItem.cuisine_tag}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{menuItem.description}</Text>

          {/* Dietary Badges */}
          <View style={styles.badgesRow}>
            {menuItem.spicy_level !== 'None' && (
              <View style={[styles.badge, { borderColor: getSpicyColor(menuItem.spicy_level) }]}>
                <IconSymbol 
                  ios_icon_name="flame.fill" 
                  android_material_icon_name="local-fire-department"
                  size={16} 
                  color={getSpicyColor(menuItem.spicy_level)}
                />
                <Text style={[styles.badgeText, { color: getSpicyColor(menuItem.spicy_level) }]}>
                  {menuItem.spicy_level}
                </Text>
              </View>
            )}
            {menuItem.is_vegetarian && (
              <View style={styles.badge}>
                <IconSymbol 
                  ios_icon_name="leaf.fill" 
                  android_material_icon_name="eco"
                  size={16} 
                  color="#4CAF50"
                />
                <Text style={[styles.badgeText, { color: '#4CAF50' }]}>Vegetarian</Text>
              </View>
            )}
            {menuItem.is_vegan && (
              <View style={styles.badge}>
                <IconSymbol 
                  ios_icon_name="leaf.fill" 
                  android_material_icon_name="eco"
                  size={16} 
                  color="#4CAF50"
                />
                <Text style={[styles.badgeText, { color: '#4CAF50' }]}>Vegan</Text>
              </View>
            )}
            {menuItem.is_gluten_free && (
              <View style={styles.badge}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle"
                  size={16} 
                  color="#2196F3"
                />
                <Text style={[styles.badgeText, { color: '#2196F3' }]}>Gluten Free</Text>
              </View>
            )}
          </View>

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={decrementQuantity}
              >
                <IconSymbol 
                  ios_icon_name="minus" 
                  android_material_icon_name="remove"
                  size={20} 
                  color={colors.text}
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={incrementQuantity}
              >
                <IconSymbol 
                  ios_icon_name="plus" 
                  android_material_icon_name="add"
                  size={20} 
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Special Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any special requests? (e.g., no onions, extra spicy)"
              placeholderTextColor={colors.textSecondary}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Spacer for button */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCart}
        >
          <GradientFill borderRadius={12} />
          <Text style={styles.addButtonText}>
            Add to Cart • ${(menuItem.price * quantity).toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
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
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: colors.highlight,
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginRight: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.highlight,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.highlight,
    minHeight: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.highlight,
  },
  addButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1000',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
});
