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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { api } from '@/utils/api';
import * as Haptics from 'expo-haptics';

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
};

type MenuCategory = {
  id: string;
  vendor_id: string;
  name: string;
  sort_order?: number;
  items?: MenuItem[];
};

export default function VendorMenuScreen() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMenu = useCallback(async () => {
    console.log('[VendorMenu] Fetching menu');
    setLoading(true);
    setError('');
    try {
      const vendorData = await api.get('/api-vendors/me');
      const vid = vendorData?.vendor?.id || vendorData?.id;
      setVendorId(vid);
      if (!vid) throw new Error('No vendor profile found');

      const menuData = await api.get(`/api-menu-items/${vid}`);
      const items: MenuItem[] = menuData?.menu_items || menuData?.items || menuData || [];
      console.log('[VendorMenu] Loaded', items.length, 'menu items');
      setMenuItems(items);

      // Build categories from items
      const catMap = new Map<string, MenuCategory>();
      items.forEach((item) => {
        const catId = item.category_id || 'uncategorized';
        if (!catMap.has(catId)) {
          catMap.set(catId, { id: catId, vendor_id: vid, name: catId === 'uncategorized' ? 'Menu Items' : catId });
        }
      });
      setCategories(Array.from(catMap.values()));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load menu';
      console.log('[VendorMenu] Fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(fetchMenu);

  const handleToggleAvailability = async (itemId: string, currentValue: boolean) => {
    if (!vendorId) return;
    console.log('[VendorMenu] Toggle availability:', itemId, '-> ', !currentValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.put(`/api-menu-items/${vendorId}/${itemId}`, { is_available: !currentValue });
      setMenuItems((prev) => prev.map((item) => item.id === itemId ? { ...item, is_available: !currentValue } : item));
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!vendorId) return;
    console.log('[VendorMenu] Delete item pressed:', itemId);
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api-menu-items/${vendorId}/${itemId}`);
            console.log('[VendorMenu] Item deleted:', itemId);
            setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  const handleEditItem = (itemId: string) => {
    console.log('[VendorMenu] Edit item pressed:', itemId);
    router.push({ pathname: '/vendor-menu-item', params: { itemId, vendorId: vendorId || '' } });
  };

  const handleAddItem = (categoryId: string) => {
    console.log('[VendorMenu] Add item pressed for category:', categoryId);
    router.push({ pathname: '/vendor-menu-item', params: { categoryId, vendorId: vendorId || '' } });
  };

  const getItemsForCategory = (categoryId: string) =>
    menuItems.filter((item) => (item.category_id || 'uncategorized') === categoryId);

  const isFeatured = (item: MenuItem) => item.is_highlighted || item.is_featured;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Menu Management</Text>
            <View style={{ width: 40 }} />
          </View>

          {loading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>}

          {error !== '' && !loading && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchMenu}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && error === '' && (
            <>
              <TouchableOpacity style={styles.addCategoryButton} onPress={() => setIsAddingCategory(true)}>
                <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add_circle" size={24} color={colors.primary} />
                <Text style={styles.addCategoryButtonText}>Add Item</Text>
              </TouchableOpacity>

              {isAddingCategory && (
                <View style={styles.addCategoryForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Category name"
                    placeholderTextColor={colors.textSecondary}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoFocus
                  />
                  <View style={styles.formButtons}>
                    <TouchableOpacity style={[styles.formButton, styles.cancelButton]} onPress={() => { setIsAddingCategory(false); setNewCategoryName(''); }}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.formButton, styles.saveButton]}
                      onPress={() => {
                        console.log('[VendorMenu] Add category pressed:', newCategoryName);
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }}
                    >
                      <Text style={styles.saveButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.categoriesList}>
                {categories.map((category) => {
                  const items = getItemsForCategory(category.id);
                  const isExpanded = expandedCategory === category.id;
                  return (
                    <View key={category.id} style={styles.categoryCard}>
                      <TouchableOpacity
                        style={styles.categoryHeader}
                        onPress={() => setExpandedCategory(isExpanded ? null : category.id)}
                      >
                        <View style={styles.categoryHeaderLeft}>
                          <IconSymbol
                            ios_icon_name={isExpanded ? 'chevron.down' : 'chevron.right'}
                            android_material_icon_name={isExpanded ? 'expand_more' : 'chevron_right'}
                            size={20}
                            color={colors.text}
                          />
                          <Text style={styles.categoryName}>{category.name}</Text>
                          <View style={styles.itemCount}>
                            <Text style={styles.itemCountText}>{items.length}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.categoryContent}>
                          <TouchableOpacity style={styles.addItemButton} onPress={() => handleAddItem(category.id)}>
                            <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={16} color={colors.primary} />
                            <Text style={styles.addItemButtonText}>Add Item</Text>
                          </TouchableOpacity>
                          {items.length > 0 ? (
                            items.map((item) => {
                              const priceDisplay = Number(item.price).toFixed(2);
                              const featured = isFeatured(item);
                              return (
                                <View key={item.id} style={styles.menuItemCard}>
                                  <View style={styles.menuItemHeader}>
                                    <View style={styles.menuItemInfo}>
                                      <Text style={styles.menuItemName}>{item.name}</Text>
                                      <Text style={styles.menuItemPrice}>${priceDisplay}</Text>
                                    </View>
                                    <View style={styles.menuItemActions}>
                                      <View style={styles.availabilityToggle}>
                                        <Text style={styles.availabilityLabel}>{item.is_available ? 'Available' : 'Unavailable'}</Text>
                                        <Switch
                                          value={item.is_available}
                                          onValueChange={() => handleToggleAvailability(item.id, item.is_available)}
                                          trackColor={{ false: colors.highlight, true: colors.primary }}
                                          thumbColor="#FFFFFF"
                                        />
                                      </View>
                                    </View>
                                  </View>
                                  {item.description && (
                                    <Text style={styles.menuItemDescription} numberOfLines={2}>{item.description}</Text>
                                  )}
                                  <View style={styles.menuItemFooter}>
                                    <View style={styles.menuItemBadges}>
                                      {featured && (
                                        <View style={styles.badge}>
                                          <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={12} color="#FFD700" />
                                          <Text style={styles.badgeText}>Featured</Text>
                                        </View>
                                      )}
                                    </View>
                                    <View style={styles.itemActions}>
                                      <TouchableOpacity style={styles.editButton} onPress={() => handleEditItem(item.id)}>
                                        <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.primary} />
                                        <Text style={styles.editButtonText}>Edit</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.id)}>
                                        <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={16} color="#FF3B30" />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              );
                            })
                          ) : (
                            <View style={styles.emptyItems}>
                              <Text style={styles.emptyItemsText}>No items in this category</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
                {categories.length === 0 && (
                  <View style={styles.emptyItems}>
                    <Text style={styles.emptyItemsText}>No menu items yet. Add your first item!</Text>
                  </View>
                )}
              </View>
            </>
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
  errorContainer: { paddingVertical: 40, alignItems: 'center' },
  errorText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  addCategoryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, gap: 8, elevation: 2 },
  addCategoryButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  addCategoryForm: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  input: { backgroundColor: colors.highlight, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, marginBottom: 12 },
  formButtons: { flexDirection: 'row', gap: 12 },
  formButton: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: colors.highlight },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  saveButton: { backgroundColor: colors.primary },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  categoriesList: { gap: 12 },
  categoryCard: { backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  categoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  categoryName: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 },
  itemCount: { backgroundColor: colors.highlight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  itemCountText: { fontSize: 12, fontWeight: '600', color: colors.text },
  categoryContent: { borderTopWidth: 1, borderTopColor: colors.highlight, padding: 16, gap: 12 },
  addItemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.highlight, borderRadius: 8, padding: 12, gap: 6 },
  addItemButtonText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  menuItemCard: { backgroundColor: colors.highlight, borderRadius: 8, padding: 12 },
  menuItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  menuItemInfo: { flex: 1 },
  menuItemName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  menuItemPrice: { fontSize: 14, fontWeight: '700', color: colors.primary },
  menuItemActions: { marginLeft: 12 },
  availabilityToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availabilityLabel: { fontSize: 12, color: colors.textSecondary },
  menuItemDescription: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  menuItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuItemBadges: { flexDirection: 'row', gap: 6, flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  badgeText: { fontSize: 11, color: colors.text },
  itemActions: { flexDirection: 'row', gap: 8 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.card, borderRadius: 8 },
  editButtonText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  deleteButton: { padding: 6, backgroundColor: colors.card, borderRadius: 8 },
  emptyItems: { padding: 20, alignItems: 'center' },
  emptyItemsText: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
});
