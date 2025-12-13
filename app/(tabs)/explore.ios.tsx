
import React, { useState } from "react";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, TextInput } from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function ExploreScreen() {
  const theme = useTheme();
  const isDark = theme.dark;
  const [searchQuery, setSearchQuery] = useState("");

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const diasporaCategories = [
    { name: 'African American', emoji: '🍗', color: colors.primary },
    { name: 'Caribbean', emoji: '🌴', color: colors.secondary },
    { name: 'African', emoji: '🌍', color: colors.accent },
    { name: 'Pan-African', emoji: '✊🏿', color: colors.primary },
  ];

  const cuisineTypes = [
    'Soul Food', 'Jamaican', 'Nigerian', 'Ethiopian', 'Haitian',
    'Ghanaian', 'Trinidadian', 'Senegalese', 'Creole', 'Barbadian',
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Explore",
          headerLargeTitle: true,
        }}
      />
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: cardColor }]}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={textSecondaryColor}
            />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search by cuisine, location, or name..."
              placeholderTextColor={textSecondaryColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Browse by Diaspora */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Browse by Community
            </Text>
            <View style={styles.categoryGrid}>
              {diasporaCategories.map((category, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[styles.categoryCard, { backgroundColor: cardColor }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[styles.categoryName, { color: textColor }]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Browse by Cuisine */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Browse by Cuisine
            </Text>
            <View style={styles.cuisineList}>
              {cuisineTypes.map((cuisine, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[styles.cuisineItem, { backgroundColor: cardColor }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cuisineText, { color: textColor }]}>
                      {cuisine}
                    </Text>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={18}
                      color={textSecondaryColor}
                    />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    outlineStyle: 'none',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cuisineList: {
    gap: 10,
  },
  cuisineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  cuisineText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
