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
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { api } from '@/utils/api';
import { GradientFill } from '@/components/GradientFill';
import * as Haptics from 'expo-haptics';

type ApiEvent = {
  id: string;
  title: string;
  city?: string;
  state?: string;
  start_date?: string;
  start_datetime?: string;
  event_type?: string;
  is_published?: boolean;
  is_featured?: boolean;
  image_url?: string;
  hero_image?: string;
  diaspora_focus?: string[];
  capacity?: number;
};

export default function AdminEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'unpublished'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = useCallback(async () => {
    console.log('[AdminEvents] Fetching events');
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api-events');
      const list: ApiEvent[] = data?.events || data || [];
      console.log('[AdminEvents] Loaded', list.length, 'events');
      setEvents(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load events';
      console.log('[AdminEvents] Fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchEvents();
  }, [fetchEvents]));

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPublished =
      filterPublished === 'all' ||
      (filterPublished === 'published' && event.is_published) ||
      (filterPublished === 'unpublished' && !event.is_published);
    return matchesSearch && matchesPublished;
  });

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    console.log('[AdminEvents] Delete event pressed:', eventId, eventTitle);
    Alert.alert('Delete Event', `Are you sure you want to delete "${eventTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api-events/${eventId}`);
            console.log('[AdminEvents] Event deleted:', eventId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEvents((prev) => prev.filter((e) => e.id !== eventId));
            Alert.alert('Success', 'Event deleted successfully');
          } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getEventDate = (e: ApiEvent) => e.start_date || e.start_datetime || '';
  const getEventImage = (e: ApiEvent) => e.image_url || e.hero_image || '';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Events Management</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => {
              console.log('[AdminEvents] Add event pressed');
              router.push('/admin-create-event');
            }}>
              <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
            <TextInput style={styles.searchInput} placeholder="Search events..." placeholderTextColor={colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          <View style={styles.filtersSection}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {(['all', 'published', 'unpublished'] as const).map((f) => {
                  const isActive = filterPublished === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => {
                        console.log('[AdminEvents] Filter changed:', f);
                        setFilterPublished(f);
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
              <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
                <GradientFill borderRadius={12} />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && error === '' && (
            <View style={styles.eventsList}>
              <Text style={styles.resultsCount}>{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}</Text>
              {filteredEvents.map((event) => {
                const dateStr = getEventDate(event);
                const dateDisplay = dateStr ? formatEventDate(dateStr) : '';
                const eventImage = getEventImage(event);
                return (
                  <View key={event.id} style={styles.eventCard}>
                    {eventImage !== '' && (
                      <Image source={{ uri: eventImage }} style={styles.eventImage} />
                    )}
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <View style={styles.eventInfo}>
                          <Text style={styles.eventTitle}>{event.title}</Text>
                          <Text style={styles.eventLocation}>{event.city || ''}{event.state ? `, ${event.state}` : ''}</Text>
                          {dateDisplay !== '' && <Text style={styles.eventDate}>{dateDisplay}</Text>}
                        </View>
                        <View style={styles.badges}>
                          {event.is_published ? (
                            <View style={[styles.statusBadge, { backgroundColor: '#34C75920' }]}>
                              <Text style={[styles.statusText, { color: '#34C759' }]}>PUBLISHED</Text>
                            </View>
                          ) : (
                            <View style={[styles.statusBadge, { backgroundColor: '#FF950020' }]}>
                              <Text style={[styles.statusText, { color: '#FF9500' }]}>DRAFT</Text>
                            </View>
                          )}
                          {event.is_featured && (
                            <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                              <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={12} color={colors.primary} />
                              <Text style={[styles.statusText, { color: colors.primary }]}>FEATURED</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.eventActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => {
                            console.log('[AdminEvents] Edit event pressed:', event.id);
                            router.push(`/admin-create-event?id=${event.id}`);
                          }}
                        >
                          <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.primary} />
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteEvent(event.id, event.title)}
                        >
                          <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={16} color="#FF3B30" />
                          <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
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
  eventsList: { gap: 16 },
  resultsCount: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  eventCard: { backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  eventImage: { width: '100%', height: 160 },
  eventContent: { padding: 16 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  eventLocation: { fontSize: 14, color: colors.textSecondary, marginBottom: 2 },
  eventDate: { fontSize: 13, color: colors.textSecondary },
  badges: { gap: 6, alignItems: 'flex-end' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  eventActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.highlight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
