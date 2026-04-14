import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { GradientFill } from '@/components/GradientFill';
import { api } from '@/utils/api';

type ApiEvent = {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  hero_image?: string;
  city?: string;
  state?: string;
  start_date?: string;
  start_datetime?: string;
  event_type?: string;
  ticket_price?: number;
  is_featured?: boolean;
  is_published?: boolean;
  diaspora_focus?: string[];
};

type DateFilter = 'All' | 'Today' | 'This Weekend' | 'Next 7 Days' | 'Next 30 Days';

export default function EventsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.dark;

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const dateFilters: DateFilter[] = ['All', 'Today', 'This Weekend', 'Next 7 Days', 'Next 30 Days'];

  const fetchEvents = useCallback(async () => {
    console.log('[Events] Fetching events');
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api-events');
      const list: ApiEvent[] = data?.events || data || [];
      console.log('[Events] Loaded', list.length, 'events');
      setEvents(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load events';
      console.log('[Events] Fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const getEventDate = (e: ApiEvent) => e.start_date || e.start_datetime || '';
  const getEventImage = (e: ApiEvent) => e.image_url || e.hero_image || '';

  const getDateRange = (filter: DateFilter): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (filter) {
      case 'Today': return { start: today, end: new Date(today.getTime() + 86400000) };
      case 'This Weekend': {
        const daysUntilSat = (6 - now.getDay() + 7) % 7;
        const sat = new Date(today.getTime() + daysUntilSat * 86400000);
        return { start: sat, end: new Date(sat.getTime() + 3 * 86400000) };
      }
      case 'Next 7 Days': return { start: today, end: new Date(today.getTime() + 7 * 86400000) };
      case 'Next 30 Days': return { start: today, end: new Date(today.getTime() + 30 * 86400000) };
      default: return null;
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === '' ||
      (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.event_type || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== 'All') {
      const dateStr = getEventDate(event);
      if (dateStr) {
        const eventDate = new Date(dateStr);
        const range = getDateRange(dateFilter);
        if (range) matchesDate = eventDate >= range.start && eventDate < range.end;
      }
    }
    return matchesSearch && matchesDate;
  });

  const featuredEvents = filteredEvents.filter((e) => e.is_featured);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const EventCard = ({ event, featured = false }: { event: ApiEvent; featured?: boolean }) => {
    const dateStr = getEventDate(event);
    const dateDisplay = dateStr ? formatEventDate(dateStr) : '';
    const ticketLabel = event.ticket_price === 0 ? 'Free' : event.ticket_price ? `$${Number(event.ticket_price).toFixed(0)}` : '';
    return (
      <TouchableOpacity
        style={[featured ? styles.featuredCard : styles.eventCard, { backgroundColor: cardColor }]}
        onPress={() => {
          console.log('[Events] Event tapped:', event.id, event.title);
          router.push(`/event-detail?id=${event.id}`);
        }}
        activeOpacity={0.8}
      >
        <Image source={{ uri: getEventImage(event) }} style={featured ? styles.featuredImage : styles.eventImage} />
        {featured && (
          <View style={styles.featuredBadge}>
            <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={12} color="#FFFFFF" />
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        )}
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={2}>{event.title}</Text>
          {event.subtitle && (
            <Text style={[styles.eventSubtitle, { color: textSecondaryColor }]} numberOfLines={1}>{event.subtitle}</Text>
          )}
          <View style={styles.eventMeta}>
            <View style={styles.metaRow}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: textSecondaryColor }]}>{dateDisplay}</Text>
            </View>
            <View style={styles.metaRow}>
              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: textSecondaryColor }]}>{event.city || ''}{event.state ? `, ${event.state}` : ''}</Text>
            </View>
          </View>
          <View style={styles.badges}>
            {event.event_type && (
              <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.typeBadgeText}>{event.event_type}</Text>
              </View>
            )}
            {ticketLabel !== '' && (
              <View style={[styles.badge, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>{ticketLabel}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: textColor }]}>Events & Socials</Text>
          <Text style={[styles.pageSubtitle, { color: textSecondaryColor }]}>Discover diaspora food events near you</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: cardColor }]}>
          <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={textSecondaryColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search by title, city, or type..."
            placeholderTextColor={textSecondaryColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={textSecondaryColor} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterButtonRow}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: cardColor }]}
            onPress={() => {
              console.log('[Events] Filters opened');
              setShowFilters(true);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol ios_icon_name="slider.horizontal.3" android_material_icon_name="tune" size={20} color={colors.primary} />
            <Text style={[styles.filterButtonText, { color: textColor }]}>Filters</Text>
            {dateFilter !== 'All' && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
          {dateFilter !== 'All' && (
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: cardColor }]}
              onPress={() => setDateFilter('All')}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearButtonText, { color: colors.primary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {error !== '' && !loading && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: textSecondaryColor }]}>{error}</Text>
            <TouchableOpacity onPress={fetchEvents} style={styles.retryButton}>
              <GradientFill borderRadius={12} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && error === '' && (
          <>
            {featuredEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Featured Events</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                  {featuredEvents.map((event) => (
                    <EventCard key={event.id} event={event} featured />
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Upcoming Events ({filteredEvents.length})
              </Text>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={48} color={textSecondaryColor} />
                  <Text style={[styles.emptyText, { color: textSecondaryColor }]}>No upcoming events found</Text>
                  <Text style={[styles.emptySubtext, { color: textSecondaryColor }]}>Try adjusting your filters</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFilters(false)}>
        <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
          <View style={[styles.modalHeader, { backgroundColor: cardColor }]}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={[styles.modalDone, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: textColor }]}>Date</Text>
              <View style={styles.filterGrid}>
                {dateFilters.map((filter) => {
                  const isSelected = dateFilter === filter;
                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.filterGridItem, { backgroundColor: cardColor }, isSelected && styles.filterGridItemSelected]}
                      onPress={() => {
                        console.log('[Events] Date filter selected:', filter);
                        setDateFilter(filter);
                      }}
                    >
                      {isSelected && <GradientFill borderRadius={12} />}
                      <Text style={[styles.filterGridItemText, { color: isSelected ? '#1A1000' : textColor }]}>{filter}</Text>
                      {isSelected && (
                        <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#1A1000" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: Platform.OS === 'android' ? 60 : 48 },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  pageSubtitle: { fontSize: 16, fontWeight: '500' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 10, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16 },
  filterButtonRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  filterButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, elevation: 2 },
  filterButtonText: { fontSize: 16, fontWeight: '600' },
  filterBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  clearButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, justifyContent: 'center', elevation: 2 },
  clearButtonText: { fontSize: 14, fontWeight: '600' },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', paddingHorizontal: 20, marginBottom: 16 },
  horizontalList: { paddingHorizontal: 20, gap: 16 },
  featuredCard: { width: 300, borderRadius: 16, overflow: 'hidden', elevation: 4, position: 'relative' },
  eventCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  featuredImage: { width: '100%', height: 180 },
  eventImage: { width: '100%', height: 200 },
  featuredBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  featuredBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  eventInfo: { padding: 16 },
  eventTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  eventSubtitle: { fontSize: 14, marginBottom: 12 },
  eventMeta: { gap: 8, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontWeight: '500' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '500', marginTop: 12, textAlign: 'center' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: 'transparent', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  retryText: { color: '#1A1000', fontWeight: '700', fontSize: 14 },
  bottomPadding: { height: 120 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingTop: Platform.OS === 'android' ? 48 : 60, borderBottomWidth: 1, borderBottomColor: colors.highlight },
  modalCancel: { fontSize: 16, fontWeight: '600' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalDone: { fontSize: 16, fontWeight: '700' },
  modalContent: { flex: 1, padding: 20 },
  filterSection: { marginBottom: 32 },
  filterSectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterGridItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.highlight },
  filterGridItemSelected: { backgroundColor: 'transparent', borderColor: '#9C7C1A', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  filterGridItemText: { fontSize: 14, fontWeight: '600' },
});
