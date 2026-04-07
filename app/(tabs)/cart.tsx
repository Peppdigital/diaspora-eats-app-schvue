
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { useCart } from '@/contexts/CartContext';
import { MOCK_VENDORS } from '@/constants/MockVendorData';
import * as Haptics from 'expo-haptics';

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    orderType,
    deliveryAddress,
    deliveryInstructions,
    updateItem,
    removeItem,
    setOrderType,
    setDeliveryAddress,
    setDeliveryInstructions,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getTotal,
  } = useCart();

  const [addressLine1, setAddressLine1] = useState(deliveryAddress?.line1 || '');
  const [addressLine2, setAddressLine2] = useState(deliveryAddress?.line2 || '');
  const [city, setCity] = useState(deliveryAddress?.city || '');
  const [state, setState] = useState(deliveryAddress?.state || '');
  const [zip, setZip] = useState(deliveryAddress?.zip || '');

  // Get vendor from first item
  const vendor = items.length > 0 
    ? MOCK_VENDORS.find(v => v.id === items[0].menuItem.vendor_id)
    : null;

  const handleCheckout = () => {
    if (orderType === 'delivery') {
      setDeliveryAddress({
        line1: addressLine1,
        line2: addressLine2,
        city,
        state,
        zip,
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/checkout');
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    Haptics.selectionAsync();
    updateItem(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeItem(itemId);
  };

  const canCheckout = items.length > 0 && (
    orderType === 'pickup' || 
    (orderType === 'delivery' && addressLine1 && city && state && zip)
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <IconSymbol 
            ios_icon_name="cart" 
            android_material_icon_name="shopping-cart"
            size={64} 
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add items from a restaurant or grocery store to get started</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/(home)')}
          >
            <Text style={styles.browseButtonText}>Browse Vendors</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Vendor Header */}
          {vendor && (
            <View style={styles.vendorHeader}>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              <Text style={styles.vendorAddress}>{vendor.address_line1}, {vendor.city}</Text>
            </View>
          )}

          {/* Order Type Toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Type</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[
                  styles.toggleButton,
                  orderType === 'pickup' && styles.toggleButtonActive
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setOrderType('pickup');
                }}
              >
                <IconSymbol 
                  ios_icon_name="bag" 
                  android_material_icon_name="shopping-bag"
                  size={20} 
                  color={orderType === 'pickup' ? '#FFFFFF' : colors.text}
                />
                <Text style={[
                  styles.toggleText,
                  orderType === 'pickup' && styles.toggleTextActive
                ]}>
                  Pickup
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.toggleButton,
                  orderType === 'delivery' && styles.toggleButtonActive
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setOrderType('delivery');
                }}
                disabled={!vendor?.offers_delivery}
              >
                <IconSymbol 
                  ios_icon_name="car.fill" 
                  android_material_icon_name="local-shipping"
                  size={20} 
                  color={orderType === 'delivery' ? '#FFFFFF' : colors.text}
                />
                <Text style={[
                  styles.toggleText,
                  orderType === 'delivery' && styles.toggleTextActive
                ]}>
                  Delivery
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cart Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {items.map((item, index) => (
              <View key={index} style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.menuItem.name}</Text>
                  {item.specialInstructions && (
                    <Text style={styles.itemInstructions}>{item.specialInstructions}</Text>
                  )}
                  <Text style={styles.itemPrice}>${item.menuItem.price.toFixed(2)}</Text>
                </View>
                <View style={styles.itemActions}>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity 
                      style={styles.quantityBtn}
                      onPress={() => handleUpdateQuantity(item.menuItem.id, item.quantity - 1)}
                    >
                      <IconSymbol 
                        ios_icon_name="minus" 
                        android_material_icon_name="remove"
                        size={16} 
                        color={colors.text}
                      />
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityBtn}
                      onPress={() => handleUpdateQuantity(item.menuItem.id, item.quantity + 1)}
                    >
                      <IconSymbol 
                        ios_icon_name="plus" 
                        android_material_icon_name="add"
                        size={16} 
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeBtn}
                    onPress={() => handleRemoveItem(item.menuItem.id)}
                  >
                    <IconSymbol 
                      ios_icon_name="trash" 
                      android_material_icon_name="delete"
                      size={20} 
                      color="#FF3B30"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Delivery Address */}
          {orderType === 'delivery' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Street Address"
                placeholderTextColor={colors.textSecondary}
                value={addressLine1}
                onChangeText={setAddressLine1}
              />
              <TextInput
                style={styles.input}
                placeholder="Apt, Suite, etc. (optional)"
                placeholderTextColor={colors.textSecondary}
                value={addressLine2}
                onChangeText={setAddressLine2}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  value={city}
                  onChangeText={setCity}
                />
                <TextInput
                  style={[styles.input, styles.inputQuarter]}
                  placeholder="State"
                  placeholderTextColor={colors.textSecondary}
                  value={state}
                  onChangeText={setState}
                  maxLength={2}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={[styles.input, styles.inputQuarter]}
                  placeholder="ZIP"
                  placeholderTextColor={colors.textSecondary}
                  value={zip}
                  onChangeText={setZip}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Delivery instructions (optional)"
                placeholderTextColor={colors.textSecondary}
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${getSubtotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${getTax().toFixed(2)}</Text>
            </View>
            {orderType === 'delivery' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>${getDeliveryFee().toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${getTotal().toFixed(2)}</Text>
            </View>
          </View>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.checkoutButton, !canCheckout && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={!canCheckout}
        >
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout • ${getTotal().toFixed(2)}
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
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  vendorHeader: {
    marginBottom: 24,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  vendorAddress: {
    fontSize: 14,
    color: colors.textSecondary,
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
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemInstructions: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 4,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.highlight,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 2,
  },
  inputQuarter: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.highlight,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.highlight,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
