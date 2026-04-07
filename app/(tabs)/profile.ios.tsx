
import React from "react";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileScreen() {
  const theme = useTheme();
  const isDark = theme.dark;
  const { user, isAuthenticated, signOut } = useAuth();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;

  const menuItems = [
    { icon: 'heart', label: 'Favorites', route: '/favorites' },
    { icon: 'location', label: 'Addresses', route: '/addresses' },
    { icon: 'creditcard', label: 'Payment Methods', route: '/payment' },
    { icon: 'bell', label: 'Notifications', route: '/notifications' },
    { icon: 'gear', label: 'Settings', route: '/settings' },
    { icon: 'questionmark.circle', label: 'Help & Support', route: '/support' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Profile",
          headerLargeTitle: true,
        }}
      />
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* User Info Card */}
          {isAuthenticated && user ? (
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
                      android_material_icon_name="location-on"
                      size={14}
                      color={textSecondaryColor}
                    />
                    <Text style={[styles.locationText, { color: textSecondaryColor }]}>
                      {user.default_location_city}, {user.default_location_state}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={[styles.authPrompt, { backgroundColor: cardColor }]}>
              <Text style={[styles.authTitle, { color: textColor }]}>
                Sign in to continue
              </Text>
              <Text style={[styles.authText, { color: textSecondaryColor }]}>
                Create an account or sign in to access your profile and orders
              </Text>
              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.7}
              >
                <Text style={styles.authButtonText}>Sign In / Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: cardColor }]}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <IconSymbol
                      ios_icon_name={item.icon}
                      android_material_icon_name={item.icon.replace('.', '-')}
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={[styles.menuItemText, { color: textColor }]}>
                      {item.label}
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={18}
                    color={textSecondaryColor}
                  />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>

          {/* Sign Out Button */}
          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: cardColor }]}
              onPress={signOut}
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
          )}

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={[styles.appInfoText, { color: textSecondaryColor }]}>
              Jambalaya x Jerk x Jollof
            </Text>
            <Text style={[styles.appInfoText, { color: textSecondaryColor }]}>
              Version 1.0.0
            </Text>
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
  userCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
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
  authPrompt: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    height: 40,
  },
});
