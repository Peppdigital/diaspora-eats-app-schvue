import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { api } from '@/utils/api';

type ApiEvent = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  event_type?: string;
  image_url?: string;
  hero_image?: string;
  city?: string;
  state?: string;
  venue_name?: string;
  venue_address_line1?: string;
  venue_zip?: string;
  start_date?: string;
  start_datetime?: string;
  end_date?: string;
  end_datetime?: string;
  is_all_day?: boolean;
  is_online?: boolean;
  is_featured?: boolean;
  ticket_required?: boolean;
  ticket_url?: string;
  ticket_price?: number;
  capacity?: number;
  diaspora_focus?: string[];
  cuisines_highlighted?: string[];
  latitude?: number;
  longitude?: number;
};

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const isDark = theme.dark;

  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendeeStatus, setAttendeeStatus] = useState<'interested' | 'going' | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  useEffect(() => {
    if (!id) return;
    console.log('[EventDetail] Fetching event:', id);
    api.get(`/api-events/${id}`)
      .then((data) => {
        const ev: ApiEvent = data?.event || data;
        console.log('[EventDetail] Loaded event:', ev?.title);
        setEvent(ev);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load event';
        console.log('[EventDetail] Fetch error:', msg);
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const handleGetTickets = () => {
    if (event?.ticket_url) {
      console.log('[EventDetail] Get tickets tapped:', event.ticket_url);
      Linking.openURL(event.ticket_url);
    }
  };

  const handleRSVP = (status: 'interested' | 'going') => {
    const newStatus = attendeeStatus === status ? null : status;
    console.log('[EventDetail] RSVP tapped:', status, '-> new status:', newStatus);
    setAttendeeStatus(newStatus);
  };

  const handleGetDirections = () => {
    if (!event) return;
    console.log('[EventDetail] Get directions tapped');
    if (event.latitude && event.longitude) {
      Linking.openURL(`https://maps.google.com/?q=${event.latitude},${event.longitude}`);
    } else if (event.venue_address_line1) {
      const address = `${event.venue_address_line1}, ${event.city}, ${event.state} ${event.venue_zip || ''}`;
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);
    }
  };

  const getEventImage = (e: ApiEvent) => e.image_url || e.hero_image || '';
  const getStartDate = (e: ApiEvent) => e.start_date || e.start_datetime || '';
  const getEndDate = (e: ApiEvent) => e.end_date || e.end_datetime || '';
  const ticketLabel = event?.ticket_price === 0 ? 'Free' : event?.ticket_price ? `$${Number(event.ticket_price).toFixed(2)}` : '';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: textColor }]}>{error || 'Event not found'}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const startDateStr = getStartDate(event);
  const endDateStr = getEndDate(event);
  const startDateDisplay = startDateStr ? formatEventDate(startDateStr) : '';
  const endDateDisplay = endDateStr ? formatEventDate(endDateStr) : '';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: getEventImage(event) }} style={styles.heroImage} />
          <TouchableOpacity style={[styles.backButton, { backgroundColor: cardColor }]} onPress={() => router.back()} activeOpacity={0.8}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={textColor} />
          </TouchableOpacity>
          {event.is_featured && (
            <View style={styles.featuredBadge}>
              <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={14} color="#FFFFFF" />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: textColor }]}>{event.title}</Text>
            {event.subtitle && <Text style={[styles.subtitle, { color: textSecondaryColor }]}>{event.subtitle}</Text>}
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
            {(event.diaspora_focus || []).map((focus, index) => (
              <View key={index} style={[styles.badge, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>{focus}</Text>
              </View>
            ))}
          </View>

          {startDateDisplay !== '' && (
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
              <View style={styles.infoRow}>
                <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>Date & Time</Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>{startDateDisplay}</Text>
                  {!event.is_all_day && endDateDisplay !== '' && (
                    <Text style={[styles.infoValue, { color: textColor }]}>Until {endDateDisplay}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {!event.is_online && event.venue_address_line1 && (
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
              <View style={styles.infoRow}>
                <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location_on" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>Location</Text>
                  {event.venue_name && <Text style={[styles.infoValue, { color: textColor }]}>{event.venue_name}</Text>}
                  <Text style={[styles.infoValue, { color: textColor }]}>{event.venue_address_line1}</Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>{event.city}{event.state ? `, ${event.state}` : ''} {event.venue_zip || ''}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.directionsButton, { backgroundColor: colors.primary }]} onPress={handleGetDirections} activeOpacity={0.8}>
                <IconSymbol ios_icon_name="arrow.triangle.turn.up.right.diamond.fill" android_material_icon_name="directions" size={16} color="#FFFFFF" />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          )}

          {event.is_online && (
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
              <View style={styles.infoRow}>
                <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>Online Event</Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>This is a virtual event</Text>
                </View>
              </View>
            </View>
          )}

          {event.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>About This Event</Text>
              <Text style={[styles.description, { color: textColor }]}>{event.description}</Text>
            </View>
          )}

          {(event.cuisines_highlighted || []).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Cuisines Featured</Text>
              <View style={styles.cuisineList}>
                {(event.cuisines_highlighted || []).map((cuisine, index) => (
                  <View key={index} style={[styles.cuisineTag, { backgroundColor: cardColor }]}>
                    <Text style={[styles.cuisineText, { color: textColor }]}>{cuisine}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {event.capacity && (
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
              <View style={styles.infoRow}>
                <IconSymbol ios_icon_name="person.3.fill" android_material_icon_name="group" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>Capacity</Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>{event.capacity} attendees</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: cardColor }]}>
        <View style={styles.rsvpButtons}>
          <TouchableOpacity
            style={[styles.rsvpButton, { backgroundColor: attendeeStatus === 'interested' ? colors.primary : bgColor }, attendeeStatus === 'interested' && styles.rsvpButtonActive]}
            onPress={() => handleRSVP('interested')}
            activeOpacity={0.8}
          >
            <IconSymbol ios_icon_name="star" android_material_icon_name="star_border" size={18} color={attendeeStatus === 'interested' ? '#FFFFFF' : textColor} />
            <Text style={[styles.rsvpButtonText, { color: attendeeStatus === 'interested' ? '#FFFFFF' : textColor }]}>Interested</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpButton, { backgroundColor: attendeeStatus === 'going' ? colors.primary : bgColor }, attendeeStatus === 'going' && styles.rsvpButtonActive]}
            onPress={() => handleRSVP('going')}
            activeOpacity={0.8}
          >
            <IconSymbol ios_icon_name="checkmark.circle" android_material_icon_name="check_circle" size={18} color={attendeeStatus === 'going' ? '#FFFFFF' : textColor} />
            <Text style={[styles.rsvpButtonText, { color: attendeeStatus === 'going' ? '#FFFFFF' : textColor }]}>Going</Text>
          </TouchableOpacity>
        </View>
        {event.ticket_url && (
          <TouchableOpacity style={[styles.ticketButton, { backgroundColor: colors.primary }]} onPress={handleGetTickets} activeOpacity={0.8}>
            <IconSymbol ios_icon_name="ticket.fill" android_material_icon_name="confirmation_number" size={20} color="#FFFFFF" />
            <Text style={styles.ticketButtonText}>Get Tickets</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { position: 'relative' },
  heroImage: { width: '100%', height: 300 },
  backButton: { position: 'absolute', top: 48, left: 20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  featuredBadge: { position: 'absolute', top: 48, right: 20, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  featuredBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  content: { padding: 20 },
  titleSection: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, lineHeight: 36 },
  subtitle: { fontSize: 18, fontWeight: '500' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  typeBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  typeBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  infoCard: { padding: 16, borderRadius: 16, marginBottom: 16, elevation: 2 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  directionsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginTop: 12 },
  directionsButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  description: { fontSize: 16, lineHeight: 24 },
  cuisineList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cuisineTag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.highlight },
  cuisineText: { fontSize: 14, fontWeight: '600' },
  bottomPadding: { height: 100 },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, elevation: 8 },
  rsvpButtons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  rsvpButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.highlight },
  rsvpButtonActive: { borderColor: colors.primary },
  rsvpButtonText: { fontSize: 14, fontWeight: '700' },
  ticketButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  ticketButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
