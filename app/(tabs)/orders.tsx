
import React from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function OrdersScreen() {
  const theme = useTheme();
  const isDark = theme.dark;

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  // Mock orders data
  const orders = [
    {
      id: '1',
      orderNumber: 'DB-CA-000123',
      vendorName: 'Soul Kitchen',
      status: 'completed',
      total: 45.99,
      date: '2024-01-15',
      items: 3,
    },
    {
      id: '2',
      orderNumber: 'DB-CA-000124',
      vendorName: 'Jerk Paradise',
      status: 'in_progress',
      total: 32.50,
      date: '2024-01-16',
      items: 2,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in_progress':
        return colors.accent;
      case 'cancelled':
        return '#FF3B30';
      default:
        return textSecondaryColor;
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

        {/* Orders List */}
        {orders.length > 0 ? (
          <View style={styles.ordersList}>
            {orders.map((order, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[styles.orderCard, { backgroundColor: cardColor }]}
                  activeOpacity={0.7}
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
                        ios_icon_name="calendar"
                        android_material_icon_name="calendar_today"
                        size={14}
                        color={textSecondaryColor}
                      />
                      <Text style={[styles.detailText, { color: textSecondaryColor }]}>
                        {order.date}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="bag.fill"
                        android_material_icon_name="shopping_bag"
                        size={14}
                        color={textSecondaryColor}
                      />
                      <Text style={[styles.detailText, { color: textSecondaryColor }]}>
                        {order.items} items
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
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
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
