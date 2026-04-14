
import React from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const router = useRouter();

  // Explore + Events on the left, Orders + Profile on the right; Home is the FAB
  const tabs: TabBarItem[] = [
    {
      name: 'explore',
      route: '/(tabs)/explore',
      icon: 'search',
      label: 'Explore',
    },
    {
      name: 'events',
      route: '/(tabs)/events',
      icon: 'calendar',
      label: 'Events',
    },
    {
      name: 'orders',
      route: '/(tabs)/orders',
      icon: 'receipt',
      label: 'Orders',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="explore" name="explore" />
        <Stack.Screen key="events" name="events" />
        <Stack.Screen key="map" name="map" />
        <Stack.Screen key="cart" name="cart" />
        <Stack.Screen key="orders" name="orders" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar
        tabs={tabs}
        fabRoute="/(tabs)/(home)"
        onFabPress={() => router.push('/(tabs)/(home)/' as any)}
      />
    </>
  );
}
