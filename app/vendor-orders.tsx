
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { OrderStatus } from '@/types/database.types';
import * as Haptics from 'expo-haptics';

// Mock orders for vendor
const MOCK_VENDOR_ORDERS = [
  {
    id: 'ORD-1',
    order_number: 'DB-CA-000123',
    customer_name: 'John Doe',
    order_type: 'delivery' as const,
    status: 'pending' as OrderStatus,
    total: 63.46,
    placed_at: new Date().toISOString(),
    items: [
      { name: 'Jollof Rice with Chicken', quantity: 2 },
      { name: 'Egusi Soup', quantity: 1 },
    ],
  },
  {
    id: 'ORD-2',
    order_number: 'DB-CA-000124',
    customer_name: 'Jane Smith',
    order_type: 'pickup' as const,
    status: 'in_progress' as OrderStatus,
    total: 45.99,
    placed_at: new Date(Date.now() - 1800000).toISOString(),
    items: [
      { name: 'Fried Rice', quantity: 2 },
      { name: 'Puff Puff', quantity: 1 },
    ],
  },
];

export default function VendorOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState(MOCK_VENDOR_ORDERS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'active') return ['accepted', 'in_progress', 'ready_for_pickup', 'out_for_delivery'].includes(order.status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(order.status);
    return true;
  });

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    Alert.alert('Success', `Order status updated to ${newStatus}`);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'accepted': return '#007AFF';
      case 'in_progress': return colors.accent;
      case 'ready_for_pickup':
      case 'out_for_delivery': return '#5856D6';
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
      case 'ready_for_pickup':
      case 'out_for_delivery': return 'completed';
      default: return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <Text style={styles.headerTitle}>Orders</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
              onPress={() => setFilter('pending')}
            >
              <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
              onPress={() => setFilter('active')}
            >
              <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
              onPress={() => setFilter('completed')}
            >
              <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
                Completed
              </Text>
            </TouchableOpacity>
          </View>

          {/* Orders List */}
          {filteredOrders.length > 0 ? (
            <View style={styles.ordersList}>
              {filteredOrders.map((order, index) => {
                const nextStatus = getNextStatus(order.status, order.order_type);
                
                return (
                  <View key={index} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderNumber}>#{order.order_number}</Text>
                        <Text style={styles.customerName}>{order.customer_name}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderMeta}>
                      <View style={styles.metaItem}>
                        <IconSymbol 
                          ios_icon_name="clock" 
                          android_material_icon_name="schedule"
                          size={14} 
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>{formatTime(order.placed_at)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <IconSymbol 
                          ios_icon_name={order.order_type === 'delivery' ? 'car.fill' : 'bag.fill'}
                          android_material_icon_name={order.order_type === 'delivery' ? 'local_shipping' : 'shopping_bag'}
                          size={14} 
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>{order.order_type}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <IconSymbol 
                          ios_icon_name="dollarsign.circle.fill" 
                          android_material_icon_name="attach_money"
                          size={14} 
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>${order.total.toFixed(2)}</Text>
                      </View>
                    </View>

                    <View style={styles.itemsList}>
                      {order.items.map((item, idx) => (
                        <Text key={idx} style={styles.itemText}>
                          {item.quantity}x {item.name}
                        </Text>
                      ))}
                    </View>

                    {nextStatus && (
                      <TouchableOpacity
                        style={styles.updateButton}
                        onPress={() => handleUpdateStatus(order.id, nextStatus)}
                      >
                        <Text style={styles.updateButtonText}>
                          Mark as {nextStatus.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleUpdateStatus(order.id, 'cancelled')}
                    >
                      <Text style={styles.cancelButtonText}>Cancel Order</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol 
                ios_icon_name="bag" 
                android_material_icon_name="shopping_bag"
                size={64} 
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No Orders</Text>
              <Text style={styles.emptyText}>
                {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
              </Text>
            </View>
          )}

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
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  ordersList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  itemsList: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.highlight,
  },
  itemText: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  cancelButton: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
  },
});
