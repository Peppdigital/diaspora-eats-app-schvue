
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { OrderStatus as OrderStatusType } from '@/types/database.types';

// Mock order data
const MOCK_ORDER = {
  id: 'ORD-1234567890',
  order_number: 'DB-CA-000123',
  vendor_name: 'Mama Oliseh\'s Kitchen',
  vendor_address: '123 Main Street, Los Angeles, CA 90001',
  vendor_phone: '(555) 123-4567',
  order_status: 'in_progress' as OrderStatusType,
  order_type: 'delivery' as const,
  placed_at: new Date().toISOString(),
  estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString(),
  items: [
    { name: 'Jollof Rice with Chicken', quantity: 2, price: 16.99 },
    { name: 'Egusi Soup', quantity: 1, price: 18.99 },
  ],
  subtotal: 52.97,
  tax: 4.50,
  delivery_fee: 5.99,
  total: 63.46,
};

const STATUS_STEPS: { status: OrderStatusType; label: string }[] = [
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

  const order = MOCK_ORDER;

  const getCurrentStepIndex = () => {
    return STATUS_STEPS.findIndex(step => step.status === order.order_status);
  };

  const currentStepIndex = getCurrentStepIndex();

  const handleCallVendor = () => {
    Linking.openURL(`tel:${order.vendor_phone}`);
  };

  const handleGetDirections = () => {
    const address = encodeURIComponent(order.vendor_address);
    const url = Platform.select({
      ios: `maps://app?daddr=${address}`,
      android: `google.navigation:q=${address}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${address}`,
    });
    Linking.openURL(url);
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
            <Text style={styles.headerTitle}>Order Status</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Order Number */}
          <View style={styles.orderNumberCard}>
            <Text style={styles.orderNumberLabel}>Order Number</Text>
            <Text style={styles.orderNumber}>{order.order_number}</Text>
            <Text style={styles.orderDate}>
              Placed {new Date(order.placed_at).toLocaleString()}
            </Text>
          </View>

          {/* Progress Tracker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Progress</Text>
            <View style={styles.progressTracker}>
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <View key={index} style={styles.progressStep}>
                    <View style={styles.stepIndicator}>
                      <View style={[
                        styles.stepCircle,
                        isCompleted && styles.stepCircleCompleted,
                        isCurrent && styles.stepCircleCurrent,
                      ]}>
                        {isCompleted && (
                          <IconSymbol 
                            ios_icon_name="checkmark" 
                            android_material_icon_name="check"
                            size={16} 
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View style={[
                          styles.stepLine,
                          isCompleted && styles.stepLineCompleted,
                        ]} />
                      )}
                    </View>
                    <Text style={[
                      styles.stepLabel,
                      isCurrent && styles.stepLabelCurrent,
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Vendor Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendor</Text>
            <View style={styles.vendorCard}>
              <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>{order.vendor_name}</Text>
                <Text style={styles.vendorAddress}>{order.vendor_address}</Text>
              </View>
              <View style={styles.vendorActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleCallVendor}
                >
                  <IconSymbol 
                    ios_icon_name="phone.fill" 
                    android_material_icon_name="phone"
                    size={20} 
                    color={colors.primary}
                  />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleGetDirections}
                >
                  <IconSymbol 
                    ios_icon_name="map.fill" 
                    android_material_icon_name="map"
                    size={20} 
                    color={colors.primary}
                  />
                  <Text style={styles.actionButtonText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.itemsCard}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <Text style={styles.orderItemName}>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
              </View>
              {order.order_type === 'delivery' && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>${order.delivery_fee.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Estimated Time */}
          {order.estimated_delivery_time && (
            <View style={styles.estimateCard}>
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="schedule"
                size={24} 
                color={colors.primary}
              />
              <View style={styles.estimateInfo}>
                <Text style={styles.estimateLabel}>
                  {order.order_type === 'delivery' ? 'Estimated Delivery' : 'Estimated Pickup'}
                </Text>
                <Text style={styles.estimateTime}>
                  {new Date(order.estimated_delivery_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
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
  orderNumberCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  orderNumberLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 12,
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
  progressTracker: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.highlight,
  },
  stepCircleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.highlight,
    marginTop: 4,
  },
  stepLineCompleted: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    paddingTop: 6,
  },
  stepLabelCurrent: {
    color: colors.text,
    fontWeight: '600',
  },
  vendorCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  vendorInfo: {
    marginBottom: 16,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  vendorAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  vendorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.highlight,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  itemsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
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
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
  },
  estimateInfo: {
    flex: 1,
  },
  estimateLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  estimateTime: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
});
