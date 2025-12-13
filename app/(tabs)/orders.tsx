
import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { OrderStatus } from "@/types/database.types";

// Mock orders data
const MOCK_ORDERS = [
  {
    id: 'ORD-1234567890',
    orderNumber: 'DB-CA-000123',
    vendorName: 'Mama Oliseh\'s Kitchen',
    status: 'in_progress' as OrderStatus,
    total: 63.46,
    date: new Date().toISOString(),
    items: 3,
    orderType: 'delivery' as const,
  },
  {
    id: 'ORD-1234567891',
    orderNumber: 'DB-CA-000122',
    vendorName: 'Island Spice',
    status: 'completed' as OrderStatus,
    total: 45.99,
    date: new Date(Date.now() - 86400000).toISOString(),
    items: 2,
    orderType: 'pickup' as const,
  },
  {
    id: 'ORD-1234567892',
    orderNumber: 'DB-CA-000121',
    vendorName: 'Soul Food Kitchen',
    status: 'completed' as OrderStatus,
    total: 32.50,
    date: new Date(Date.now() - 172800000).toISOString(),
    items: 4,
    orderType: 'delivery' as const,
  },
];

export default function OrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.dark;
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const filteredOrders = MOCK_ORDERS.filter(order => {
    if (filter === 'active') {
      return ['pending', 'accepted', 'in_progress', 'ready_for_pickup', 'out_for_delivery'].includes(order.status);
    } else if (filter === 'past') {
      return ['completed', 'cancelled'].includes(order.status);
    }
    return true;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in_progress':
      case 'accepted':
        return colors.accent;
      case 'pending':
        return '#FF9500';
      case 'ready_for_pickup':
      case 'out_for_delivery':
        return '#007AFF';
      case 'cancelled':
        return '#FF3B30';
      default:
        return textSecondaryColor;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            My Orders
          </Text>
          <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
            Track your order history
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterText,
              { color: filter === 'all' ? '#FFFFFF' : textSecondaryColor },
            ]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'active' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilter('active')}
          >
            <Text style={[
              styles.filterText,
              { color: filter === 'active' ? '#FFFFFF' : textSecondaryColor },
            ]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'past' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilter('past')}
          >
            <Text style={[
              styles.filterText,
              { color: filter === 'past' ? '#FFFFFF' : textSecondaryColor },
            ]}>
              Past
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <View style={styles.ordersList}>
            {filteredOrders.map((order, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[styles.orderCard, { backgroundColor: cardColor }]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/order-status?id=${order.id}`)}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={[styles.vendorName, { color: textColor }]}>
                        {order.vendorName}
                      </Text>
                      <Text style={[styles.orderNumber, { color: textSecondaryColor }]}>
                        Order #{order.orderNumber}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusText(order.status)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="clock"
                        android_material_icon_name="schedule"
                        size={14}
                        color={textSecondaryColor}
                      />
                      <Text style={[styles.detailText, { color: textSecondaryColor }]}>
                        {formatDate(order.date)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name={order.orderType === 'delivery' ? 'car.fill' : 'bag.fill'}
                        android_material_icon_name={order.orderType === 'delivery' ? 'local_shipping' : 'shopping_bag'}
                        size={14}
                        color={textSecondaryColor}
                      />
                      <Text style={[styles.detailText, { color: textSecondaryColor }]}>
                        {order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="dollarsign.circle.fill"
                        android_material_icon_name="attach_money"
                        size={14}
                        color={textSecondaryColor}
                      />
                      <Text style={[styles.detailText, { color: textSecondaryColor }]}>
                        ${order.total.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewDetailsRow}>
                    <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
                      View Details
                    </Text>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="bag"
              android_material_icon_name="shopping_bag"
              size={64}
              color={textSecondaryColor}
            />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No Orders Yet
            </Text>
            <Text style={[styles.emptyText, { color: textSecondaryColor }]}>
              Start exploring and place your first order!
            </Text>
          </View>
        )}

        {/* Bottom Padding for Tab Bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
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
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 120,
  },
});
