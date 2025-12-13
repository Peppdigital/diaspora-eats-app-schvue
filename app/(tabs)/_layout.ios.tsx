
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="explore" name="explore">
        <Icon sf="magnifyingglass" />
        <Label>Explore</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="map" name="map">
        <Icon sf="map.fill" />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="orders" name="orders">
        <Icon sf="bag.fill" />
        <Label>Orders</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
