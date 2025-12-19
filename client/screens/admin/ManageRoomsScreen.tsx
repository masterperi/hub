import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Modal, TextInput, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, getQueryFn } from "@/lib/query-client";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { FloatingBackground } from "@/components/FloatingBackground";
import { BrandedLoadingOverlay } from "@/components/BrandedLoadingOverlay";

const BLOCKS = ["A", "B", "C", "D"];

export default function ManageRoomsScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [selectedBlock, setSelectedBlock] = useState("A");

  const { data: rooms, isLoading } = useQuery({ queryKey: ['/rooms/block', selectedBlock], queryFn: getQueryFn({ on401: 'returnNull' }) });

  const allRooms = Array.isArray(rooms) ? rooms : [];
  const vacantRooms = allRooms.filter((r: any) => r.currentOccupancy < r.capacity);
  const fullRooms = allRooms.filter((r: any) => r.currentOccupancy >= r.capacity);
  const partialRooms = allRooms.filter((r: any) => r.currentOccupancy > 0 && r.currentOccupancy < r.capacity);

  const getRoomColor = (room: any) => {
    const occupancyRate = room.currentOccupancy / room.capacity;
    if (occupancyRate === 0) return Colors.status.success;
    if (occupancyRate < 1) return Colors.status.warning;
    return Colors.status.error;
  };

  return (
    <ThemedView style={styles.container}>
      <FloatingBackground primaryColor={Colors.secondary.main} secondaryColor={Colors.primary.main} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>

        {/* Block Selector */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.blockSelector}>
          {BLOCKS.map((block) => (
            <Pressable
              key={block}
              style={[
                styles.blockButton,
                { backgroundColor: selectedBlock === block ? '#3B82F6' : theme.backgroundSecondary } // Blue active, Dark inactive
              ]}
              onPress={() => setSelectedBlock(block)}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>Block {block}</ThemedText>
            </Pressable>
          ))}
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h2" style={{ color: Colors.status.success }}>{vacantRooms.length}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>Vacant</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h2" style={{ color: Colors.status.warning }}>{partialRooms.length}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>Partial</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h2" style={{ color: Colors.status.error }}>{fullRooms.length}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>Full</ThemedText>
          </View>
        </Animated.View>

        <ThemedText type="h3" style={styles.sectionTitle}>Rooms in Block {selectedBlock}</ThemedText>

        {allRooms.length > 0 ? (
          <View style={styles.roomGrid}>
            {allRooms.map((room: any, index: number) => (
              <View key={room._id || room.id || index} style={[styles.roomCard, { backgroundColor: theme.backgroundSecondary, borderColor: getRoomColor(room) }]}>
                <ThemedText type="h3" style={{ color: getRoomColor(room) }}>{room.roomNumber}</ThemedText>
                <View style={styles.occupancyRow}><Feather name="users" size={14} color={theme.textSecondary} /><ThemedText type="caption" secondary>{room.currentOccupancy}/{room.capacity}</ThemedText></View>
              </View>
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeInDown.delay(300)} style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="home" size={56} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>No rooms in Block {selectedBlock}</ThemedText>
          </Animated.View>
        )}

        {/* Legend */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.status.success }]} /><ThemedText type="caption" style={{ color: theme.textSecondary }}>Vacant</ThemedText></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.status.warning }]} /><ThemedText type="caption" style={{ color: theme.textSecondary }}>Partial</ThemedText></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.status.error }]} /><ThemedText type="caption" style={{ color: theme.textSecondary }}>Full</ThemedText></View>
        </Animated.View>

      </ScrollView>
      <BrandedLoadingOverlay visible={isLoading} message="Fetching room occupancy..." icon="home" color={Colors.secondary.main} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  blockSelector: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl },
  blockButton: { flex: 1, paddingVertical: 12, borderRadius: BorderRadius.sm, alignItems: "center" }, // Adjusted padding
  statsRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: { flex: 1, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, alignItems: "center", justifyContent: 'center' }, // Taller darker cards
  sectionTitle: { marginBottom: Spacing.md, fontWeight: '700' },
  roomGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  roomCard: { width: "23%", aspectRatio: 1, borderRadius: BorderRadius.sm, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  occupancyRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: Spacing.xs },
  emptyState: { paddingVertical: 60, borderRadius: BorderRadius.md, alignItems: "center", justifyContent: 'center' },
  legend: { flexDirection: "row", justifyContent: "center", gap: Spacing.xl, marginTop: Spacing.xxl },
  legendItem: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
});
