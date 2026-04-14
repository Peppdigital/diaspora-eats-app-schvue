
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientFill } from '@/components/GradientFill';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { api } from '@/utils/api';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 40;

type ApiVendor = {
  id: string;
  name: string;
  tagline?: string;
  cuisine_type?: string;
  rating?: number;
  rating_average?: number;
  delivery_fee?: number;
  estimated_delivery_time?: number;
  banner_url?: string;
  logo_url?: string;
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

const heroImages = [
  { id: '1', city: 'NYC', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800' },
  { id: '2', city: 'LA', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800' },
  { id: '3', city: 'Miami', image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800' },
];

const categories = ['All', 'Jambalaya', 'Jerk', 'Jollof'];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.dark;
  const { user } = useAuth();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
      console.log('[Home iOS] Loaded', vendorsData?.vendors?.length ?? 0, 'vendors,', eventsData?.events?.length ?? 0, 'events');
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

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const featuredVendors = vendors.slice(0, 4);
  const upcomingEvents = events.slice(0, 3);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getVendorRating = (v: ApiVendor) => Number(v.rating ?? v.rating_average ?? 0).toFixed(1);
  const getVendorImage = (v: ApiVendor) => v.banner_url || v.cover_image || '';
  const getEventImage = (e: ApiEvent) => e.image_url || e.hero_image || '';
  const getEventDate = (e: ApiEvent) => e.start_date || e.start_datetime || '';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Carousel */}
        <View style={styles.heroSection}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
            {heroImages.map((item) => (
              <View key={item.id} style={styles.carouselItem}>
                <Image source={{ uri: item.image }} style={styles.heroImage} />
                <LinearGradient colors={['transparent', 'rgba(13, 13, 13, 0.9)']} style={styles.heroGradient}>
                  <Text style={styles.heroCity}>{item.city}</Text>
                  <Text style={styles.heroSubtext}>Discover Diaspora Flavors</Text>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Category Chips */}
        <View style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, { backgroundColor: cardColor }, isActive && styles.categoryChipActive]}
                  onPress={() => {
                    console.log('[Home iOS] Category selected:', category);
                    setSelectedCategory(category);
                  }}
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <>
                      <LinearGradient
                        colors={['#F5D67A', '#D4AF37', '#9C7C1A']}
                        start={{ x: 0.2, y: 0 }}
                        end={{ x: 0.8, y: 1 }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                      />
                      <LinearGradient
                        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 0.6 }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                      />
                    </>
                  )}
                  <Text style={[styles.categoryText, { color: textSecondaryColor }, isActive && styles.categoryTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        )}

        {error !== '' && !loading && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: textSecondaryColor }]}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
              <GradientFill borderRadius={12} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && error === '' && (
          <>
            {/* Featured Restaurants */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Featured Restaurants</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {featuredVendors.map((vendor) => (
                <TouchableOpacity
                  key={vendor.id}
                  style={styles.restaurantCard}
                  onPress={() => {
                    console.log('[Home iOS] Vendor tapped:', vendor.id, vendor.name);
                    router.push(`/vendor-detail?id=${vendor.id}`);
                  }}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: getVendorImage(vendor) }} style={styles.restaurantImage} />
                  <LinearGradient colors={['transparent', 'rgba(13, 13, 13, 0.95)']} style={styles.restaurantGradient}>
                    <View style={styles.restaurantInfo}>
                      <Text style={[styles.restaurantName, { color: colors.text }]} numberOfLines={2}>
                        {vendor.name}
                      </Text>
                      <Text style={[styles.restaurantTagline, { color: colors.primary }]}>
                        {vendor.tagline || vendor.cuisine_type || ''}
                      </Text>
                      <View style={styles.restaurantMeta}>
                        <View style={styles.ratingBadge}>
                          <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={14} color={colors.gold} />
                          <Text style={styles.ratingText}>{getVendorRating(vendor)}</Text>
                        </View>
                        {vendor.diaspora_focus && vendor.diaspora_focus.slice(0, 2).map((focus, idx) => (
                          <View key={idx} style={styles.cuisineBadge}>
                            <Text style={styles.cuisineBadgeText}>{focus}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
              {featuredVendors.length === 0 && (
                <Text style={[styles.emptyText, { color: textSecondaryColor }]}>No vendors available yet</Text>
              )}
            </View>

            {/* Upcoming Events */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Upcoming Events</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                  <Text style={styles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>
              {upcomingEvents.map((event) => {
                const eventDateStr = getEventDate(event);
                const eventDateDisplay = eventDateStr ? formatEventDate(eventDateStr) : '';
                const ticketLabel = event.ticket_price === 0 ? 'Free' : event.ticket_price ? `$${Number(event.ticket_price).toFixed(0)}` : '';
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.eventCard, { backgroundColor: cardColor }]}
                    onPress={() => {
                      console.log('[Home iOS] Event tapped:', event.id, event.title);
                      router.push(`/event-detail?id=${event.id}`);
                    }}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: getEventImage(event) }} style={styles.eventImage} />
                    <LinearGradient
                      colors={[colors.red, colors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.eventDateBadge}
                    >
                      <Text style={styles.eventDate}>{eventDateDisplay}</Text>
                    </LinearGradient>
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <View style={styles.eventMeta}>
                        <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={14} color={colors.gold} />
                        <Text style={[styles.eventLocation, { color: textSecondaryColor }]}>{event.city || ''}</Text>
                        {ticketLabel !== '' && <Text style={styles.ticketPrice}>{ticketLabel}</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {upcomingEvents.length === 0 && (
                <Text style={[styles.emptyText, { color: textSecondaryColor }]}>No upcoming events</Text>
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
  scrollContent: { paddingTop: 60 },
  heroSection: { marginBottom: 24 },
  carouselContent: { paddingHorizontal: 20, gap: 16 },
  carouselItem: { width: CAROUSEL_WIDTH, height: 240, borderRadius: 20, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end', padding: 20 },
  heroCity: { ...typography.h1, fontSize: 32, color: colors.gold, marginBottom: 4 },
  heroSubtext: { ...typography.label, fontSize: 14, color: colors.text },
  categorySection: { marginBottom: 24 },
  categoryScroll: { paddingHorizontal: 20, gap: 12 },
  categoryChip: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  categoryChipActive: {
    backgroundColor: 'transparent',
    borderColor: '#9C7C1A',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 6,
  },
  categoryText: { ...typography.labelLarge, fontWeight: '700' },
  categoryTextActive: { color: '#0D0D0D' },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  errorContainer: { paddingHorizontal: 20, paddingVertical: 40, alignItems: 'center' },
  errorText: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: 'transparent', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  retryText: { color: '#1A1000', fontWeight: '700', fontSize: 14 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { ...typography.h3, fontSize: 22 },
  seeAll: { ...typography.labelSmall, fontSize: 14, color: colors.gold, textTransform: 'uppercase' },
  restaurantCard: { marginHorizontal: 20, marginBottom: 16, height: 200, borderRadius: 20, overflow: 'hidden', elevation: 8 },
  restaurantImage: { width: '100%', height: '100%' },
  restaurantGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', justifyContent: 'flex-end' },
  restaurantInfo: { padding: 20 },
  restaurantName: { ...typography.h4, fontSize: 20, marginBottom: 4 },
  restaurantTagline: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 12 },
  restaurantMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  ratingText: { ...typography.labelSmall, fontSize: 14, color: colors.gold },
  cuisineBadge: { backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  cuisineBadgeText: { ...typography.caption, fontSize: 11, fontWeight: '700', color: colors.text },
  eventCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden', elevation: 8 },
  eventImage: { width: '100%', height: 160 },
  eventDateBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  eventDate: { ...typography.labelSmall, fontSize: 13, color: '#FFFFFF' },
  eventInfo: { padding: 16 },
  eventTitle: { ...typography.h5, fontSize: 18, marginBottom: 4 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventLocation: { ...typography.label, fontSize: 13, flex: 1 },
  ticketPrice: { ...typography.labelSmall, fontSize: 13, color: colors.gold, fontWeight: '700' },
  emptyText: { fontSize: 14, paddingHorizontal: 20, paddingVertical: 12 },
  bottomPadding: { height: 120 },
});
