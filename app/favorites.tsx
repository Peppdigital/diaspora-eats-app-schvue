import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import * as Haptics from 'expo-haptics';

type Favorite = {
  id: string;
  vendor_id?: string;
  vendor?: {
    id: string;
    name: string;
    tagline?: string;
    cover_image?: string;
    banner_url?: string;
    rating?: number;
    rating_average?: number;
    city?: string;
    state?: string;
    offers_delivery?: boolean;
    diaspora_focus?: string[];
    avg_price_level?: string;
  };
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFavorites = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    console.log('[Favorites] Fetching favorites');
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api-favorites');
      const list: Favorite[] = data?.favorites || data || [];
      console.log('[Favorites] Loaded', list.length, 'favorites');
      setFavorites(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load favorites';
      console.log('[Favorites] Fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => {
    fetchFavorites();
  }, [fetchFavorites]));

  const handleRemoveFavorite = (favoriteId: string) => {
    console.log('[Favorites] Remove favorite tapped:', favoriteId);
    Alert.alert('Remove Favorite', 'Remove this from your favorites?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api-favorites/${favoriteId}`);
            console.log('[Favorites] Removed favorite:', favoriteId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to remove';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  const getVendorImage = (fav: Favorite) => fav.vendor?.cover_image || fav.vendor?.banner_url || '';
  const getVendorRating = (fav: Favorite) => Number(fav.vendor?.rating ?? fav.vendor?.rating_average ?? 0).toFixed(1);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Favorites</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.emptyContainer}>
            <IconSymbol ios_icon_name="heart" android_material_icon_name="favorite-border" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Sign In to View Favorites</Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/auth/customer-auth')}>
              <Text style={styles.browseButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            <Text style={styles.headerTitle}>Favorites</Text>
            <View style={{ width: 40 }} />
          </View>

          {loading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>}

          {error !== '' && !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.browseButton} onPress={fetchFavorites}>
                <Text style={styles.browseButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && error === '' && favorites.length > 0 && (
            <View style={styles.vendorsList}>
              {favorites.map((fav) => {
                const vendor = fav.vendor;
                if (!vendor) return null;
                const vendorImage = getVendorImage(fav);
                const rating = getVendorRating(fav);
                return (
                  <View key={fav.id} style={styles.vendorCard}>
                    <TouchableOpacity
                      style={styles.vendorContent}
                      onPress={() => {
                        console.log('[Favorites] Vendor tapped:', vendor.id, vendor.name);
                        router.push(`/vendor-detail?id=${vendor.id}`);
                      }}
                      activeOpacity={0.7}
                    >
                      {vendorImage !== '' && (
                        <Image source={{ uri: vendorImage }} style={styles.vendorImage} resizeMode="cover" />
                      )}
                      <View style={styles.vendorInfo}>
                        <View style={styles.vendorHeader}>
                          <View style={styles.vendorTitleRow}>
                            <Text style={styles.vendorName}>{vendor.name}</Text>
                            <View style={styles.ratingBadge}>
                              <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={12} color="#FFD700" />
                              <Text style={styles.ratingText}>{rating}</Text>
                            </View>
                          </View>
                          {vendor.tagline && <Text style={styles.vendorTagline}>{vendor.tagline}</Text>}
                        </View>
                        {vendor.diaspora_focus && (
                          <View style={styles.tagsRow}>
                            {vendor.diaspora_focus.slice(0, 2).map((focus, idx) => (
                              <View key={idx} style={styles.tag}>
                                <Text style={styles.tagText}>{focus}</Text>
                              </View>
                            ))}
                            {vendor.avg_price_level && (
                              <View style={styles.tag}>
                                <Text style={styles.tagText}>{vendor.avg_price_level}</Text>
                              </View>
                            )}
                          </View>
                        )}
                        <View style={styles.vendorMeta}>
                          {vendor.city && (
                            <View style={styles.metaItem}>
                              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={14} color={colors.textSecondary} />
                              <Text style={styles.metaText}>{vendor.city}{vendor.state ? `, ${vendor.state}` : ''}</Text>
                            </View>
                          )}
                          {vendor.offers_delivery && (
                            <View style={styles.metaItem}>
                              <IconSymbol ios_icon_name="car.fill" android_material_icon_name="local-shipping" size={14} color={colors.textSecondary} />
                              <Text style={styles.metaText}>Delivery</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.favoriteButton} onPress={() => handleRemoveFavorite(fav.id)}>
                      <IconSymbol ios_icon_name="heart.fill" android_material_icon_name="favorite" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {!loading && error === '' && favorites.length === 0 && (
            <View style={styles.emptyContainer}>
              <IconSymbol ios_icon_name="heart" android_material_icon_name="favorite-border" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Favorites Yet</Text>
              <Text style={styles.emptyText}>Start exploring and save your favorite restaurants</Text>
              <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/(tabs)/(home)')}>
                <Text style={styles.browseButtonText}>Browse Vendors</Text>
              </TouchableOpacity>
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
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  vendorsList: { gap: 16 },
  vendorCard: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', elevation: 2 },
  vendorContent: { flex: 1 },
  vendorImage: { width: '100%', height: 160, backgroundColor: colors.highlight },
  vendorInfo: { padding: 16 },
  vendorHeader: { marginBottom: 12 },
  vendorTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  vendorName: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, marginRight: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.highlight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 12, fontWeight: '600', color: colors.text },
  vendorTagline: { fontSize: 14, color: colors.textSecondary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.highlight, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  vendorMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  favoriteButton: { position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 8 },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, paddingHorizontal: 40 },
  browseButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
