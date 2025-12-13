
import React from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.dark;
  const { user, isAuthenticated, signOut } = useAuth();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Profile
            </Text>
          </View>

          <View style={[styles.authPrompt, { backgroundColor: cardColor }]}>
            <IconSymbol
              ios_icon_name="person.circle"
              android_material_icon_name="account_circle"
              size={64}
              color={textSecondaryColor}
            />
            <Text style={[styles.authTitle, { color: textColor }]}>
              Sign in to continue
            </Text>
            <Text style={[styles.authText, { color: textSecondaryColor }]}>
              Create an account or sign in to access your profile and orders
            </Text>
            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/auth/customer-auth')}
              activeOpacity={0.7}
            >
              <Text style={styles.authButtonText}>Sign In / Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>
            Profile
          </Text>
        </View>

        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: cardColor }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: textColor }]}>
              {user.full_name}
            </Text>
            <Text style={[styles.userEmail, { color: textSecondaryColor }]}>
              {user.email}
            </Text>
            {user.default_location_city && user.default_location_state && (
              <View style={styles.locationRow}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location_on"
                  size={14}
                  color={textSecondaryColor}
                />
                <Text style={[styles.locationText, { color: textSecondaryColor }]}>
                  {user.default_location_city}, {user.default_location_state}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')}
          >
            <IconSymbol
              ios_icon_name="pencil"
              android_material_icon_name="edit"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Diaspora & Cuisines */}
        {(user.diaspora_segment.length > 0 || user.favorite_cuisines.length > 0) && (
          <View style={[styles.preferencesCard, { backgroundColor: cardColor }]}>
            {user.diaspora_segment.length > 0 && (
              <View style={styles.preferenceSection}>
                <Text style={[styles.preferenceLabel, { color: textSecondaryColor }]}>
                  Diaspora Segment
                </Text>
                <View style={styles.tagsRow}>
                  {user.diaspora_segment.map((segment, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.highlight }]}>
                      <Text style={[styles.tagText, { color: colors.secondary }]}>
                        {segment}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {user.favorite_cuisines.length > 0 && (
              <View style={styles.preferenceSection}>
                <Text style={[styles.preferenceLabel, { color: textSecondaryColor }]}>
                  Favorite Cuisines
                </Text>
                <View style={styles.tagsRow}>
                  {user.favorite_cuisines.map((cuisine, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.highlight }]}>
                      <Text style={[styles.tagText, { color: colors.secondary }]}>
                        {cuisine}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {user.role === 'admin' && (
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: cardColor, borderWidth: 2, borderColor: colors.primary }]}
              onPress={() => router.push('/admin-vendors')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol
                  ios_icon_name="shield.fill"
                  android_material_icon_name="admin_panel_settings"
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.menuItemText, { color: colors.primary }]}>
                  Admin Panel
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/favorites')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Saved/Favorite Spots
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={18}
              color={textSecondaryColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/manage-addresses')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location_on"
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Manage Addresses
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={18}
              color={textSecondaryColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Edit Profile
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={18}
              color={textSecondaryColor}
            />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: cardColor }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="arrow.right.square"
            android_material_icon_name="logout"
            size={22}
            color="#FF3B30"
          />
          <Text style={[styles.signOutText, { color: '#FF3B30' }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: textSecondaryColor }]}>
            Jambalaya x Jerk x Jollof
          </Text>
          <Text style={[styles.appInfoText, { color: textSecondaryColor }]}>
            Version 1.0.0
          </Text>
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
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  userCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  preferencesCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  preferenceSection: {
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  authPrompt: {
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  authText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  authButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  menuSection: {
    gap: 10,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  appInfo: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  appInfoText: {
    fontSize: 12,
  },
  bottomPadding: {
    height: 120,
  },
});
