import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { api } from '@/utils/api';

type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';

type OrderItem = {
  id?: string;
  name?: string;
  name_snapshot?: string;
  quantity: number;
  price?: number;
  unit_price_snapshot?: number;
  line_total?: number;
};

type ApiOrder = {
  id: string;
  order_number?: string;
  vendor_name?: string;
  vendor_address?: string;
  vendor_phone?: string;
  status?: OrderStatus;
  order_status?: OrderStatus;
  order_type?: 'pickup' | 'delivery';
  placed_at?: string;
  created_at?: string;
  estimated_delivery_time?: string;
  estimated_ready_time?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  subtotal?: number;
  subtotal_amount?: number;
  tax?: number;
  tax_amount?: number;
  delivery_fee?: number;
  total?: number;
  total_amount?: number;
};

const STATUS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'completed', label: 'Completed' },
];

export default function OrderStatusScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    console.log('[OrderStatus] Fetching order:', orderId);
    api.get(`/api-orders/${orderId}`)
      .then((data) => {
        const o: ApiOrder = data?.order || data;
        console.log('[OrderStatus] Loaded order:', o?.order_number || o?.id);
        setOrder(o);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load order';
        console.log('[OrderStatus] Fetch error:', msg);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Status</Text>
            <View style={{ width: 40 }} />
          </View>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>{error || 'Order not found'}</Text>
        </View>
      </View>
    );
  }

  const status = (order.status || order.order_status || 'pending') as OrderStatus;
  const orderType = order.order_type || 'pickup';
  const items: OrderItem[] = order.items || order.order_items || [];
  const subtotal = Number(order.subtotal ?? order.subtotal_amount ?? 0);
  const tax = Number(order.tax ?? order.tax_amount ?? 0);
  const deliveryFee = Number(order.delivery_fee ?? 0);
  const total = Number(order.total ?? order.total_amount ?? 0);
  const placedAt = order.placed_at || order.created_at || '';
  const estimatedTime = order.estimated_delivery_time || order.estimated_ready_time || '';

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.status === status);

  const handleCallVendor = () => {
    if (order.vendor_phone) {
      console.log('[OrderStatus] Call vendor tapped:', order.vendor_phone);
      Linking.openURL(`tel:${order.vendor_phone}`);
    }
  };

  const handleGetDirections = () => {
    if (!order.vendor_address) return;
    console.log('[OrderStatus] Get directions tapped');
    const address = encodeURIComponent(order.vendor_address);
    const url = Platform.select({
      ios: `maps://app?daddr=${address}`,
      android: `google.navigation:q=${address}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${address}`,
    });
    Linking.openURL(url as string);
  };

  const getItemName = (item: OrderItem) => item.name || item.name_snapshot || 'Item';
  const getItemPrice = (item: OrderItem) => Number(item.line_total ?? (item.price ?? item.unit_price_snapshot ?? 0) * item.quantity);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Status</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.orderNumberCard}>
            <Text style={styles.orderNumberLabel}>Order Number</Text>
            <Text style={styles.orderNumber}>{order.order_number || order.id.slice(0, 8).toUpperCase()}</Text>
            {placedAt !== '' && (
              <Text style={styles.orderDate}>Placed {new Date(placedAt).toLocaleString()}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Progress</Text>
            <View style={styles.progressTracker}>
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <View key={index} style={styles.progressStep}>
                    <View style={styles.stepIndicator}>
                      <View style={[styles.stepCircle, isCompleted && styles.stepCircleCompleted, isCurrent && styles.stepCircleCurrent]}>
                        {isCompleted && <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#FFFFFF" />}
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View style={[styles.stepLine, isCompleted && styles.stepLineCompleted]} />
                      )}
                    </View>
                    <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>{step.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {order.vendor_name && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vendor</Text>
              <View style={styles.vendorCard}>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{order.vendor_name}</Text>
                  {order.vendor_address && <Text style={styles.vendorAddress}>{order.vendor_address}</Text>}
                </View>
                <View style={styles.vendorActions}>
                  {order.vendor_phone && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleCallVendor}>
                      <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={20} color={colors.primary} />
                      <Text style={styles.actionButtonText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {order.vendor_address && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
                      <IconSymbol ios_icon_name="map.fill" android_material_icon_name="map" size={20} color={colors.primary} />
                      <Text style={styles.actionButtonText}>Directions</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

          {items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              <View style={styles.itemsCard}>
                {items.map((item, index) => {
                  const itemName = getItemName(item);
                  const itemTotal = getItemPrice(item).toFixed(2);
                  return (
                    <View key={index} style={styles.orderItem}>
                      <Text style={styles.orderItemName}>{item.quantity}x {itemName}</Text>
                      <Text style={styles.orderItemPrice}>${itemTotal}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCard}>
              {subtotal > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                </View>
              )}
              {tax > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                </View>
              )}
              {orderType === 'delivery' && deliveryFee > 0 && (
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
          </View>

          {estimatedTime !== '' && (
            <View style={styles.estimateCard}>
              <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={24} color={colors.primary} />
              <View style={styles.estimateInfo}>
                <Text style={styles.estimateLabel}>{orderType === 'delivery' ? 'Estimated Delivery' : 'Estimated Pickup'}</Text>
                <Text style={styles.estimateTime}>
                  {new Date(estimatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}

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
  orderNumberCard: { backgroundColor: colors.card, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 24 },
  orderNumberLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  orderNumber: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  orderDate: { fontSize: 12, color: colors.textSecondary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
  progressTracker: { backgroundColor: colors.card, borderRadius: 12, padding: 20 },
  progressStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  stepIndicator: { alignItems: 'center', marginRight: 16 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.highlight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.highlight },
  stepCircleCompleted: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepCircleCurrent: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepLine: { width: 2, height: 40, backgroundColor: colors.highlight, marginTop: 4 },
  stepLineCompleted: { backgroundColor: colors.primary },
  stepLabel: { fontSize: 16, color: colors.textSecondary, paddingTop: 6 },
  stepLabelCurrent: { color: colors.text, fontWeight: '600' },
  vendorCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  vendorInfo: { marginBottom: 16 },
  vendorName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  vendorAddress: { fontSize: 14, color: colors.textSecondary },
  vendorActions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: colors.highlight, borderRadius: 8 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  itemsCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderItemName: { fontSize: 14, color: colors.text, flex: 1 },
  orderItemPrice: { fontSize: 14, fontWeight: '600', color: colors.primary },
  summaryCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: colors.textSecondary },
  summaryValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.highlight },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  estimateCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.highlight, borderRadius: 12, padding: 16 },
  estimateInfo: { flex: 1 },
  estimateLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  estimateTime: { fontSize: 18, fontWeight: '700', color: colors.primary },
});
