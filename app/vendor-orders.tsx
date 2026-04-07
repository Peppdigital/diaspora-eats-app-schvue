import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { api } from '@/utils/api';
import * as Haptics from 'expo-haptics';

type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';

type OrderItem = { name?: string; name_snapshot?: string; quantity: number };

type VendorOrder = {
  id: string;
  order_number?: string;
  customer_name?: string;
  order_type?: 'pickup' | 'delivery';
  status?: OrderStatus;
  order_status?: OrderStatus;
  total?: number;
  total_amount?: number;
  placed_at?: string;
  created_at?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
};

export default function VendorOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    console.log('[VendorOrders] Fetching vendor orders');
    setLoading(true);
    setError('');
    try {
      const vendorData = await api.get('/api-vendors/me');
      const vid = vendorData?.vendor?.id || vendorData?.id;
      setVendorId(vid);
      if (!vid) throw new Error('No vendor profile found');

      const data = await api.get(`/api-vendor-orders/${vid}`);
      const list: VendorOrder[] = data?.orders || data || [];
      console.log('[VendorOrders] Loaded', list.length, 'orders for vendor:', vid);
      setOrders(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      console.log('[VendorOrders] Fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(fetchOrders);

  const getStatus = (o: VendorOrder): OrderStatus => (o.status || o.order_status || 'pending') as OrderStatus;
  const getTotal = (o: VendorOrder) => Number(o.total ?? o.total_amount ?? 0);
  const getDate = (o: VendorOrder) => o.placed_at || o.created_at || '';
  const getItems = (o: VendorOrder): OrderItem[] => o.items || o.order_items || [];

  const filteredOrders = orders.filter((order) => {
    const status = getStatus(order);
    if (filter === 'pending') return status === 'pending';
    if (filter === 'active') return ['accepted', 'in_progress', 'ready_for_pickup', 'out_for_delivery'].includes(status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(status);
    return true;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    console.log('[VendorOrders] Update status pressed:', orderId, '->', newStatus);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.patch(`/api-orders/${orderId}/status`, { status: newStatus });
      console.log('[VendorOrders] Status updated successfully');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus, order_status: newStatus } : o));
      Alert.alert('Success', `Order status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      Alert.alert('Error', msg);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'accepted': return '#007AFF';
      case 'in_progress': return colors.accent;
      case 'ready_for_pickup': case 'out_for_delivery': return '#5856D6';
      case 'completed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return colors.textSecondary;
    }
  };

  const getNextStatus = (currentStatus: OrderStatus, orderType: 'pickup' | 'delivery'): OrderStatus | null => {
    switch (currentStatus) {
      case 'pending': return 'accepted';
      case 'accepted': return 'in_progress';
      case 'in_progress': return orderType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup';
      case 'ready_for_pickup': case 'out_for_delivery': return 'completed';
      default: return null;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Orders</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.filterContainer}>
            {(['all', 'pending', 'active', 'completed'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => {
                  console.log('[VendorOrders] Filter changed:', f);
                  setFilter(f);
                }}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>}

          {error !== '' && !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && error === '' && filteredOrders.length > 0 && (
            <View style={styles.ordersList}>
              {filteredOrders.map((order) => {
                const status = getStatus(order);
                const orderType = order.order_type || 'pickup';
                const nextStatus = getNextStatus(status, orderType);
                const total = getTotal(order);
                const dateStr = getDate(order);
                const items = getItems(order);
                const statusColor = getStatusColor(status);
                const statusDisplay = status.replace(/_/g, ' ').toUpperCase();
                const nextStatusDisplay = nextStatus ? nextStatus.replace(/_/g, ' ') : '';
                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderNumber}>#{order.order_number || order.id.slice(0, 8)}</Text>
                        {order.customer_name && <Text style={styles.customerName}>{order.customer_name}</Text>}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusDisplay}</Text>
                      </View>
                    </View>
                    <View style={styles.orderMeta}>
                      {dateStr !== '' && (
                        <View style={styles.metaItem}>
                          <IconSymbol ios_icon_name="clock" android_material_icon_name="schedule" size={14} color={colors.textSecondary} />
                          <Text style={styles.metaText}>{formatTime(dateStr)}</Text>
                        </View>
                      )}
                      <View style={styles.metaItem}>
                        <IconSymbol
                          ios_icon_name={orderType === 'delivery' ? 'car.fill' : 'bag.fill'}
                          android_material_icon_name={orderType === 'delivery' ? 'local_shipping' : 'shopping_bag'}
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>{orderType}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach_money" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>${total.toFixed(2)}</Text>
                      </View>
                    </View>
                    {items.length > 0 && (
                      <View style={styles.itemsList}>
                        {items.map((item, idx) => (
                          <Text key={idx} style={styles.itemText}>{item.quantity}x {item.name || item.name_snapshot || 'Item'}</Text>
                        ))}
                      </View>
                    )}
                    {nextStatus && (
                      <TouchableOpacity style={styles.updateButton} onPress={() => handleUpdateStatus(order.id, nextStatus)}>
                        <Text style={styles.updateButtonText}>Mark as {nextStatusDisplay}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.cancelButton} onPress={() => handleUpdateStatus(order.id, 'cancelled')}>
                      <Text style={styles.cancelButtonText}>Cancel Order</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {!loading && error === '' && filteredOrders.length === 0 && (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="bag" android_material_icon_name="shopping_bag" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Orders</Text>
              <Text style={styles.emptyText}>{filter === 'all' ? 'No orders yet' : `No ${filter} orders`}</Text>
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
  filterContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterTab: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.highlight, alignItems: 'center' },
  filterTabActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: '#FFFFFF' },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  ordersList: { gap: 16 },
  orderCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderInfo: { flex: 1 },
  orderNumber: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  customerName: { fontSize: 14, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' },
  itemsList: { marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.highlight },
  itemText: { fontSize: 13, color: colors.text, marginBottom: 4 },
  updateButton: { backgroundColor: colors.primary, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 },
  updateButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', textTransform: 'capitalize' },
  cancelButton: { backgroundColor: colors.highlight, borderRadius: 8, padding: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#FF3B30' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 8 },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  retryButton: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
