import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Modal, TextInput, Alert, FlatList } from "react-native";
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

type ComplaintCategory = "water" | "electricity" | "cleaning" | "food" | "others";
type ComplaintStatus = "submitted" | "in_progress" | "resolved";

const CATEGORY_ICONS: Record<ComplaintCategory, keyof typeof Feather.glyphMap> = { water: "droplet", electricity: "zap", cleaning: "trash-2", food: "coffee", others: "more-horizontal" };

const CATEGORY_COLORS: Record<ComplaintCategory, string> = {
  water: "#3B82F6", // Blue
  electricity: "#F59E0B", // Amber
  cleaning: "#8B5CF6", // Violet
  food: "#EF4444", // Red
  others: "#6B7280", // Gray
};

const STATUS_COLORS: Record<ComplaintStatus, string> = { submitted: Colors.status.info, in_progress: Colors.status.warning, resolved: Colors.status.success };

export default function ComplaintManagementScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | "all">("all");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("submitted");
  const [adminRemarks, setAdminRemarks] = useState("");

  const { data: complaints, isLoading } = useQuery({ queryKey: ['/complaints'], queryFn: getQueryFn({ on401: 'returnNull' }) });

  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, status, remarks }: { id: string; status: string; remarks?: string }) => {
      const response = await apiRequest("PATCH", `/complaints/${id}/status`, { status, adminRemarks: remarks });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/complaints'] });
      queryClient.invalidateQueries({ queryKey: ['/stats/admin'] });
      setShowModal(false);
      setSelectedComplaint(null);
      setAdminRemarks("");
      Alert.alert("Success", "Complaint updated!");
    },
    onError: () => Alert.alert("Error", "Failed to update complaint"),
  });

  const filteredComplaints = React.useMemo(() => {
    const all = complaints as any[];
    if (!all) return [];
    if (selectedStatus === "all") return all;
    return all.filter((c) => c.status === selectedStatus);
  }, [complaints, selectedStatus]);

  const handleUpdate = () => {
    if (!selectedComplaint) return;
    updateComplaintMutation.mutate({ id: selectedComplaint.id || selectedComplaint._id, status: newStatus, remarks: adminRemarks });
  };

  const statuses: (ComplaintStatus | "all")[] = ["all", "submitted", "in_progress", "resolved"];

  return (
    <ThemedView style={styles.container}>
      <FloatingBackground primaryColor={Colors.secondary.main} secondaryColor={Colors.primary.main} />
      <Animated.View entering={FadeInDown.delay(100)} style={[styles.filterContainer, { paddingTop: headerHeight + Spacing.lg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {statuses.map((status) => (
            <Pressable key={status} style={[styles.filterChip, { backgroundColor: selectedStatus === status ? Colors.primary.main : theme.backgroundDefault, borderColor: selectedStatus === status ? Colors.primary.main : theme.border }]} onPress={() => setSelectedStatus(status)}>
              <ThemedText type="bodySmall" style={{ color: selectedStatus === status ? "#FFFFFF" : theme.text, fontWeight: "500" }}>{status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      <FlatList data={filteredComplaints} keyExtractor={(item) => item.id || item._id} contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Animated.View entering={FadeInDown.delay(200)} style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="check-circle" size={48} color={theme.textSecondary} />
            <ThemedText type="body" secondary style={styles.emptyText}>No complaints found</ThemedText>
          </Animated.View>
        )}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(200 + index * 50)}>
            <Pressable style={[styles.complaintCard, { backgroundColor: theme.backgroundDefault }]} onPress={() => { setSelectedComplaint(item); setNewStatus(item.status); setAdminRemarks(item.adminRemarks || ""); setShowModal(true); }}>
              <View style={styles.cardHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: CATEGORY_COLORS[item.category as ComplaintCategory] + "20" }]}>
                  <Feather name={CATEGORY_ICONS[item.category as ComplaintCategory]} size={20} color={CATEGORY_COLORS[item.category as ComplaintCategory]} />
                </View>
                <View style={styles.cardInfo}><ThemedText type="body" style={styles.categoryText}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</ThemedText><ThemedText type="caption" secondary>{item.isAnonymous ? "Anonymous" : `ID: ${typeof item.userId === 'string' ? item.userId.slice(0, 8) : (item.userId?.registerId || 'Unknown')}...`}</ThemedText></View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status as ComplaintStatus] }]}><ThemedText type="caption" style={{ color: "#FFFFFF", fontSize: 10 }}>{item.status === "in_progress" ? "In Progress" : item.status}</ThemedText></View>
              </View>
              <ThemedText type="bodySmall" secondary numberOfLines={2}>{item.description}</ThemedText>
            </Pressable>
          </Animated.View>
        )}
      />

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}><ThemedText type="h3">Complaint Details</ThemedText><Pressable onPress={() => setShowModal(false)}><Feather name="x" size={24} color={theme.text} /></Pressable></View>
            {selectedComplaint && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <View style={styles.detailRow}><ThemedText type="bodySmall" secondary>Category</ThemedText><View style={styles.categoryRow}><Feather name={CATEGORY_ICONS[selectedComplaint.category as ComplaintCategory]} size={18} color={CATEGORY_COLORS[selectedComplaint.category as ComplaintCategory]} /><ThemedText type="body">{selectedComplaint.category}</ThemedText></View></View>
                <View style={styles.detailRow}><ThemedText type="bodySmall" secondary>Description</ThemedText><ThemedText type="body">{selectedComplaint.description}</ThemedText></View>
                <View style={styles.detailRow}><ThemedText type="bodySmall" secondary>Submitted By</ThemedText><ThemedText type="body">{selectedComplaint.isAnonymous ? "Anonymous" : `Student ID: ${typeof selectedComplaint.userId === 'string' ? selectedComplaint.userId.slice(0, 8) : (selectedComplaint.userId?.registerId || 'Unknown')}...`}</ThemedText></View>

                {selectedComplaint.photoUrl && (
                  <View style={styles.detailRow}>
                    <ThemedText type="bodySmall" secondary>Attachment</ThemedText>
                    <Pressable
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, backgroundColor: Colors.primary.main + '10', borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.primary.main + '30' }}
                      onPress={() => Alert.alert("Attachment Link", selectedComplaint.photoUrl)}
                    >
                      <Feather name="link" size={16} color={Colors.primary.main} />
                      <ThemedText type="bodySmall" style={{ color: Colors.primary.main, fontWeight: '600' }}>View Image Link</ThemedText>
                    </Pressable>
                  </View>
                )}

                <ThemedText type="bodySmall" secondary style={styles.label}>Update Status</ThemedText>
                <View style={styles.statusOptions}>
                  {(["submitted", "in_progress", "resolved"] as ComplaintStatus[]).map((status) => (
                    <Pressable key={status} style={[styles.statusOption, { backgroundColor: newStatus === status ? STATUS_COLORS[status] : theme.backgroundDefault, borderColor: STATUS_COLORS[status] }]} onPress={() => setNewStatus(status)}>
                      <ThemedText type="caption" style={{ color: newStatus === status ? "#FFFFFF" : STATUS_COLORS[status] }}>{status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}</ThemedText>
                    </Pressable>
                  ))}
                </View>
                <ThemedText type="bodySmall" secondary style={styles.label}>Admin Remarks</ThemedText>
                <TextInput style={[styles.textArea, { backgroundColor: theme.backgroundDefault, color: theme.text }]} placeholder="Add remarks for the student..." placeholderTextColor={theme.textSecondary} value={adminRemarks} onChangeText={setAdminRemarks} multiline numberOfLines={3} />
                <Button onPress={handleUpdate} loading={updateComplaintMutation.isPending} fullWidth>Update Complaint</Button>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <BrandedLoadingOverlay visible={isLoading} message="Fetching complaints..." icon="alert-circle" color={Colors.secondary.main} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterContainer: { paddingHorizontal: Spacing.lg },
  filterScroll: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  listContent: { paddingHorizontal: Spacing.lg },
  complaintCard: { padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.md, ...Shadows.card },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm },
  categoryIcon: { width: 40, height: 40, borderRadius: BorderRadius.sm, justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1, marginLeft: Spacing.md },
  categoryText: { fontWeight: "600" },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  emptyState: { padding: Spacing.xxl, borderRadius: BorderRadius.md, alignItems: "center", marginTop: Spacing.xl },
  emptyText: { marginTop: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
  modalContent: { maxHeight: "85%", borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, ...Shadows.modal },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  modalBody: { padding: Spacing.xl, gap: Spacing.lg },
  detailRow: { gap: Spacing.xs },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  label: { marginTop: Spacing.md },
  statusOptions: { flexDirection: "row", gap: Spacing.sm },
  statusOption: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, alignItems: "center" },
  textArea: { height: 80, borderRadius: BorderRadius.md, padding: Spacing.md, textAlignVertical: "top", fontSize: 16 },
});
