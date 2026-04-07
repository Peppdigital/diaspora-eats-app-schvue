import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { api } from '@/utils/api';

type ApiVendor = {
  id: string;
  name: string;
  tagline?: string;
  cuisine_type?: string;
  rating?: number;
  rating_average?: number;
  banner_url?: string;
  cover_image?: string;
  diaspora_focus?: string[];
};

type ApiEvent = {
  id: string;
  title: string;
  image_url?: string;
  hero_image?: string;
  city?: string;
  state?: string;
  start_date?: string;
  start_datetime?: string;
  event_type?: string;
  ticket_price?: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.dark;
  const { user } = useAuth();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    console.log('[Home iOS] Fetching vendors and events');
    setLoading(true);
    setError('');
    try {
      const [vendorsData, eventsData] = await Promise.all([
        api.get('/api-vendors'),
        api.get('/api-events'),
      ]);
      console.log('[Home iOS] Loaded', vendorsData?.vendors?.length ?? 0, 'vendors');
      setVendors(vendorsData?.vendors || vendorsData || []);
      setEvents(eventsData?.events || eventsData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      console.log('[Home iOS] Fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(fetchData);

  const featuredVendors = vendors.slice(0, 3);
  const upcomingEvents = events.slice(0, 5);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getVendorRating = (v: ApiVendor) => Number(v.rating ?? v.rating_average ?? 0).toFixed(1);
  const getVendorImage = (v: ApiVendor) => v.banner_url || v.cover_image || '';
  const getEventImage = (e: ApiEvent) => e.image_url || e.hero_image || '';
  const getEventDate = (e: ApiEvent) => e.start_date || e.start_datetime || '';

  const VendorCard = ({ vendor, horizontal = false }: { vendor: ApiVendor; horizontal?: boolean }) => (
    <TouchableOpacity
      style={[horizontal ? styles.vendorCardHorizontal : styles.vendorCard, { backgroundColor: cardColor }]}
      onPress={() => {
        console.log('[Home iOS] Vendor tapped:', vendor.id, vendor.name);
        router.push(`/vendor-detail?id=${vendor.id}`);
      }}
      activeOpacity={0.8}
    >
      <Image source={{ uri: getVendorImage(vendor) }} style={horizontal ? styles.vendorImageHorizontal : styles.vendorImage} />
      <View style={styles.vendorInfo}>
        <Text style={[styles.vendorName, { color: textColor }]} numberOfLines={1}>{vendor.name}</Text>
        <Text style={[styles.vendorTagline, { color: textSecondaryColor }]} numberOfLines={1}>{vendor.tagline || vendor.cuisine_type || ''}</Text>
        <View style={styles.vendorMeta}>
          <View style={styles.ratingContainer}>
            <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={14} color="#FFB800" />
            <Text style={[styles.ratingText, { color: textColor }]}>{getVendorRating(vendor)}</Text>
          </View>
        </View>
        {vendor.diaspora_focus && (
          <View style={styles.badges}>
            {vendor.diaspora_focus.slice(0, 2).map((focus, index) => (
              <View key={index} style={[styles.badge, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>{focus}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const EventCard = ({ event }: { event: ApiEvent }) => {
    const dateStr = getEventDate(event);
    const dateDisplay = dateStr ? formatEventDate(dateStr) : '';
    return (
      <TouchableOpacity
        style={[styles.eventCardHorizontal, { backgroundColor: cardColor }]}
        onPress={() => {
          console.log('[Home iOS] Event tapped:', event.id, event.title);
          router.push(`/event-detail?id=${event.id}`);
        }}
        activeOpacity={0.8}
      >
        <Image source={{ uri: getEventImage(event) }} style={styles.eventImageHorizontal} />
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={2}>{event.title}</Text>
          <View style={styles.eventMeta}>
            <View style={styles.metaRow}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={12} color={colors.primary} />
              <Text style={[styles.eventMetaText, { color: textSecondaryColor }]} numberOfLines={1}>{dateDisplay}</Text>
            </View>
            <View style={styles.metaRow}>
              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location_on" size={12} color={colors.primary} />
              <Text style={[styles.eventMetaText, { color: textSecondaryColor }]}>{event.city || ''}</Text>
            </View>
          </View>
          {event.event_type && (
            <View style={styles.eventBadges}>
              <View style={[styles.eventTypeBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.eventTypeBadgeText}>{event.event_type}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: textColor }]}>Tap in to the diaspora flavors near you</Text>
          <TouchableOpacity
            style={[styles.locationButton, { backgroundColor: cardColor }]}
            onPress={() => router.push('/auth/location-setup')}
            activeOpacity={0.7}
          >
            <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location_on" size={20} color={colors.primary} />
            <Text style={[styles.locationText, { color: textColor }]}>
              {user?.default_location_city && user?.default_location_state
                ? `${user.default_location_city}, ${user.default_location_state}`
                : 'Set your location'}
            </Text>
            <IconSymbol ios_icon_name="chevron.down" android_material_icon_name="expand_more" size={18} color={textSecondaryColor} />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {error !== '' && !loading && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: textSecondaryColor }]}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && error === '' && (
          <>
            {upcomingEvents.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming Events & Socials</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Featured This Week</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                {featuredVendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} horizontal />
                ))}
              </ScrollView>
              {featuredVendors.length === 0 && (
                <Text style={[styles.emptyText, { color: textSecondaryColor }]}>No vendors available yet</Text>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 48 },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '800', marginBottom: 16, lineHeight: 32 },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, elevation: 2 },
  locationText: { flex: 1, fontSize: 16, fontWeight: '600' },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  errorContainer: { paddingHorizontal: 20, paddingVertical: 40, alignItems: 'center' },
  errorText: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  horizontalList: { paddingHorizontal: 20, gap: 16 },
  vendorCardHorizontal: { width: 280, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  vendorCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  vendorImageHorizontal: { width: '100%', height: 160 },
  vendorImage: { width: '100%', height: 180 },
  vendorInfo: { padding: 16 },
  vendorName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  vendorTagline: { fontSize: 14, marginBottom: 8 },
  vendorMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  eventCardHorizontal: { width: 280, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  eventImageHorizontal: { width: '100%', height: 140 },
  eventInfo: { padding: 14 },
  eventTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  eventMeta: { gap: 6, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMetaText: { fontSize: 12, fontWeight: '500', flex: 1 },
  eventBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  eventTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  eventTypeBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  emptyText: { paddingHorizontal: 20, fontSize: 14 },
  bottomPadding: { height: 40 },
});
