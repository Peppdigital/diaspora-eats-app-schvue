
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { useAuth } from '@/contexts/AuthContext';

// Mock vendor stats
const MOCK_STATS = {
  todayOrders: 12,
  activeOrders: 5,
  weekRevenue: 1245.50,
  totalOrders: 156,
};

export default function VendorDashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.vendorName}>Mama Oliseh&apos;s Kitchen</Text>
            </View>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <IconSymbol 
                ios_icon_name="arrow.right.square" 
                android_material_icon_name="logout"
                size={24} 
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="calendar" 
                android_material_icon_name="today"
                size={32} 
                color={colors.primary}
              />
              <Text style={styles.statValue}>{MOCK_STATS.todayOrders}</Text>
              <Text style={styles.statLabel}>Today&apos;s Orders</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="schedule"
                size={32} 
                color={colors.accent}
              />
              <Text style={styles.statValue}>{MOCK_STATS.activeOrders}</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="dollarsign.circle.fill" 
                android_material_icon_name="attach_money"
                size={32} 
                color="#34C759"
              />
              <Text style={styles.statValue}>${MOCK_STATS.weekRevenue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="bag.fill" 
                android_material_icon_name="shopping_bag"
                size={32} 
                color={colors.secondary}
              />
              <Text style={styles.statValue}>{MOCK_STATS.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/vendor-orders')}
            >
              <View style={styles.actionButtonLeft}>
                <IconSymbol 
                  ios_icon_name="list.bullet" 
                  android_material_icon_name="list"
                  size={24} 
                  color={colors.primary}
                />
                <Text style={styles.actionButtonText}>View Active Orders</Text>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron_right"
                size={20} 
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => console.log('Manage Menu')}
            >
              <View style={styles.actionButtonLeft}>
                <IconSymbol 
                  ios_icon_name="book.fill" 
                  android_material_icon_name="menu_book"
                  size={24} 
                  color={colors.primary}
                />
                <Text style={styles.actionButtonText}>Manage Menu</Text>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron_right"
                size={20} 
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => console.log('View Profile')}
            >
              <View style={styles.actionButtonLeft}>
                <IconSymbol 
                  ios_icon_name="building.2.fill" 
                  android_material_icon_name="store"
                  size={24} 
                  color={colors.primary}
                />
                <Text style={styles.actionButtonText}>Vendor Profile</Text>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron_right"
                size={20} 
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
