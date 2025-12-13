
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { MOCK_EVENTS } from '@/constants/MockEventData';
import { MOCK_VENDORS } from '@/constants/MockVendorData';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const isDark = theme.dark;
  const { user } = useAuth();

  const [attendeeStatus, setAttendeeStatus] = useState<'interested' | 'going' | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const event = MOCK_EVENTS.find((e) => e.id === id);
  const linkedVendor = event?.linked_vendor_id 
    ? MOCK_VENDORS.find((v) => v.id === event.linked_vendor_id)
    : null;

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: textColor }]}>Event not found</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleGetTickets = () => {
    if (event.ticket_url) {
      Linking.openURL(event.ticket_url);
    }
  };

  const handleRSVP = (status: 'interested' | 'going') => {
    if (attendeeStatus === status) {
      setAttendeeStatus(null);
    } else {
      setAttendeeStatus(status);
    }
    console.log('RSVP status:', status);
  };

  const handleGetDirections = () => {
    if (event.latitude && event.longitude) {
      const url = `https://maps.google.com/?q=${event.latitude},${event.longitude}`;
      Linking.openURL(url);
    } else if (event.venue_address_line1) {
      const address = `${event.venue_address_line1}, ${event.city}, ${event.state} ${event.venue_zip}`;
      const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.hero_image }} style={styles.heroImage} />
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardColor }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={textColor}
            />
          </TouchableOpacity>
          {event.is_featured && (
            <View style={styles.featuredBadge}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
        </View>

        {/* Event Info */}
        <View style={styles.content}>
          {/* Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: textColor }]}>{event.title}</Text>
            {event.subtitle && (
              <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
                {event.subtitle}
              </Text>
            )}
          </View>

          {/* Badges */}
          <View style={styles.badges}>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.typeBadgeText}>{event.event_type}</Text>
            </View>
            {event.diaspora_focus.map((focus, index) => (
              <React.Fragment key={index}>
                <View style={[styles.badge, { backgroundColor: colors.highlight }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>{focus}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Date & Time */}
          <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={20}
                color={colors.primary}
              />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>
                  Date & Time
                </Text>
                <Text style={[styles.infoValue, { color: textColor }]}>
                  {formatEventDate(event.start_datetime)}
                </Text>
                {!event.is_all_day && (
                  <Text style={[styles.infoValue, { color: textColor }]}>
                    Until {formatEventDate(event.end_datetime)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Location */}
          {!event.is_online && (
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location_on"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>
                    Location
                  </Text>
                  {event.venue_name && (
                    <Text style={[styles.infoValue, { color: textColor }]}>
                      {event.venue_name}
                    </Text>
                  )}
                  <Text style={[styles.infoValue, { color: textColor }]}>
                    {event.venue_address_line1}
                  </Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>
                    {event.city}, {event.state} {event.venue_zip}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.directionsButton, { backgroundColor: colors.primary }]}
                onPress={handleGetDirections}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="arrow.triangle.turn.up.right.diamond.fill"
                  android_material_icon_name="directions"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          )}

          {event.is_online && (
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="video.fill"
                  android_material_icon_name="videocam"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>
                    Online Event
                  </Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>
                    This is a virtual event
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>About This Event</Text>
            <Text style={[styles.description, { color: textColor }]}>
              {event.description}
            </Text>
          </View>

          {/* Cuisines Highlighted */}
          {event.cuisines_highlighted.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Cuisines Featured
              </Text>
              <View style={styles.cuisineList}>
                {event.cuisines_highlighted.map((cuisine, index) => (
                  <React.Fragment key={index}>
                    <View style={[styles.cuisineTag, { backgroundColor: cardColor }]}>
                      <Text style={[styles.cuisineText, { color: textColor }]}>
                        {cuisine}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}

          {/* Linked Vendor */}
          {linkedVendor && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Hosted By</Text>
              <TouchableOpacity
                style={[styles.vendorCard, { backgroundColor: cardColor }]}
                onPress={() => router.push(`/vendor/${linkedVendor.id}`)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: linkedVendor.logo_image }}
                  style={styles.vendorLogo}
                />
                <View style={styles.vendorInfo}>
                  <Text style={[styles.vendorName, { color: textColor }]}>
                    {linkedVendor.name}
                  </Text>
                  <Text style={[styles.vendorTagline, { color: textSecondaryColor }]}>
                    {linkedVendor.tagline}
                  </Text>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={20}
                  color={textSecondaryColor}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Capacity */}
          {event.capacity && (
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="group"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: textSecondaryColor }]}>
                    Capacity
                  </Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>
                    {event.capacity} attendees
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: cardColor }]}>
        {/* RSVP Buttons */}
        <View style={styles.rsvpButtons}>
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              attendeeStatus === 'interested' && styles.rsvpButtonActive,
              { backgroundColor: attendeeStatus === 'interested' ? colors.primary : bgColor },
            ]}
            onPress={() => handleRSVP('interested')}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="star"
              android_material_icon_name="star_border"
              size={18}
              color={attendeeStatus === 'interested' ? '#FFFFFF' : textColor}
            />
            <Text
              style={[
                styles.rsvpButtonText,
                { color: attendeeStatus === 'interested' ? '#FFFFFF' : textColor },
              ]}
            >
              Interested
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              attendeeStatus === 'going' && styles.rsvpButtonActive,
              { backgroundColor: attendeeStatus === 'going' ? colors.primary : bgColor },
            ]}
            onPress={() => handleRSVP('going')}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check_circle"
              size={18}
              color={attendeeStatus === 'going' ? '#FFFFFF' : textColor}
            />
            <Text
              style={[
                styles.rsvpButtonText,
                { color: attendeeStatus === 'going' ? '#FFFFFF' : textColor },
              ]}
            >
              Going
            </Text>
          </TouchableOpacity>
        </View>

        {/* Get Tickets Button */}
        {event.ticket_required && event.ticket_url && (
          <TouchableOpacity
            style={[styles.ticketButton, { backgroundColor: colors.primary }]}
            onPress={handleGetTickets}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="ticket.fill"
              android_material_icon_name="confirmation_number"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.ticketButtonText}>Get Tickets</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  featuredBadge: {
    position: 'absolute',
    top: 48,
    right: 20,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  cuisineList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cuisineTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  cuisineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  vendorLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  vendorTagline: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 100,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    boxShadow: '0px -2px 12px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  rsvpButtonActive: {
    borderColor: colors.primary,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ticketButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
