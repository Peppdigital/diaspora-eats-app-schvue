
import React from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function HomeScreen() {
  const theme = useTheme();
  const isDark = theme.dark;

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: textColor }]}>
            Jambalaya x Jerk x Jollof
          </Text>
          <Text style={[styles.tagline, { color: textSecondaryColor }]}>
            Discover & Support Black Diaspora Cuisine
          </Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={[styles.searchBar, { backgroundColor: cardColor }]}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={textSecondaryColor}
          />
          <Text style={[styles.searchPlaceholder, { color: textSecondaryColor }]}>
            Search restaurants, groceries, cuisines...
          </Text>
        </TouchableOpacity>

        {/* Quick Filters */}
        <View style={styles.filtersContainer}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Explore by Cuisine
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {[
              { label: 'Soul Food', emoji: '🍗' },
              { label: 'Caribbean', emoji: '🌴' },
              { label: 'Nigerian', emoji: '🍲' },
              { label: 'Ethiopian', emoji: '☕️' },
              { label: 'Jamaican', emoji: '🇯🇲' },
              { label: 'Haitian', emoji: '🇭🇹' },
            ].map((filter, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[styles.filterChip, { backgroundColor: cardColor }]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterEmoji}>{filter.emoji}</Text>
                  <Text style={[styles.filterLabel, { color: textColor }]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </ScrollView>
        </View>

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Featured Near You
          </Text>
          
          {/* Placeholder Cards */}
          {[1, 2, 3].map((item, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[styles.restaurantCard, { backgroundColor: cardColor }]}
                activeOpacity={0.7}
              >
                <View style={[styles.restaurantImage, { backgroundColor: colors.highlight }]}>
                  <Text style={styles.placeholderEmoji}>🍽️</Text>
                </View>
                <View style={styles.restaurantInfo}>
                  <Text style={[styles.restaurantName, { color: textColor }]}>
                    Restaurant Name
                  </Text>
                  <Text style={[styles.restaurantCuisine, { color: textSecondaryColor }]}>
                    Soul Food • Caribbean
                  </Text>
                  <View style={styles.restaurantMeta}>
                    <IconSymbol
                      ios_icon_name="star.fill"
                      android_material_icon_name="star"
                      size={14}
                      color={colors.accent}
                    />
                    <Text style={[styles.rating, { color: textSecondaryColor }]}>
                      4.8 • 2.3 mi
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Bottom Padding for Tab Bar */}
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
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 15,
  },
  filtersContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  filtersScroll: {
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.06)',
    elevation: 1,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuredSection: {
    marginBottom: 24,
  },
  restaurantCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 13,
    marginBottom: 6,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    marginLeft: 4,
  },
  bottomPadding: {
    height: 120,
  },
});
