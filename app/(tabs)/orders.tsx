import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';

type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';

type ApiOrder = {
  id: string;
  order_number?: string;
  vendor_name?: string;
  status?: OrderStatus;
  order_status?: OrderStatus;
  total?: number;
  total_amount?: number;
  created_at?: string;
  placed_at?: string;
  item_count?: number;
  order_type?: 'pickup' | 'delivery';
};

export default function OrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.dark;
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const fetchOrders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    console.log('[Orders] Fetching orders for user:', user.id);
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api-orders');
      const list: ApiOrder[] = data?.orders || data || [];
      console.log('[Orders] Loaded', list.length, 'orders');
      setOrders(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      console.log('[Orders] Fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(fetchOrders);

  const getStatus = (o: ApiOrder): OrderStatus => (o.status || o.order_status || 'pending') as OrderStatus;
  const getTotal = (o: ApiOrder) => Number(o.total ?? o.total_amount ?? 0);
  const getDate = (o: ApiOrder) => o.created_at || o.placed_at || '';

  const filteredOrders = orders.filter((order) => {
    const status = getStatus(order);
    if (filter === 'active') return ['pending', 'accepted', 'in_progress', 'ready_for_pickup', 'out_for_delivery'].includes(status);
    if (filter === 'past') return ['completed', 'cancelled'].includes(status);
    return true;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'in_progress': case 'accepted': return colors.accent;
      case 'pending': return '#FF9500';
      case 'ready_for_pickup': case 'out_for_delivery': return '#007AFF';
      case 'cancelled': return '#FF3B30';
      default: return textSecondaryColor;
    }
  };

  const getStatusText = (status: OrderStatus) =>
    status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.emptyState}>
          <IconSymbol ios_icon_name="bag" android_material_icon_name="shopping_bag" size={64} color={textSecondaryColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>Sign In to View Orders</Text>
          <TouchableOpacity style={[styles.signInButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/customer-auth')}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>My Orders</Text>
          <Text style={[styles.subtitle, { color: textSecondaryColor }]}>Track your order history</Text>
        </View>

        <View style={styles.filterContainer}>
          {(['all', 'active', 'past'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && { backgroundColor: colors.primary }]}
              onPress={() => {
                console.log('[Orders] Filter changed:', f);
                setFilter(f);
              }}
            >
              <Text style={[styles.filterText, { color: filter === f ? '#FFFFFF' : textSecondaryColor }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>}

        {error !== '' && !loading && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: textSecondaryColor }]}>{error}</Text>
            <TouchableOpacity onPress={fetchOrders} style={[styles.signInButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.signInButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && error === '' && filteredOrders.length > 0 && (
          <View style={styles.ordersList}>
            {filteredOrders.map((order) => {
              const status = getStatus(order);
              const total = getTotal(order);
              const dateStr = getDate(order);
              const statusColor = getStatusColor(status);
              const statusText = getStatusText(status);
              const totalDisplay = Number(total).toFixed(2);
              const dateDisplay = formatDate(dateStr);
              const orderType = order.order_type || 'pickup';
              return (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.orderCard, { backgroundColor: cardColor }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    console.log('[Orders] Order tapped:', order.id);
                    router.push(`/order-status?id=${order.id}`);
                  }}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={[styles.vendorName, { color: textColor }]}>{order.vendor_name || 'Order'}</Text>
                      <Text style={[styles.orderNumber, { color: textSecondaryColor }]}>
                        {order.order_number ? `Order #${order.order_number}` : `#${order.id.slice(0, 8)}`}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                  </View>
                  <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="clock" android_material_icon_name="schedule" size={14} color={textSecondaryColor} />
                      <Text style={[styles.detailText, { color: textSecondaryColor }]}>{dateDisplay}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name={orderType === 'delivery' ? 'car.fill' : 'bag.fill'}
                        android_material_icon_name={orderType === 'delivery' ? 'local_shipping' : 'shopping_bag'}
                        size={14}
                        color={textSecondaryColor}
                      />
                      <Text style={[styles.detailText, { color: textSecondaryColor }]}>{orderType === 'delivery' ? 'Delivery' : 'Pickup'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach_money" size={14} color={textSecondaryColor} />
                      <Text style={[styles.detailText, { color: textSecondaryColor }]}>${totalDisplay}</Text>
                    </View>
                  </View>
                  <View style={styles.viewDetailsRow}>
                    <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Details</Text>
                    <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!loading && error === '' && filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="bag" android_material_icon_name="shopping_bag" size={64} color={textSecondaryColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Orders Yet</Text>
            <Text style={[styles.emptyText, { color: textSecondaryColor }]}>Start exploring and place your first order!</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: Platform.OS === 'android' ? 48 : 60, paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 15, fontWeight: '500' },
  filterContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  filterTab: { flex: 1, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.highlight, alignItems: 'center' },
  filterText: { fontSize: 14, fontWeight: '600' },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  ordersList: { gap: 12 },
  orderCard: { padding: 16, borderRadius: 12, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderInfo: { flex: 1 },
  vendorName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  orderNumber: { fontSize: 13, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderDetails: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, fontWeight: '500' },
  viewDetailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  viewDetailsText: { fontSize: 14, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  signInButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  bottomPadding: { height: 120 },
});
