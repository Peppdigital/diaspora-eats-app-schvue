import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';

type VendorProfile = {
  id: string;
  name: string;
  rating_average?: number;
  rating?: number;
  rating_count?: number;
  review_count?: number;
};

export default function VendorDashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[VendorDashboard] Fetching vendor profile');
    api.get('/api-vendors/me')
      .then((data) => {
        const v: VendorProfile = data?.vendor || data;
        console.log('[VendorDashboard] Loaded vendor:', v?.name);
        setVendor(v);
      })
      .catch((err: unknown) => {
        console.log('[VendorDashboard] Could not load vendor profile:', err instanceof Error ? err.message : err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    console.log('[VendorDashboard] Sign out pressed');
    await signOut();
    router.replace('/welcome');
  };

  const vendorName = vendor?.name || user?.full_name || 'Your Vendor';
  const rating = Number(vendor?.rating_average ?? vendor?.rating ?? 0).toFixed(1);
  const reviewCount = vendor?.rating_count ?? vendor?.review_count ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.vendorName}>{vendorName}</Text>
            </View>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <IconSymbol ios_icon_name="arrow.right.square" android_material_icon_name="logout" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 24 }} />}

          {vendor && (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={32} color="#FFD700" />
                <Text style={styles.statValue}>{rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statCard}>
                <IconSymbol ios_icon_name="person.3.fill" android_material_icon_name="group" size={32} color={colors.primary} />
                <Text style={styles.statValue}>{reviewCount}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              console.log('[VendorDashboard] View Orders pressed');
              router.push('/vendor-orders');
            }}>
              <View style={styles.actionButtonLeft}>
                <IconSymbol ios_icon_name="list.bullet" android_material_icon_name="list" size={24} color={colors.primary} />
                <Text style={styles.actionButtonText}>View Active Orders</Text>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              console.log('[VendorDashboard] Manage Menu pressed');
              router.push('/vendor-menu');
            }}>
              <View style={styles.actionButtonLeft}>
                <IconSymbol ios_icon_name="book.fill" android_material_icon_name="menu_book" size={24} color={colors.primary} />
                <Text style={styles.actionButtonText}>Manage Menu</Text>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              console.log('[VendorDashboard] Vendor Profile pressed');
              router.push('/vendor-profile');
            }}>
              <View style={styles.actionButtonLeft}>
                <IconSymbol ios_icon_name="building.2.fill" android_material_icon_name="store" size={24} color={colors.primary} />
                <Text style={styles.actionButtonText}>Vendor Profile</Text>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  greeting: { fontSize: 16, color: colors.textSecondary, marginBottom: 4 },
  vendorName: { fontSize: 28, fontWeight: '700', color: colors.text },
  signOutButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  statCard: { flex: 1, minWidth: '47%', backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 32, fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 },
  actionButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  actionButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
});
