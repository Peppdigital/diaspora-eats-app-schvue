
import React from "react";
import { Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function MapScreen() {
  const theme = useTheme();
  const isDark = theme.dark;

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Map",
          headerLargeTitle: true,
        }}
      />
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.content}>
          <IconSymbol
            ios_icon_name="map.fill"
            android_material_icon_name="map"
            size={64}
            color={colors.primary}
          />
          <Text style={[styles.title, { color: textColor }]}>
            Map View
          </Text>
          <Text style={[styles.message, { color: textSecondaryColor }]}>
            Note: react-native-maps is not supported in Natively at this time.
          </Text>
          <Text style={[styles.description, { color: textSecondaryColor }]}>
            The map feature will display nearby restaurants and grocery stores
            when you connect to a backend with location data.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
