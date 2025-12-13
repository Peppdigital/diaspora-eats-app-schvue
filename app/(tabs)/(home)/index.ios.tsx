
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { DiasporaSegment } from '@/types/database.types';
import { MOCK_VENDORS } from '@/constants/MockVendorData';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.dark;
  const { user } = useAuth();

  const [selectedSegment, setSelectedSegment] = useState<DiasporaSegment | 'All'>('All');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const diasporaSegments: (DiasporaSegment | 'All')[] = [
    'All',
    'African American',
    'Caribbean',
    'African',
  ];

  // Filter vendors based on selected segment
  const filteredVendors = selectedSegment === 'All'
    ? MOCK_VENDORS
    : MOCK_VENDORS.filter((v) => v.diaspora_focus.includes(selectedSegment));

  // Featured vendors (highest rated)
  const featuredVendors = [...MOCK_VENDORS]
    .sort((a, b) => b.rating_average - a.rating_average)
    .slice(0, 3);

  // Vendors in user's city
  const nearbyVendors = user?.default_location_city
    ? MOCK_VENDORS.filter((v) => v.city === user.default_location_city)
    : [];

  const VendorCard = ({ vendor, horizontal = false }: any) => (
    <TouchableOpacity
      style={[
        horizontal ? styles.vendorCardHorizontal : styles.vendorCard,
        { backgroundColor: cardColor },
      ]}
      onPress={() => router.push(`/vendor/${vendor.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: vendor.cover_image }}
        style={horizontal ? styles.vendorImageHorizontal : styles.vendorImage}
      />
      <View style={styles.vendorInfo}>
        <Text style={[styles.vendorName, { color: textColor }]} numberOfLines={1}>
          {vendor.name}
        </Text>
        <Text style={[styles.vendorTagline, { color: textSecondaryColor }]} numberOfLines={1}>
          {vendor.tagline}
        </Text>
        <View style={styles.vendorMeta}>
          <View style={styles.ratingContainer}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={14}
              color="#FFB800"
            />
            <Text style={[styles.ratingText, { color: textColor }]}>
              {vendor.rating_average}
            </Text>
            <Text style={[styles.ratingCount, { color: textSecondaryColor }]}>
              ({vendor.rating_count})
            </Text>
          </View>
          <Text style={[styles.priceLevel, { color: textSecondaryColor }]}>
            {vendor.avg_price_level}
          </Text>
        </View>
        <View style={styles.badges}>
          {vendor.diaspora_focus.slice(0, 2).map((focus, index) => (
            <React.Fragment key={index}>
              <View style={[styles.badge, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  {focus}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: textColor }]}>
            Tap in to the diaspora flavors near you
          </Text>
          
          {/* Location */}
          <TouchableOpacity
            style={[styles.locationButton, { backgroundColor: cardColor }]}
            onPress={() => router.push('/auth/location-setup')}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="location_on"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.locationText, { color: textColor }]}>
              {user?.default_location_city && user?.default_location_state
                ? `${user.default_location_city}, ${user.default_location_state}`
                : 'Set your location'}
            </Text>
            <IconSymbol
              ios_icon_name="chevron.down"
              android_material_icon_name="expand_more"
              size={18}
              color={textSecondaryColor}
            />
          </TouchableOpacity>
        </View>

        {/* Diaspora Segment Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {diasporaSegments.map((segment, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedSegment === segment && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedSegment(segment)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedSegment === segment ? '#FFFFFF' : textColor },
                  ]}
                >
                  {segment}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </ScrollView>

        {/* Featured This Week */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Featured This Week
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {featuredVendors.map((vendor, index) => (
              <React.Fragment key={index}>
                <VendorCard vendor={vendor} horizontal />
              </React.Fragment>
            ))}
          </ScrollView>
        </View>

        {/* Near You */}
        {nearbyVendors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Near You
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/map')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>View Map</Text>
              </TouchableOpacity>
            </View>
            {nearbyVendors.slice(0, 3).map((vendor, index) => (
              <React.Fragment key={index}>
                <VendorCard vendor={vendor} />
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Top in City */}
        {user?.default_location_city && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Top in {user.default_location_city}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {filteredVendors.slice(0, 3).map((vendor, index) => (
              <React.Fragment key={index}>
                <VendorCard vendor={vendor} />
              </React.Fragment>
            ))}
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
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    lineHeight: 32,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  filterScroll: {
    marginBottom: 24,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  vendorCardHorizontal: {
    width: 280,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  vendorCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  vendorImageHorizontal: {
    width: '100%',
    height: 160,
  },
  vendorImage: {
    width: '100%',
    height: 180,
  },
  vendorInfo: {
    padding: 16,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  vendorTagline: {
    fontSize: 14,
    marginBottom: 8,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingCount: {
    fontSize: 12,
  },
  priceLevel: {
    fontSize: 14,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
