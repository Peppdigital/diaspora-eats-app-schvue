import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { api } from '@/utils/api';
import { GradientFill } from '@/components/GradientFill';
import * as Haptics from 'expo-haptics';

type ApiVendor = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  vendor_type?: string;
  onboarding_status?: string;
  is_active?: boolean;
  diaspora_focus?: string[];
};

export default function AdminVendorsScreen() {
  const router = useRouter();
  const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVendors = useCallback(async () => {
    console.log('[AdminVendors] Fetching vendors');
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api-vendors');
      const list: ApiVendor[] = data?.vendors || data || [];
      console.log('[AdminVendors] Loaded', list.length, 'vendors');
      setVendors(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load vendors';
      console.log('[AdminVendors] Fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchVendors();
  }, [fetchVendors]));

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      (vendor.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && vendor.onboarding_status === 'pending') ||
      (filterStatus === 'active' && vendor.onboarding_status === 'active');
    return matchesSearch && matchesStatus;
  });

  const handleDeleteVendor = (vendorId: string, vendorName: string) => {
    console.log('[AdminVendors] Delete vendor pressed:', vendorId, vendorName);
    Alert.alert('Delete Vendor', `Are you sure you want to delete "${vendorName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api-vendors/${vendorId}`);
            console.log('[AdminVendors] Vendor deleted:', vendorId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setVendors((prev) => prev.filter((v) => v.id !== vendorId));
            Alert.alert('Success', 'Vendor deleted');
          } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'invited': return '#007AFF';
      case 'claimed': return '#5856D6';
      case 'active': return '#34C759';
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vendor Management</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => {
              console.log('[AdminVendors] Add vendor pressed');
              router.push('/admin-create-vendor');
            }}>
              <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
            <TextInput style={styles.searchInput} placeholder="Search vendors..." placeholderTextColor={colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          <View style={styles.filtersSection}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {(['all', 'pending', 'active'] as const).map((f) => {
                  const isActive = filterStatus === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => {
                        console.log('[AdminVendors] Filter changed:', f);
                        setFilterStatus(f);
                      }}
                    >
                      {isActive && <GradientFill borderRadius={20} />}
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                        {f === 'all' ? 'All Status' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {loading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>}

          {error !== '' && !loading && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchVendors}>
                <GradientFill borderRadius={12} />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && error === '' && (
            <View style={styles.vendorsList}>
              <Text style={styles.resultsCount}>{filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}</Text>
              {filteredVendors.map((vendor) => {
                const statusColor = getStatusColor(vendor.onboarding_status);
                const statusDisplay = (vendor.onboarding_status || 'unknown').toUpperCase();
                return (
                  <View key={vendor.id} style={styles.vendorCard}>
                    <View style={styles.vendorHeader}>
                      <View style={styles.vendorInfo}>
                        <Text style={styles.vendorName}>{vendor.name}</Text>
                        <Text style={styles.vendorLocation}>{vendor.city || ''}{vendor.state ? `, ${vendor.state}` : ''}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusDisplay}</Text>
                      </View>
                    </View>
                    <View style={styles.vendorMeta}>
                      {vendor.vendor_type && (
                        <View style={styles.metaItem}>
                          <IconSymbol
                            ios_icon_name={vendor.vendor_type === 'restaurant' ? 'fork.knife' : 'cart.fill'}
                            android_material_icon_name={vendor.vendor_type === 'restaurant' ? 'restaurant' : 'shopping-cart'}
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.metaText}>{vendor.vendor_type}</Text>
                        </View>
                      )}
                      {vendor.diaspora_focus && vendor.diaspora_focus.length > 0 && (
                        <View style={styles.metaItem}>
                          <IconSymbol ios_icon_name="tag.fill" android_material_icon_name="label" size={14} color={colors.textSecondary} />
                          <Text style={styles.metaText}>{vendor.diaspora_focus.join(', ')}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.vendorActions}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteVendor(vendor.id, vendor.name)}
                      >
                        <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={16} color="#FF3B30" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
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
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 20, gap: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  filtersSection: { marginBottom: 20 },
  filtersTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  filterChips: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.highlight },
  filterChipActive: { backgroundColor: 'transparent', borderColor: '#9C7C1A', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  filterChipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  filterChipTextActive: { color: '#1A1000' },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  errorContainer: { paddingVertical: 40, alignItems: 'center' },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: 'transparent', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  retryButtonText: { color: '#1A1000', fontWeight: '700', fontSize: 14 },
  vendorsList: { gap: 16 },
  resultsCount: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  vendorCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, elevation: 2 },
  vendorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  vendorLocation: { fontSize: 14, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  vendorMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' },
  vendorActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.highlight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  deleteButtonText: { fontSize: 14, fontWeight: '600', color: '#FF3B30' },
});
