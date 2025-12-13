
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useTheme } from '@react-navigation/native';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isDark = theme.dark;

  const bgColor = isDark ? colors.cardDark : colors.card;
  const activeColor = colors.primary;
  const inactiveColor = isDark ? colors.textSecondaryDark : colors.textSecondary;

  const isTabActive = (route: string) => {
    return pathname.startsWith(route);
  };

  const getIconName = (icon: string, isActive: boolean) => {
    const iconMap: { [key: string]: { ios: string; android: string } } = {
      home: { ios: isActive ? 'house.fill' : 'house', android: 'home' },
      search: { ios: isActive ? 'magnifyingglass' : 'magnifyingglass', android: 'search' },
      map: { ios: isActive ? 'map.fill' : 'map', android: 'map' },
      receipt: { ios: isActive ? 'bag.fill' : 'bag', android: 'shopping_bag' },
      person: { ios: isActive ? 'person.fill' : 'person', android: 'person' },
    };

    return iconMap[icon] || { ios: icon, android: icon };
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {tabs.map((tab, index) => {
        const isActive = isTabActive(tab.route);
        const iconNames = getIconName(tab.icon, isActive);
        
        return (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name={iconNames.ios}
                android_material_icon_name={iconNames.android}
                size={24}
                color={isActive ? activeColor : inactiveColor}
              />
              <Text
                style={[
                  styles.label,
                  { color: isActive ? activeColor : inactiveColor },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 24,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
