import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import * as Haptics from 'expo-haptics';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    orderType,
    deliveryAddress,
    deliveryInstructions,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getTotal,
    clearCart,
  } = useCart();

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const vendorId = items.length > 0 ? items[0].menuItem.vendor_id : null;

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please sign in to checkout</Text>
          <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/auth/customer-auth')}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handlePayNow = async () => {
    if (!cardNumber || !expiryDate || !cvv) {
      Alert.alert('Error', 'Please fill in all payment details');
      return;
    }
    if (!vendorId) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    console.log('[Checkout] Pay Now pressed, vendor:', vendorId, 'items:', items.length);
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const orderPayload = {
        vendor_id: vendorId,
        items: items.map((item) => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          special_instructions: item.specialInstructions || '',
        })),
        delivery_address: orderType === 'delivery' && deliveryAddress
          ? `${deliveryAddress.line1}${deliveryAddress.line2 ? ', ' + deliveryAddress.line2 : ''}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zip}`
          : undefined,
        delivery_instructions: deliveryInstructions || undefined,
        order_type: orderType,
      };

      console.log('[Checkout] Placing order:', JSON.stringify(orderPayload));
      const data = await api.post('/api-orders', orderPayload);
      const orderId = data?.order?.id || data?.id;
      console.log('[Checkout] Order placed successfully, id:', orderId);

      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Order Placed!',
        'Your order has been placed successfully.',
        [{ text: 'View Order', onPress: () => router.replace(`/order-status?id=${orderId}`) }]
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      console.log('[Checkout] Order error:', msg);
      Alert.alert('Error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = getSubtotal();
  const tax = getTax();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.itemsList}>
              {items.map((item, index) => {
                const itemTotal = (item.menuItem.price * item.quantity).toFixed(2);
                return (
                  <View key={index} style={styles.orderItem}>
                    <Text style={styles.orderItemName}>{item.quantity}x {item.menuItem.name}</Text>
                    <Text style={styles.orderItemPrice}>${itemTotal}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{orderType === 'delivery' ? 'Delivery Address' : 'Pickup Location'}</Text>
            {orderType === 'delivery' && deliveryAddress ? (
              <View style={styles.addressCard}>
                <Text style={styles.addressText}>{deliveryAddress.line1}</Text>
                {deliveryAddress.line2 && <Text style={styles.addressText}>{deliveryAddress.line2}</Text>}
                <Text style={styles.addressText}>{deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zip}</Text>
                {deliveryInstructions !== '' && <Text style={styles.instructionsText}>{deliveryInstructions}</Text>}
              </View>
            ) : (
              <View style={styles.addressCard}>
                <Text style={styles.addressText}>Pickup at vendor location</Text>
              </View>
            )}
            <Text style={styles.estimateText}>
              {orderType === 'delivery' ? 'Estimated delivery: 30-45 minutes' : 'Estimated pickup: 15-20 minutes'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <IconSymbol ios_icon_name="creditcard.fill" android_material_icon_name="credit_card" size={24} color={colors.primary} />
                <Text style={styles.paymentLabel}>Card Payment</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Card Number"
                placeholderTextColor={colors.textSecondary}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="number-pad"
                maxLength={16}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textSecondary}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="CVV"
                  placeholderTextColor={colors.textSecondary}
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            {orderType === 'delivery' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={isProcessing}
        >
          <Text style={styles.payButtonText}>
            {isProcessing ? 'Processing...' : `Pay Now • $${total.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
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
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
  itemsList: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderItemName: { fontSize: 14, color: colors.text, flex: 1 },
  orderItemPrice: { fontSize: 14, fontWeight: '600', color: colors.primary },
  addressCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 8 },
  addressText: { fontSize: 14, color: colors.text, marginBottom: 4 },
  instructionsText: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', marginTop: 8 },
  estimateText: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
  paymentCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  paymentLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  input: { backgroundColor: colors.background, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.highlight, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: colors.textSecondary },
  summaryValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.highlight },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  footer: { padding: 20, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.highlight },
  payButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 18, alignItems: 'center' },
  payButtonDisabled: { opacity: 0.5 },
  payButtonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 18, color: colors.textSecondary, marginBottom: 20 },
  signInButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  signInButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
