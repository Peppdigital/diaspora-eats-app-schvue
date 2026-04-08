import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Star, MapPin, Truck, UtensilsCrossed } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiGet } from '@/utils/api';

const GOLD = '#C9A84C';
const BG = '#0D0D0D';
const CARD_BG = '#1A1A1A';
const MUTED = '#A0A0A0';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

type MenuCategory = { id: string; name: string; sort_order?: number };
type MenuItem = {
  id: string;
  vendor_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  is_highlighted?: boolean;
  is_featured?: boolean;
  spicy_level?: string;
  image_url?: string;
};
type VendorDetail = {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  cover_image?: string;
  banner_url?: string;
  rating?: number;
  rating_average?: number;
  city?: string;
  state?: string;
  offers_delivery?: boolean;
  offers_pickup?: boolean;
  offers_dine_in?: boolean;
  diaspora_focus?: string[];
  avg_price_level?: string;
  phone?: string;
  website?: string;
  menu_categories: MenuCategory[];
  menu_items: MenuItem[];
};

const SPICY_COLORS: Record<string, string> = {
  'Mild': '#FFA500',
  'Medium': '#FF8C00',
  'Hot': '#FF4500',
  'Extra Hot': '#FF0000',
};

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendor = async () => {
    if (!id) return;
    console.log('[VendorDetail] Fetching vendor:', id);
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<VendorDetail>(`/api-vendors/${id}`);
      console.log('[VendorDetail] Vendor loaded:', data.name);
      setVendor(data);
    } catch (err: any) {
      console.error('[VendorDetail] Fetch error:', err?.message);
      setError(err?.message ?? 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const handleBack = () => {
    console.log('[VendorDetail] Back button pressed');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleMenuItemPress = (item: MenuItem) => {
    console.log('[VendorDetail] Menu item tapped:', item.id, item.name);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/menu-item-detail?id=${item.id}`);
  };

  const heroImageUri = vendor?.cover_image || vendor?.banner_url || '';

  const ratingDisplay = vendor
    ? String(Number(vendor.rating_average ?? vendor.rating ?? 0).toFixed(1))
    : '0.0';

  const locationDisplay = [vendor?.city, vendor?.state].filter(Boolean).join(', ');

  // Group available items by category
  const availableItems = vendor?.menu_items.filter((i) => i.is_available) ?? [];
  const categoryMap: Record<string, MenuCategory> = {};
  (vendor?.menu_categories ?? []).forEach((c) => { categoryMap[c.id] = c; });

  const grouped: { category: MenuCategory | null; items: MenuItem[] }[] = [];
  const seenCategoryIds = new Set<string>();

  availableItems.forEach((item) => {
    const catId = item.category_id ?? '__uncategorized__';
    if (!seenCategoryIds.has(catId)) {
      seenCategoryIds.add(catId);
      const cat = item.category_id ? (categoryMap[item.category_id] ?? null) : null;
      grouped.push({ category: cat, items: [] });
    }
    const group = grouped.find((g) => {
      const gId = g.category?.id ?? '__uncategorized__';
      return gId === catId;
    });
    if (group) group.items.push(item);
  });

  // Sort categories by sort_order
  grouped.sort((a, b) => {
    const aOrder = a.category?.sort_order ?? 999;
    const bOrder = b.category?.sort_order ?? 999;
    return aOrder - bOrder;
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, backgroundColor: BG }}>
        {loading && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={GOLD} size="large" />
          </View>
        )}

        {error && !loading && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <Text style={{ color: MUTED, fontFamily: 'Poppins-Regular', fontSize: 15, textAlign: 'center', marginBottom: 20 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => { console.log('[VendorDetail] Retry pressed'); fetchVendor(); }}
              style={{ backgroundColor: GOLD, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 }}
            >
              <Text style={{ color: BG, fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && vendor && (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          >
            {/* Hero */}
            <View style={{ height: 260, width: '100%', backgroundColor: '#1A1A1A' }}>
              {heroImageUri ? (
                <Image
                  source={resolveImageSource(heroImageUri)}
                  style={{ width: '100%', height: 260 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <UtensilsCrossed size={48} color="#333333" />
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(13,13,13,0.85)', BG]}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
              />
            </View>

            {/* Vendor Info */}
            <View style={{ paddingHorizontal: 20, marginTop: -8 }}>
              <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 26, color: '#FFFFFF', marginBottom: 4 }}>
                {vendor.name}
              </Text>

              {!!vendor.tagline && (
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: MUTED, fontStyle: 'italic', marginBottom: 12 }}>
                  {vendor.tagline}
                </Text>
              )}

              {/* Info chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {(vendor.rating_average !== undefined || vendor.rating !== undefined) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderWidth: 1, borderColor: '#333333', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, gap: 4 }}>
                    <Star size={12} color={GOLD} fill={GOLD} />
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#FFFFFF' }}>
                      {ratingDisplay}
                    </Text>
                  </View>
                )}
                {!!vendor.avg_price_level && (
                  <View style={{ backgroundColor: CARD_BG, borderWidth: 1, borderColor: '#333333', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#FFFFFF' }}>
                      {vendor.avg_price_level}
                    </Text>
                  </View>
                )}
                {!!locationDisplay && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderWidth: 1, borderColor: '#333333', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, gap: 4 }}>
                    <MapPin size={12} color={MUTED} />
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#FFFFFF' }}>
                      {locationDisplay}
                    </Text>
                  </View>
                )}
              </View>

              {/* Service badges */}
              {(vendor.offers_delivery || vendor.offers_pickup || vendor.offers_dine_in) && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {vendor.offers_delivery && (
                    <View style={{ borderWidth: 1, borderColor: GOLD, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: GOLD }}>Delivery</Text>
                    </View>
                  )}
                  {vendor.offers_pickup && (
                    <View style={{ borderWidth: 1, borderColor: GOLD, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: GOLD }}>Pickup</Text>
                    </View>
                  )}
                  {vendor.offers_dine_in && (
                    <View style={{ borderWidth: 1, borderColor: GOLD, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: GOLD }}>Dine-in</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Diaspora focus tags */}
              {vendor.diaspora_focus && vendor.diaspora_focus.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
                  {vendor.diaspora_focus.map((tag) => (
                    <View key={tag} style={{ backgroundColor: '#252525', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: MUTED }}>{tag}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Menu */}
            {grouped.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
                {grouped.map((group) => {
                  const categoryName = group.category?.name ?? 'Menu';
                  return (
                    <View key={group.category?.id ?? '__uncategorized__'} style={{ marginBottom: 28 }}>
                      {/* Category header */}
                      <View style={{ marginBottom: 14 }}>
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 16, color: GOLD, marginBottom: 6 }}>
                          {categoryName}
                        </Text>
                        <View style={{ height: 1, backgroundColor: GOLD, opacity: 0.35 }} />
                      </View>

                      {/* Items */}
                      {group.items.map((item) => {
                        const priceDisplay = `$${Number(item.price).toFixed(2)}`;
                        const spicyColor = item.spicy_level ? (SPICY_COLORS[item.spicy_level] ?? '#FFA500') : null;

                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => handleMenuItemPress(item)}
                            activeOpacity={0.75}
                            style={{
                              backgroundColor: CARD_BG,
                              borderRadius: 12,
                              borderCurve: 'continuous',
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 12,
                              marginBottom: 10,
                            }}
                          >
                            {/* Left content */}
                            <View style={{ flex: 1, marginRight: 12 }}>
                              {/* Badges row */}
                              {(item.is_featured || !!item.spicy_level) && (
                                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                                  {item.is_featured && (
                                    <View style={{ backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 10, color: GOLD }}>★ Featured</Text>
                                    </View>
                                  )}
                                  {!!item.spicy_level && !!spicyColor && (
                                    <View style={{ backgroundColor: `${spicyColor}22`, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 10, color: spicyColor }}>
                                        {item.spicy_level}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              )}
                              <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 15, color: '#FFFFFF', marginBottom: 3 }}>
                                {item.name}
                              </Text>
                              {!!item.description && (
                                <Text
                                  numberOfLines={2}
                                  style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: MUTED, marginBottom: 6, lineHeight: 18 }}
                                >
                                  {item.description}
                                </Text>
                              )}
                              <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15, color: GOLD }}>
                                {priceDisplay}
                              </Text>
                            </View>

                            {/* Right image */}
                            {item.image_url ? (
                              <Image
                                source={resolveImageSource(item.image_url)}
                                style={{ width: 70, height: 70, borderRadius: 8 }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: '#252525', justifyContent: 'center', alignItems: 'center' }}>
                                <UtensilsCrossed size={24} color="#333333" />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* Back button — absolutely positioned over hero */}
        <TouchableOpacity
          onPress={handleBack}
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(13,13,13,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={22} color={GOLD} />
        </TouchableOpacity>
      </View>
    </>
  );
}
