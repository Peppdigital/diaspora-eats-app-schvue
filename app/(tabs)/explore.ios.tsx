import React, { useState } from "react";
import {
  ScrollView, StyleSheet, View, Text,
  TouchableOpacity, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const diasporaCategories = [
    { name: 'African American', emoji: '🍗', accent: '#C9A84C', sub: 'Soul · Creole · BBQ' },
    { name: 'Caribbean',        emoji: '🌴', accent: '#5FE8D0', sub: 'Jamaican · Haitian · Trini' },
    { name: 'African',          emoji: '🌍', accent: '#E07B4F', sub: 'Nigerian · Ethiopian · Ghanaian' },
    { name: 'Pan-African',      emoji: '✊🏿', accent: '#C9A84C', sub: 'Diaspora-owned · All regions' },
  ];

  const cuisineTypes = [
    { name: 'Soul Food',     emoji: '🍖' },
    { name: 'Jamaican',      emoji: '🌿' },
    { name: 'Nigerian',      emoji: '🫙' },
    { name: 'Ethiopian',     emoji: '🍲' },
    { name: 'Haitian',       emoji: '🥘' },
    { name: 'Ghanaian',      emoji: '🌾' },
    { name: 'Trinidadian',   emoji: '🌶️' },
    { name: 'Senegalese',    emoji: '🐟' },
    { name: 'Creole',        emoji: '🦞' },
    { name: 'Barbadian',     emoji: '🎋' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>DIASPORA EATS</Text>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover Black Diaspora cuisine near you</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={17}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cuisine, city, or restaurant…"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={17}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Community */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Community</Text>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionPillText}>{diasporaCategories.length}</Text>
            </View>
          </View>

          <View style={styles.categoryGrid}>
            {diasporaCategories.map((cat, i) => {
              const isActive = activeCategory === cat.name;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.categoryCardOuter}
                  onPress={() => setActiveCategory(isActive ? null : cat.name)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      isActive
                        ? [cat.accent + '30', cat.accent + '10']
                        : ['#1E1E20', '#161618']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.categoryCard,
                      isActive && { borderColor: cat.accent + '60' },
                    ]}
                  >
                    <View style={[styles.categoryAccentBar, { backgroundColor: cat.accent }]} />
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categorySub}>{cat.sub}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cuisine */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Cuisine</Text>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionPillText}>{cuisineTypes.length}</Text>
            </View>
          </View>

          <View style={styles.cuisineList}>
            {cuisineTypes.map((cuisine, i) => (
              <TouchableOpacity
                key={i}
                style={styles.cuisineItem}
                activeOpacity={0.75}
              >
                <View style={styles.cuisineLeft}>
                  <View style={styles.cuisineEmojiWrap}>
                    <Text style={styles.cuisineEmoji}>{cuisine.emoji}</Text>
                  </View>
                  <Text style={styles.cuisineText}>{cuisine.name}</Text>
                </View>
                <View style={styles.cuisineChevronWrap}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={14}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 64,
    paddingHorizontal: 20,
  },

  // ── Header ───────────────────────────────────────────────────────
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C9A84C',
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },

  // ── Search ──────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1A1A1C',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },

  // ── Section chrome ───────────────────────────────────────────────
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionPill: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  sectionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C9A84C',
    letterSpacing: 0.2,
  },

  // ── Category cards ───────────────────────────────────────────────
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCardOuter: {
    width: '48%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  categoryCard: {
    borderRadius: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    minHeight: 130,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  categoryAccentBar: {
    height: 3,
    alignSelf: 'stretch',
    marginHorizontal: -16,
    marginBottom: 14,
    opacity: 0.85,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  categorySub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 15,
  },

  // ── Cuisine list ─────────────────────────────────────────────────
  cuisineList: {
    gap: 2,
  },
  cuisineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cuisineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cuisineEmojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1E1E20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cuisineEmoji: {
    fontSize: 18,
  },
  cuisineText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
  },
  cuisineChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1A1A1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
