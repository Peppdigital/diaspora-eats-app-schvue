import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { IconSymbol } from './IconSymbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  /** How many left-side tabs before the FAB slot. Defaults to floor(tabs.length/2). */
  fabIndex?: number;
  onFabPress?: () => void;
  /** Route the FAB represents — used to determine its active state. */
  fabRoute?: string;
}

const { width: W } = Dimensions.get('window');
const BAR_HEIGHT = 64;
const FAB_SIZE = 58;
const WAVE_WIDTH = 96;   // total width of the dip
const WAVE_DEPTH = 32;   // depth of the dip
const FAB_LIFT = 20;     // how far FAB rises above the bar top
const BOTTOM_INSET = Platform.OS === 'ios' ? 22 : 0;

// ─── Wave SVG path ──────────────────────────────────────────────────────────
function buildWavePath(w: number, h: number): string {
  const cx = w / 2;
  const hw = WAVE_WIDTH / 2;
  const d  = WAVE_DEPTH;
  const cp = 26; // bezier horizontal control offset

  return [
    `M 0 0`,
    `L ${cx - hw} 0`,
    `C ${cx - hw + cp} 0, ${cx - cp} ${d}, ${cx} ${d}`,
    `C ${cx + cp} ${d}, ${cx + hw - cp} 0, ${cx + hw} 0`,
    `L ${w} 0`,
    `L ${w} ${h}`,
    `L 0 ${h}`,
    `Z`,
  ].join(' ');
}

// ─── Icon map ───────────────────────────────────────────────────────────────
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

const ICON_MAP: Record<string, { iosFill: string; iosOutline: string; android: MaterialIconName }> = {
  home:     { iosFill: 'house.fill',      iosOutline: 'house',          android: 'home' },
  search:   { iosFill: 'magnifyingglass', iosOutline: 'magnifyingglass',android: 'search' },
  calendar: { iosFill: 'calendar',        iosOutline: 'calendar',       android: 'event' },
  map:      { iosFill: 'map.fill',        iosOutline: 'map',            android: 'map' },
  receipt:  { iosFill: 'bag.fill',        iosOutline: 'bag',            android: 'shopping-bag' },
  orders:   { iosFill: 'list.bullet',     iosOutline: 'list.bullet',    android: 'receipt-long' },
  person:   { iosFill: 'person.fill',     iosOutline: 'person',         android: 'person' },
};

// ─── Tab Item ────────────────────────────────────────────────────────────────
interface TabItemProps {
  tab: TabBarItem;
  isActive: boolean;
  onPress: () => void;
}

function TabItem({ tab, isActive, onPress }: TabItemProps) {
  const scale     = useSharedValue(1);
  const dotScale  = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    dotScale.value = withSpring(isActive ? 1 : 0, { damping: 16, stiffness: 200 });
  }, [isActive]);

  const containerAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const dotAnim = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  const entry = ICON_MAP[tab.icon] ?? {
    iosFill: tab.icon, iosOutline: tab.icon, android: tab.icon as MaterialIconName,
  };

  const activeColor   = colors.primary;
  const inactiveColor = colors.textSecondary;

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.82, { damping: 12, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 14, stiffness: 200 }); }}
    >
      <Animated.View style={[styles.tabInner, containerAnim]}>
        <IconSymbol
          ios_icon_name={isActive ? entry.iosFill : entry.iosOutline}
          android_material_icon_name={entry.android}
          size={24}
          color={isActive ? activeColor : inactiveColor}
        />
        <Text style={[styles.label, { color: isActive ? activeColor : inactiveColor }]}>
          {tab.label}
        </Text>
        <Animated.View style={[styles.activeDot, { backgroundColor: activeColor }, dotAnim]} />
      </Animated.View>
    </Pressable>
  );
}

// ─── FAB Button ─────────────────────────────────────────────────────────────
function FabButton({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) {
  const scale = useSharedValue(1);

  const fabAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 12, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1,   { damping: 10, stiffness: 200 }); }}
    >
      <Animated.View style={[styles.fabOuter, fabAnim]}>
        {/* Gradient circle via SVG */}
        <Svg
          width={FAB_SIZE}
          height={FAB_SIZE}
          viewBox={`0 0 ${FAB_SIZE} ${FAB_SIZE}`}
          style={StyleSheet.absoluteFillObject}
        >
          <Defs>
            <LinearGradient id="fg" x1="0.2" y1="0" x2="0.8" y2="1">
              <Stop offset="0%"   stopColor="#F5D67A" />
              <Stop offset="45%"  stopColor="#D4AF37" />
              <Stop offset="100%" stopColor="#9C7C1A" />
            </LinearGradient>
            {/* Top gloss sheen */}
            <LinearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"  stopColor="rgba(255,255,255,0.32)" />
              <Stop offset="60%" stopColor="rgba(255,255,255,0)" />
            </LinearGradient>
          </Defs>
          {/* Base circle */}
          <Path
            d={`M ${FAB_SIZE / 2},2 a ${FAB_SIZE / 2 - 2} ${FAB_SIZE / 2 - 2} 0 1 1 0,${FAB_SIZE - 4} a ${FAB_SIZE / 2 - 2} ${FAB_SIZE / 2 - 2} 0 1 1 0,-${FAB_SIZE - 4}`}
            fill="url(#fg)"
          />
          {/* Gloss top half */}
          <Path
            d={`M 2,${FAB_SIZE / 2} a ${FAB_SIZE / 2 - 2} ${FAB_SIZE / 2 - 2} 0 0 1 ${FAB_SIZE - 4},0 Z`}
            fill="url(#gl)"
          />
        </Svg>

        {/* House icon */}
        <View style={styles.fabIconContainer} pointerEvents="none">
          <IconSymbol
            ios_icon_name={isActive ? 'house.fill' : 'house'}
            android_material_icon_name="home"
            size={26}
            color={isActive ? '#0D0D0D' : 'rgba(13,13,13,0.65)'}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FloatingTabBar({ tabs, fabIndex, onFabPress, fabRoute }: FloatingTabBarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const isTabActive = (route: string) => pathname.startsWith(route);

  const mid        = fabIndex ?? Math.floor(tabs.length / 2);
  const leftTabs   = tabs.slice(0, mid);
  const rightTabs  = tabs.slice(mid);

  // Entrance animation
  const slideY = useSharedValue(80);
  useEffect(() => {
    slideY.value = withSpring(0, { damping: 18, stiffness: 150 });
  }, []);
  const rootAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const wavePath = buildWavePath(W, BAR_HEIGHT + 20);

  return (
    <Animated.View style={[styles.root, rootAnim]}>

      {/* ── SVG wave bar ── */}
      <Svg
        width={W}
        height={BAR_HEIGHT + 20}
        style={styles.svgBar}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="barTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#1A1A1A" />
            <Stop offset="100%" stopColor="#0D0D0D" />
          </LinearGradient>
        </Defs>
        <Path d={wavePath} fill="url(#barTop)" />
      </Svg>

      {/* Top highlight line (flat section only, wave portion excluded via overflow) */}
      <View style={styles.topHighlight} pointerEvents="none" />

      {/* ── Tab row ── */}
      <View style={styles.tabRow}>
        <View style={styles.tabGroup}>
          {leftTabs.map((tab) => (
            <TabItem
              key={tab.route}
              tab={tab}
              isActive={isTabActive(tab.route)}
              onPress={() => router.push(tab.route as any)}
            />
          ))}
        </View>

        {/* Center spacer for FAB */}
        <View style={styles.fabSpacer} />

        <View style={styles.tabGroup}>
          {rightTabs.map((tab) => (
            <TabItem
              key={tab.route}
              tab={tab}
              isActive={isTabActive(tab.route)}
              onPress={() => router.push(tab.route as any)}
            />
          ))}
        </View>
      </View>

      {/* ── Raised FAB ── */}
      <View style={styles.fabContainer}>
        <FabButton onPress={onFabPress} isActive={fabRoute ? isTabActive(fabRoute) : false} />
      </View>

    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_HEIGHT + BOTTOM_INSET + 20,
  },
  svgBar: {
    position: 'absolute',
    bottom: BOTTOM_INSET,
    left: 0,
  },
  topHighlight: {
    position: 'absolute',
    bottom: BOTTOM_INSET + BAR_HEIGHT + 19,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.18)',
  },
  tabRow: {
    position: 'absolute',
    bottom: BOTTOM_INSET,
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  fabSpacer: {
    width: WAVE_WIDTH + 8,
  },
  tab: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: BOTTOM_INSET + BAR_HEIGHT - FAB_SIZE / 2 - FAB_LIFT + 10,
    left: W / 2 - FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
  },
  fabOuter: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'visible',
  },
  fabIconContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});