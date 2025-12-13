
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
import { DiasporaSegment, EventType } from '@/types/database.types';
import { MOCK_EVENTS } from '@/constants/MockEventData';

export default function EventsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.dark;
  const { user } = useAuth();

  const [selectedSegment, setSelectedSegment] = useState<DiasporaSegment | 'All'>('All');
  const [selectedType, setSelectedType] = useState<EventType | 'All'>('All');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const diasporaSegments: (DiasporaSegment | 'All')[] = [
    'All',
    'African American',
    'Caribbean',
    'African',
    'Pan-African',
  ];

  const eventTypes: (EventType | 'All')[] = [
    'All',
    'Brunch',
    'Festival',
    'Pop-up',
    'Market',
    'Tasting',
    'Party',
  ];

  // Filter events
  const now = new Date();
  const upcomingEvents = MOCK_EVENTS.filter((event) => {
    const eventDate = new Date(event.start_datetime);
    const isUpcoming = eventDate >= now;
    const isPublished = event.is_published;
    const matchesSegment = selectedSegment === 'All' || event.diaspora_focus.includes(selectedSegment);
    const matchesType = selectedType === 'All' || event.event_type === selectedType;
    
    return isUpcoming && isPublished && matchesSegment && matchesType;
  }).sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  const featuredEvents = upcomingEvents.filter((e) => e.is_featured);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const EventCard = ({ event, featured = false }: any) => (
    <TouchableOpacity
      style={[
        featured ? styles.featuredCard : styles.eventCard,
        { backgroundColor: cardColor },
      ]}
      onPress={() => router.push(`/event-detail?id=${event.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: event.hero_image }}
        style={featured ? styles.featuredImage : styles.eventImage}
      />
      {featured && (
        <View style={styles.featuredBadge}>
          <IconSymbol
            ios_icon_name="star.fill"
            android_material_icon_name="star"
            size={12}
            color="#FFFFFF"
          />
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
      )}
      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={2}>
          {event.title}
        </Text>
        {event.subtitle && (
          <Text style={[styles.eventSubtitle, { color: textSecondaryColor }]} numberOfLines={1}>
            {event.subtitle}
          </Text>
        )}
        <View style={styles.eventMeta}>
          <View style={styles.metaRow}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.metaText, { color: textSecondaryColor }]}>
              {formatEventDate(event.start_datetime)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="location_on"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.metaText, { color: textSecondaryColor }]}>
              {event.city}, {event.state}
            </Text>
          </View>
        </View>
        <View style={styles.badges}>
          <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.typeBadgeText}>{event.event_type}</Text>
          </View>
          {event.diaspora_focus.slice(0, 2).map((focus, index) => (
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
          <Text style={[styles.pageTitle, { color: textColor }]}>
            Events & Socials
          </Text>
          <Text style={[styles.pageSubtitle, { color: textSecondaryColor }]}>
            Discover diaspora food events near you
          </Text>
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

        {/* Event Type Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {eventTypes.map((type, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedType === type && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedType === type ? '#FFFFFF' : textColor },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </ScrollView>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Featured Events
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {featuredEvents.map((event, index) => (
                <React.Fragment key={index}>
                  <EventCard event={event} featured />
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Upcoming Events */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Upcoming Events ({upcomingEvents.length})
          </Text>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <React.Fragment key={index}>
                <EventCard event={event} />
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={48}
                color={textSecondaryColor}
              />
              <Text style={[styles.emptyText, { color: textSecondaryColor }]}>
                No upcoming events found
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Padding */}
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
    paddingTop: 48,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  filterScroll: {
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  featuredCard: {
    width: 300,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    elevation: 4,
    position: 'relative',
  },
  eventCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: 180,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  eventMeta: {
    gap: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  bottomPadding: {
    height: 40,
  },
});
