
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { MOCK_VENDORS } from '@/constants/MockVendorData';
import * as Haptics from 'expo-haptics';

export default function FavoritesScreen() {
  const router = useRouter();
  // Mock favorites - in real app, this would come from user's saved vendors
  const [favorites, setFavorites] = useState(MOCK_VENDORS.slice(0, 3));

  const handleRemoveFavorite = (vendorId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFavorites(favorites.filter(v => v.id !== vendorId));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol 
                ios_icon_name="chevron.left" 
                android_material_icon_name="arrow_back"
                size={24} 
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Favorites</Text>
            <View style={{ width: 40 }} />
          </View>

          {favorites.length > 0 ? (
            <View style={styles.vendorsList}>
              {favorites.map((vendor, index) => (
                <View key={index} style={styles.vendorCard}>
                  <TouchableOpacity
                    style={styles.vendorContent}
                    onPress={() => router.push(`/vendor-detail?id=${vendor.id}`)}
                    activeOpacity={0.7}
                  >
                    {vendor.cover_image && (
                      <Image 
                        source={{ uri: vendor.cover_image }} 
                        style={styles.vendorImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.vendorInfo}>
                      <View style={styles.vendorHeader}>
                        <View style={styles.vendorTitleRow}>
                          <Text style={styles.vendorName}>{vendor.name}</Text>
                          <View style={styles.ratingBadge}>
                            <IconSymbol 
                              ios_icon_name="star.fill" 
                              android_material_icon_name="star"
                              size={12} 
                              color="#FFD700"
                            />
                            <Text style={styles.ratingText}>{vendor.rating_average}</Text>
                          </View>
                        </View>
                        <Text style={styles.vendorTagline}>{vendor.tagline}</Text>
                      </View>

                      <View style={styles.tagsRow}>
                        {vendor.diaspora_focus.slice(0, 2).map((focus, idx) => (
                          <View key={idx} style={styles.tag}>
                            <Text style={styles.tagText}>{focus}</Text>
                          </View>
                        ))}
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>{vendor.avg_price_level}</Text>
                        </View>
                      </View>

                      <View style={styles.vendorMeta}>
                        <View style={styles.metaItem}>
                          <IconSymbol 
                            ios_icon_name="location.fill" 
                            android_material_icon_name="location_on"
                            size={14} 
                            color={colors.textSecondary}
                          />
                          <Text style={styles.metaText}>{vendor.city}, {vendor.state}</Text>
                        </View>
                        {vendor.offers_delivery && (
                          <View style={styles.metaItem}>
                            <IconSymbol 
                              ios_icon_name="car.fill" 
                              android_material_icon_name="local_shipping"
                              size={14} 
                              color={colors.textSecondary}
                            />
                            <Text style={styles.metaText}>Delivery</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleRemoveFavorite(vendor.id)}
                  >
                    <IconSymbol 
                      ios_icon_name="heart.fill" 
                      android_material_icon_name="favorite"
                      size={24} 
                      color="#FF3B30"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol 
                ios_icon_name="heart" 
                android_material_icon_name="favorite_border"
                size={64} 
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No Favorites Yet</Text>
              <Text style={styles.emptyText}>
                Start exploring and save your favorite restaurants and grocery stores
              </Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => router.push('/(tabs)/(home)')}
              >
                <Text style={styles.browseButtonText}>Browse Vendors</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Spacer */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  vendorsList: {
    gap: 16,
  },
  vendorCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  vendorContent: {
    flex: 1,
  },
  vendorImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.highlight,
  },
  vendorInfo: {
    padding: 16,
  },
  vendorHeader: {
    marginBottom: 12,
  },
  vendorTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  vendorName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.highlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  vendorTagline: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.highlight,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },
  vendorMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
