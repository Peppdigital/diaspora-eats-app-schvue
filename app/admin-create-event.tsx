import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { GradientFill } from '@/components/GradientFill';
import { api } from '@/utils/api';
import { US_STATES, MAJOR_CITIES_BY_STATE } from '@/constants/LocationData';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

type EventType = 'Brunch' | 'Festival' | 'Pop-up' | 'Market' | 'Tasting' | 'Party' | 'Meetup';
type DiasporaSegment = 'African American' | 'Caribbean' | 'African' | 'Pan-African';

const EVENT_TYPES: EventType[] = ['Brunch', 'Festival', 'Pop-up', 'Market', 'Tasting', 'Party', 'Meetup'];
const DIASPORA_SEGMENTS: DiasporaSegment[] = ['African American', 'Caribbean', 'African', 'Pan-African'];
const CUISINES = ['Nigerian', 'Jamaican', 'Soul Food', 'Ethiopian', 'Ghanaian', 'Haitian', 'Trinidadian', 'Senegalese', 'Kenyan', 'Southern', 'Creole', 'Caribbean'];

export default function AdminCreateEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('Brunch');
  const [diasporaFocus, setDiasporaFocus] = useState<DiasporaSegment[]>([]);
  const [cuisinesHighlighted, setCuisinesHighlighted] = useState<string[]>([]);
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueZip, setVenueZip] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (!id) return;
    console.log('[AdminCreateEvent] Loading event for edit:', id);
    api.get(`/api-events/${id}`)
      .then((data) => {
        const ev = data?.event || data;
        if (ev) {
          setTitle(ev.title || '');
          setSubtitle(ev.subtitle || '');
          setDescription(ev.description || '');
          setEventType(ev.event_type || 'Brunch');
          setDiasporaFocus(ev.diaspora_focus || []);
          setCuisinesHighlighted(ev.cuisines_highlighted || []);
          setState(ev.state || '');
          setCity(ev.city || '');
          setVenueName(ev.venue_name || '');
          setVenueAddress(ev.venue_address_line1 || '');
          setVenueZip(ev.venue_zip || '');
          setHeroImage(ev.hero_image || ev.image_url || '');
          setTicketUrl(ev.ticket_url || '');
          setIsPublished(ev.is_published !== false);
          setIsFeatured(ev.is_featured || false);
        }
      })
      .catch((err: unknown) => console.log('[AdminCreateEvent] Load error:', err instanceof Error ? err.message : err))
      .finally(() => setInitialLoading(false));
  }, [id]);

  const toggleDiasporaFocus = (segment: DiasporaSegment) => {
    if (diasporaFocus.includes(segment)) {
      setDiasporaFocus(diasporaFocus.filter((s) => s !== segment));
    } else {
      setDiasporaFocus([...diasporaFocus, segment]);
    }
  };

  const toggleCuisine = (cuisine: string) => {
    if (cuisinesHighlighted.includes(cuisine)) {
      setCuisinesHighlighted(cuisinesHighlighted.filter((c) => c !== cuisine));
    } else {
      setCuisinesHighlighted([...cuisinesHighlighted, cuisine]);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setHeroImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter an event title'); return; }
    if (diasporaFocus.length === 0) { Alert.alert('Error', 'Please select at least one diaspora focus'); return; }
    if (!state || !city) { Alert.alert('Error', 'Please select state and city'); return; }

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      event_type: eventType,
      diaspora_focus: diasporaFocus,
      cuisines_highlighted: cuisinesHighlighted,
      state,
      city,
      venue_name: venueName.trim(),
      venue_address_line1: venueAddress.trim(),
      venue_zip: venueZip.trim(),
      hero_image: heroImage || undefined,
      ticket_url: ticketUrl.trim() || undefined,
      is_published: isPublished,
      is_featured: isFeatured,
    };

    console.log('[AdminCreateEvent] Save pressed, mode:', isEditing ? 'edit' : 'create');
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/api-events/${id}`, payload);
        console.log('[AdminCreateEvent] Event updated:', id);
      } else {
        const data = await api.post('/api-events', payload);
        console.log('[AdminCreateEvent] Event created:', data?.event?.id || data?.id);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', isEditing ? 'Event updated successfully' : 'Event created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save event';
      console.log('[AdminCreateEvent] Save error:', msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const citiesForState = state ? MAJOR_CITIES_BY_STATE[state] || [] : [];

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit Event' : 'Create Event'}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hero Image</Text>
            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
              {heroImage !== '' ? (
                <Image source={{ uri: heroImage }} style={styles.heroImagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <IconSymbol ios_icon_name="photo" android_material_icon_name="image" size={48} color={colors.textSecondary} />
                  <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput style={styles.input} placeholder="Event title" placeholderTextColor={colors.textSecondary} value={title} onChangeText={setTitle} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subtitle</Text>
              <TextInput style={styles.input} placeholder="Short tagline" placeholderTextColor={colors.textSecondary} value={subtitle} onChangeText={setSubtitle} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Tell attendees about this event..." placeholderTextColor={colors.textSecondary} value={description} onChangeText={setDescription} multiline numberOfLines={6} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Type *</Text>
            <View style={styles.chipGrid}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity key={type} style={[styles.chip, eventType === type && styles.chipActive]} onPress={() => setEventType(type)}>
                  {eventType === type && <GradientFill borderRadius={20} />}
                  <Text style={[styles.chipText, eventType === type && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diaspora Focus *</Text>
            <View style={styles.chipGrid}>
              {DIASPORA_SEGMENTS.map((segment) => (
                <TouchableOpacity key={segment} style={[styles.chip, diasporaFocus.includes(segment) && styles.chipActive]} onPress={() => toggleDiasporaFocus(segment)}>
                  {diasporaFocus.includes(segment) && <GradientFill borderRadius={20} />}
                  <Text style={[styles.chipText, diasporaFocus.includes(segment) && styles.chipTextActive]}>{segment}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuisines Highlighted</Text>
            <View style={styles.chipGrid}>
              {CUISINES.map((cuisine) => (
                <TouchableOpacity key={cuisine} style={[styles.chip, cuisinesHighlighted.includes(cuisine) && styles.chipActive]} onPress={() => toggleCuisine(cuisine)}>
                  {cuisinesHighlighted.includes(cuisine) && <GradientFill borderRadius={20} />}
                  <Text style={[styles.chipText, cuisinesHighlighted.includes(cuisine) && styles.chipTextActive]}>{cuisine}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>State *</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {US_STATES.map((s) => (
                    <TouchableOpacity
                      key={s.code}
                      style={[styles.pickerChip, state === s.code && styles.pickerChipActive]}
                      onPress={() => { setState(s.code); setCity(''); }}
                    >
                      {state === s.code && <GradientFill borderRadius={12} />}
                      <Text style={[styles.pickerChipText, state === s.code && styles.pickerChipTextActive]}>{s.code}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            {state !== '' && citiesForState.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City *</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                    {citiesForState.map((c) => (
                      <TouchableOpacity key={c} style={[styles.pickerChip, city === c && styles.pickerChipActive]} onPress={() => setCity(c)}>
                        {city === c && <GradientFill borderRadius={12} />}
                        <Text style={[styles.pickerChipText, city === c && styles.pickerChipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue Name</Text>
              <TextInput style={styles.input} placeholder="Venue or location name" placeholderTextColor={colors.textSecondary} value={venueName} onChangeText={setVenueName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue Address</Text>
              <TextInput style={styles.input} placeholder="Street address" placeholderTextColor={colors.textSecondary} value={venueAddress} onChangeText={setVenueAddress} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput style={styles.input} placeholder="90001" placeholderTextColor={colors.textSecondary} value={venueZip} onChangeText={setVenueZip} keyboardType="number-pad" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ticketing</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ticket URL (optional)</Text>
              <TextInput style={styles.input} placeholder="https://eventbrite.com/..." placeholderTextColor={colors.textSecondary} value={ticketUrl} onChangeText={setTicketUrl} autoCapitalize="none" keyboardType="url" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publishing</Text>
            <TouchableOpacity style={styles.toggleRow} onPress={() => setIsPublished(!isPublished)}>
              <Text style={styles.toggleLabel}>Published</Text>
              <View style={[styles.toggle, isPublished && { backgroundColor: colors.primary }]}>
                <View style={[styles.toggleThumb, isPublished && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleRow} onPress={() => setIsFeatured(!isFeatured)}>
              <Text style={styles.toggleLabel}>Featured</Text>
              <View style={[styles.toggle, isFeatured && { backgroundColor: colors.primary }]}>
                <View style={[styles.toggleThumb, isFeatured && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
            {!loading && <GradientFill borderRadius={12} />}
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}</Text>
          </TouchableOpacity>

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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  imagePickerButton: { borderRadius: 12, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 2, borderColor: colors.highlight, borderStyle: 'dashed' },
  heroImagePreview: { width: '100%', height: 200 },
  imagePlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.highlight },
  textArea: { height: 120, textAlignVertical: 'top' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.highlight },
  chipActive: { backgroundColor: 'transparent', borderColor: '#9C7C1A', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#1A1000' },
  pickerContainer: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.highlight },
  pickerScroll: { padding: 8, gap: 8 },
  pickerChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.highlight },
  pickerChipActive: { backgroundColor: 'transparent', borderColor: '#9C7C1A', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  pickerChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  pickerChipTextActive: { color: '#1A1000' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.highlight },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  toggle: { width: 50, height: 30, borderRadius: 15, backgroundColor: colors.highlight, justifyContent: 'center', padding: 2 },
  toggleThumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF' },
  toggleThumbActive: { alignSelf: 'flex-end' },
  saveButton: { backgroundColor: 'transparent', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#1A1000' },
});
