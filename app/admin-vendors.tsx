
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { Vendor, OnboardingStatus, VendorType, DiasporaSegment } from '@/types/database.types';
import * as Haptics from 'expo-haptics';

// Mock vendors for admin
const MOCK_VENDORS: Vendor[] = [
  {
    id: '1',
    owner_user_id: 'u1',
    vendor_type: 'restaurant',
    name: 'Mama Oliseh\'s Kitchen',
    tagline: 'Authentic Nigerian Cuisine',
    description: 'Traditional Nigerian dishes',
    diaspora_focus: ['African'],
    cuisines: ['Nigerian'],
    phone: '(555) 123-4567',
    email: 'contact@mamaoliseh.com',
    address_line1: '123 Main St',
    city: 'Los Angeles',
    state: 'CA',
    zip_code: '90001',
    country: 'USA',
    is_active: true,
    onboarding_status: 'active',
    created_by_admin: false,
    offers_dine_in: true,
    offers_pickup: true,
    offers_delivery: true,
    delivery_partners: ['In-house'],
    avg_price_level: '$$',
    rating_average: 4.5,
    rating_count: 23,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    owner_user_id: 'u2',
    vendor_type: 'restaurant',
    name: 'Caribbean Spice',
    tagline: 'Island Flavors',
    description: 'Jamaican and Caribbean cuisine',
    diaspora_focus: ['Caribbean'],
    cuisines: ['Jamaican'],
    phone: '(555) 234-5678',
    email: 'info@caribbeanspice.com',
    address_line1: '456 Ocean Ave',
    city: 'Miami',
    state: 'FL',
    zip_code: '33101',
    country: 'USA',
    is_active: false,
    onboarding_status: 'pending',
    created_by_admin: true,
    offers_dine_in: true,
    offers_pickup: true,
    offers_delivery: false,
    delivery_partners: [],
    avg_price_level: '$',
    rating_average: 0,
    rating_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function AdminVendorsScreen() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OnboardingStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<VendorType | 'all'>('all');
  const [filterState, setFilterState] = useState<string>('all');

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || vendor.onboarding_status === filterStatus;
    const matchesType = filterType === 'all' || vendor.vendor_type === filterType;
    const matchesState = filterState === 'all' || vendor.state === filterState;
    
    return matchesSearch && matchesStatus && matchesType && matchesState;
  });

  const handleApproveVendor = (vendorId: string) => {
    Alert.alert(
      'Approve Vendor',
      'Are you sure you want to approve this vendor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setVendors(vendors.map(v => 
              v.id === vendorId 
                ? { ...v, onboarding_status: 'active', is_active: true }
                : v
            ));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Vendor approved successfully');
          },
        },
      ]
    );
  };

  const handleDeactivateVendor = (vendorId: string) => {
    Alert.alert(
      'Deactivate Vendor',
      'Are you sure you want to deactivate this vendor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            setVendors(vendors.map(v => 
              v.id === vendorId 
                ? { ...v, is_active: false }
                : v
            ));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Vendor deactivated');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: OnboardingStatus) => {
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
            <Text style={styles.headerTitle}>Vendor Management</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/admin-create-vendor')}
            >
              <IconSymbol 
                ios_icon_name="plus" 
                android_material_icon_name="add"
                size={24} 
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <IconSymbol 
              ios_icon_name="magnifyingglass" 
              android_material_icon_name="search"
              size={20} 
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendors..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filters */}
          <View style={styles.filtersSection}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
                  onPress={() => setFilterStatus('all')}
                >
                  <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
                    All Status
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
                  onPress={() => setFilterStatus('pending')}
                >
                  <Text style={[styles.filterChipText, filterStatus === 'pending' && styles.filterChipTextActive]}>
                    Pending
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filterStatus === 'active' && styles.filterChipActive]}
                  onPress={() => setFilterStatus('active')}
                >
                  <Text style={[styles.filterChipText, filterStatus === 'active' && styles.filterChipTextActive]}>
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filterType === 'restaurant' && styles.filterChipActive]}
                  onPress={() => setFilterType(filterType === 'restaurant' ? 'all' : 'restaurant')}
                >
                  <Text style={[styles.filterChipText, filterType === 'restaurant' && styles.filterChipTextActive]}>
                    Restaurants
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filterType === 'grocery' && styles.filterChipActive]}
                  onPress={() => setFilterType(filterType === 'grocery' ? 'all' : 'grocery')}
                >
                  <Text style={[styles.filterChipText, filterType === 'grocery' && styles.filterChipTextActive]}>
                    Groceries
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Vendors List */}
          <View style={styles.vendorsList}>
            <Text style={styles.resultsCount}>
              {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
            </Text>
            {filteredVendors.map((vendor, index) => (
              <View key={index} style={styles.vendorCard}>
                <View style={styles.vendorHeader}>
                  <View style={styles.vendorInfo}>
                    <Text style={styles.vendorName}>{vendor.name}</Text>
                    <Text style={styles.vendorLocation}>
                      {vendor.city}, {vendor.state}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vendor.onboarding_status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(vendor.onboarding_status) }]}>
                      {vendor.onboarding_status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.vendorMeta}>
                  <View style={styles.metaItem}>
                    <IconSymbol 
                      ios_icon_name={vendor.vendor_type === 'restaurant' ? 'fork.knife' : 'cart.fill'}
                      android_material_icon_name={vendor.vendor_type === 'restaurant' ? 'restaurant' : 'shopping_cart'}
                      size={14} 
                      color={colors.textSecondary}
                    />
                    <Text style={styles.metaText}>{vendor.vendor_type}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <IconSymbol 
                      ios_icon_name="tag.fill" 
                      android_material_icon_name="label"
                      size={14} 
                      color={colors.textSecondary}
                    />
                    <Text style={styles.metaText}>{vendor.diaspora_focus.join(', ')}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <IconSymbol 
                      ios_icon_name={vendor.is_active ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                      android_material_icon_name={vendor.is_active ? 'check_circle' : 'cancel'}
                      size={14} 
                      color={vendor.is_active ? '#34C759' : '#FF3B30'}
                    />
                    <Text style={styles.metaText}>{vendor.is_active ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>

                <View style={styles.vendorActions}>
                  {vendor.onboarding_status === 'pending' && (
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApproveVendor(vendor.id)}
                    >
                      <IconSymbol 
                        ios_icon_name="checkmark" 
                        android_material_icon_name="check"
                        size={16} 
                        color="#FFFFFF"
                      />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.is_active && (
                    <TouchableOpacity
                      style={styles.deactivateButton}
                      onPress={() => handleDeactivateVendor(vendor.id)}
                    >
                      <IconSymbol 
                        ios_icon_name="xmark" 
                        android_material_icon_name="close"
                        size={16} 
                        color="#FF3B30"
                      />
                      <Text style={styles.deactivateButtonText}>Deactivate</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => console.log('Edit vendor:', vendor.id)}
                  >
                    <IconSymbol 
                      ios_icon_name="pencil" 
                      android_material_icon_name="edit"
                      size={16} 
                      color={colors.primary}
                    />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filtersSection: {
    marginBottom: 20,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  vendorsList: {
    gap: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  vendorCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  vendorLocation: {
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
  vendorMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
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
  vendorActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deactivateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
