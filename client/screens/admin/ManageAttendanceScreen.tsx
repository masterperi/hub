import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, FlatList } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

export default function ManageAttendanceScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = selectedDate.toISOString().split('T')[0];

  const { data: attendanceData, isLoading } = useQuery({ queryKey: ['/attendance/date', dateString] });

  const getDates = () => {
    const dates = [];
    for (let i = -7; i <= 0; i++) { const date = new Date(); date.setDate(date.getDate() + i); dates.push(date); }
    return dates;
  };

  const formatDate = (date: Date) => ({ day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()], date: date.getDate(), isToday: date.toDateString() === new Date().toDateString() });

  const attendances = attendanceData as any[] || [];
  const presentCount = attendances.filter((a) => a.isPresent).length;
  const absentCount = attendances.filter((a) => !a.isPresent).length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <FlatList horizontal data={getDates()} keyExtractor={(item) => item.toISOString()} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroller}
          renderItem={({ item }) => {
            const { day, date, isToday } = formatDate(item);
            const isSelected = item.toDateString() === selectedDate.toDateString();
            return (
              <Pressable style={[styles.dateItem, { backgroundColor: isSelected ? Colors.primary.main : theme.backgroundDefault }]} onPress={() => setSelectedDate(item)}>
                <ThemedText type="caption" style={{ color: isSelected ? "#FFFFFF" : theme.textSecondary }}>{day}</ThemedText>
                <ThemedText type="h3" style={{ color: isSelected ? "#FFFFFF" : theme.text }}>{date}</ThemedText>
                {isToday ? <View style={[styles.todayDot, { backgroundColor: isSelected ? "#FFFFFF" : Colors.primary.main }]} /> : null}
              </Pressable>
            );
          }}
        />

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.status.success + "15" }]}>
            <ThemedText type="h2" style={{ color: Colors.status.success }}>{presentCount}</ThemedText>
            <ThemedText type="caption" secondary>Present</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.status.error + "15" }]}>
            <ThemedText type="h2" style={{ color: Colors.status.error }}>{absentCount}</ThemedText>
            <ThemedText type="caption" secondary>Absent</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.primary.light + "15" }]}>
            <ThemedText type="h2" style={{ color: Colors.primary.main }}>{attendances.length}</ThemedText>
            <ThemedText type="caption" secondary>Total</ThemedText>
          </View>
        </View>

        <ThemedText type="h3" style={styles.sectionTitle}>Attendance Records</ThemedText>

        {attendances.length > 0 ? attendances.map((record: any) => (
          <View key={record.id} style={[styles.recordCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.statusIndicator, { backgroundColor: record.isPresent ? Colors.status.success : Colors.status.error }]} />
            <View style={styles.recordInfo}>
              <ThemedText type="body" style={styles.recordName}>{record.userId?.name || "Unknown Student"}</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ThemedText type="caption" secondary>ID: {record.userId?.registerId || "N/A"}</ThemedText>
                <ThemedText type="caption" secondary> • </ThemedText>
                <ThemedText type="caption" secondary>{new Date(record.markedAt).toLocaleTimeString()}</ThemedText>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: record.isPresent ? Colors.status.success : Colors.status.error }]}>
              <ThemedText type="caption" style={{ color: "#FFFFFF" }}>{record.isPresent ? "Present" : "Absent"}</ThemedText>
            </View>
          </View>
        )) : (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="calendar" size={48} color={theme.textSecondary} />
            <ThemedText type="body" secondary style={styles.emptyText}>No attendance records for this date</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  dateScroller: { paddingBottom: Spacing.lg, gap: Spacing.sm },
  dateItem: { width: 56, height: 80, borderRadius: BorderRadius.sm, alignItems: "center", justifyContent: "center", ...Shadows.card },
  todayDot: { width: 6, height: 6, borderRadius: 3, marginTop: Spacing.xs },
  statsRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: { flex: 1, padding: Spacing.lg, borderRadius: BorderRadius.sm, alignItems: "center" },
  sectionTitle: { marginBottom: Spacing.lg },
  recordCard: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm, ...Shadows.card },
  statusIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: Spacing.md },
  recordInfo: { flex: 1 },
  recordName: { fontWeight: "500", marginBottom: Spacing.xs },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  emptyState: { padding: Spacing.xxl, borderRadius: BorderRadius.sm, alignItems: "center" },
  emptyText: { marginTop: Spacing.md },
});
