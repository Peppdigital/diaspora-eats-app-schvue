
import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import * as colors from '@/components/colors';
import { MenuCategory, MenuItem } from '@/types/database.types';
import * as Haptics from 'expo-haptics';

// Mock menu data
const MOCK_CATEGORIES: MenuCategory[] = [
  { id: '1', vendor_id: 'v1', name: 'Appetizers', sort_order: 1 },
  { id: '2', vendor_id: 'v1', name: 'Main Dishes', sort_order: 2 },
  { id: '3', vendor_id: 'v1', name: 'Sides', sort_order: 3 },
  { id: '4', vendor_id: 'v1', name: 'Desserts', sort_order: 4 },
];

const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    vendor_id: 'v1',
    category_id: '1',
    name: 'Puff Puff',
    description: 'Sweet fried dough balls',
    diaspora_segment_tag: 'African',
    cuisine_tag: 'Nigerian',
    price: 8.99,
    is_available: true,
    is_highlighted: false,
    spicy_level: 'None',
    is_vegetarian: true,
    is_vegan: false,
    is_gluten_free: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    vendor_id: 'v1',
    category_id: '2',
    name: 'Jollof Rice with Chicken',
    description: 'Classic West African rice dish with grilled chicken',
    diaspora_segment_tag: 'African',
    cuisine_tag: 'Nigerian',
    price: 18.99,
    is_available: true,
    is_highlighted: true,
    spicy_level: 'Medium',
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    vendor_id: 'v1',
    category_id: '2',
    name: 'Egusi Soup',
    description: 'Rich melon seed soup with assorted meats',
    diaspora_segment_tag: 'African',
    cuisine_tag: 'Nigerian',
    price: 22.99,
    is_available: false,
    is_highlighted: false,
    spicy_level: 'Hot',
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function VendorMenuScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>(MOCK_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleToggleAvailability = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuItems(menuItems.map(item => 
      item.id === itemId ? { ...item, is_available: !item.is_available } : item
    ));
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const newCategory: MenuCategory = {
      id: Date.now().toString(),
      vendor_id: 'v1',
      name: newCategoryName,
      sort_order: categories.length + 1,
    };

    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setIsAddingCategory(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? All items in this category will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCategories(categories.filter(cat => cat.id !== categoryId));
            setMenuItems(menuItems.filter(item => item.category_id !== categoryId));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleEditItem = (itemId: string) => {
    router.push({
      pathname: '/vendor-menu-item',
      params: { itemId },
    });
  };

  const handleAddItem = (categoryId: string) => {
    router.push({
      pathname: '/vendor-menu-item',
      params: { categoryId },
    });
  };

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
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
            <Text style={styles.headerTitle}>Menu Management</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Add Category Button */}
          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={() => setIsAddingCategory(true)}
          >
            <IconSymbol 
              ios_icon_name="plus.circle.fill" 
              android_material_icon_name="add_circle"
              size={24} 
              color={colors.primary}
            />
            <Text style={styles.addCategoryButtonText}>Add Category</Text>
          </TouchableOpacity>

          {/* Add Category Form */}
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
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton]}
                  onPress={handleAddCategory}
                >
                  <Text style={styles.saveButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Categories List */}
          <View style={styles.categoriesList}>
            {categories.map((category, index) => {
              const items = getItemsForCategory(category.id);
              const isExpanded = expandedCategory === category.id;

              return (
                <View key={index} style={styles.categoryCard}>
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
                    <TouchableOpacity
                      style={styles.deleteIconButton}
                      onPress={() => handleDeleteCategory(category.id)}
                    >
                      <IconSymbol 
                        ios_icon_name="trash" 
                        android_material_icon_name="delete"
                        size={18} 
                        color="#FF3B30"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.categoryContent}>
                      {/* Add Item Button */}
                      <TouchableOpacity
                        style={styles.addItemButton}
                        onPress={() => handleAddItem(category.id)}
                      >
                        <IconSymbol 
                          ios_icon_name="plus" 
                          android_material_icon_name="add"
                          size={16} 
                          color={colors.primary}
                        />
                        <Text style={styles.addItemButtonText}>Add Item</Text>
                      </TouchableOpacity>

                      {/* Menu Items */}
                      {items.length > 0 ? (
                        items.map((item, itemIndex) => (
                          <View key={itemIndex} style={styles.menuItemCard}>
                            <View style={styles.menuItemHeader}>
                              <View style={styles.menuItemInfo}>
                                <Text style={styles.menuItemName}>{item.name}</Text>
                                <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                              </View>
                              <View style={styles.menuItemActions}>
                                <View style={styles.availabilityToggle}>
                                  <Text style={styles.availabilityLabel}>
                                    {item.is_available ? 'Available' : 'Unavailable'}
                                  </Text>
                                  <Switch
                                    value={item.is_available}
                                    onValueChange={() => handleToggleAvailability(item.id)}
                                    trackColor={{ false: colors.highlight, true: colors.primary }}
                                    thumbColor="#FFFFFF"
                                  />
                                </View>
                              </View>
                            </View>
                            <Text style={styles.menuItemDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                            <View style={styles.menuItemFooter}>
                              <View style={styles.menuItemBadges}>
                                {item.is_highlighted && (
                                  <View style={styles.badge}>
                                    <IconSymbol 
                                      ios_icon_name="star.fill" 
                                      android_material_icon_name="star"
                                      size={12} 
                                      color="#FFD700"
                                    />
                                    <Text style={styles.badgeText}>Featured</Text>
                                  </View>
                                )}
                                {item.spicy_level !== 'None' && (
                                  <View style={styles.badge}>
                                    <Text style={styles.badgeText}>🌶️ {item.spicy_level}</Text>
                                  </View>
                                )}
                              </View>
                              <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleEditItem(item.id)}
                              >
                                <IconSymbol 
                                  ios_icon_name="pencil" 
                                  android_material_icon_name="edit"
                                  size={16} 
                                  color={colors.primary}
                                />
                                <Text style={styles.editButtonText}>Edit</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
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
          </View>

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
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  addCategoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  addCategoryForm: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  input: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.highlight,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  itemCount: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  deleteIconButton: {
    padding: 8,
  },
  categoryContent: {
    borderTopWidth: 1,
    borderTopColor: colors.highlight,
    padding: 16,
    gap: 12,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  addItemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  menuItemCard: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  menuItemActions: {
    marginLeft: 12,
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  menuItemDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemBadges: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyItems: {
    padding: 20,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
