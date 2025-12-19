import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert, Linking, Modal, TextInput, Keyboard } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { FloatingBackground } from "@/components/FloatingBackground";
import { apiRequest } from "@/lib/query-client";
import { BrandedLoadingOverlay } from "@/components/BrandedLoadingOverlay";

interface Roommate {
    _id: string;
    name: string;
    registerId: string;
    phone?: string;
}

interface RoomChangeRequest {
    _id: string;
    status: "pending" | "approved" | "rejected";
    requestedRoom?: string;
    reason: string;
    adminRemarks?: string;
    createdAt: string;
}

export default function RoomDetailsScreen() {
    const headerHeight = useHeaderHeight();
    const tabBarHeight = useBottomTabBarHeight();
    const { user } = useAuth();
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [changeReason, setChangeReason] = useState("");
    const [requestedRoom, setRequestedRoom] = useState("");
    const [roomSearchTerm, setRoomSearchTerm] = useState("");

    // Debounced room search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRoomSearchTerm(requestedRoom);
        }, 500);
        return () => clearTimeout(timer);
    }, [requestedRoom]);

    const { data: room, isLoading: isRoomLoading } = useQuery({
        queryKey: ["/api/rooms", user?.roomNumber, user?.hostelBlock],
        enabled: !!user?.roomNumber
    });
    const { data: roommates } = useQuery<Roommate[]>({
        queryKey: ["/api/users", "roommates", user?.roomNumber, user?.hostelBlock],
        enabled: !!user?.roomNumber
    });
    const { data: requests, isLoading: isRequestsLoading } = useQuery<RoomChangeRequest[]>({
        queryKey: ["/api/room-change-requests/user", user?.id || (user as any)?._id],
        enabled: !!user
    });

    // Check availability of requested room
    const { data: targetRoom, isFetching: isCheckingRoom } = useQuery({
        queryKey: ["/api/rooms", roomSearchTerm, user?.hostelBlock],
        enabled: roomSearchTerm.length > 0 && showChangeModal,
        retry: false
    });

    const roomData = room as any;
    const roommateList = (roommates || []).filter((r: any) => r._id !== user?.id);
    const pendingRequest = requests?.find(r => r.status === "pending");

    const targetRoomData = targetRoom as any;
    const isTargetFull = targetRoomData && targetRoomData.currentOccupancy >= targetRoomData.capacity;
    const isTargetValid = !!targetRoomData;

    const roomChangeMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/room-change-requests", data);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit request");
            }
            return res.json();
        },
        onSuccess: () => {
            setShowChangeModal(false);
            setChangeReason("");
            setRequestedRoom("");
            Keyboard.dismiss();
            queryClient.invalidateQueries({ queryKey: ["/api/room-change-requests/user"] });
            Alert.alert("Success", "Room change request submitted to admin");
        },
        onError: (error: Error) => {
            Alert.alert("Error", error.message);
        }
    });

    const handleRequestRoomChange = () => {
        if (pendingRequest) {
            Alert.alert("Request Pending", "You already have a pending room change request. Please wait for admin approval.");
            return;
        }
        if (!user?.roomNumber || !user?.hostelBlock) {
            Alert.alert("Error", "User details missing");
            return;
        }
        setShowChangeModal(true);
    };

    const submitRoomChange = () => {
        if (!changeReason.trim()) {
            Alert.alert("Error", "Please provide a reason");
            return;
        }
        if (requestedRoom.trim() && isTargetFull) {
            Alert.alert("Room Full", "The room you requested is already full. Please pick another one or leave it empty for a general request.");
            return;
        }
        if (!user) return;
        roomChangeMutation.mutate({
            userId: user.id || (user as any)._id,
            currentRoom: user.roomNumber,
            requestedRoom: requestedRoom.trim() || undefined,
            hostelBlock: user.hostelBlock,
            reason: changeReason.trim()
        });
    };

    const isLoading = isRoomLoading || isRequestsLoading;

    return (
        <ThemedView style={styles.container}>
            <FloatingBackground primaryColor={Colors.primary.main} secondaryColor={Colors.secondary.main} />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl }]} showsVerticalScrollIndicator={false}>
                {roomData && roomData.currentOccupancy >= roomData.capacity && (
                    <View style={styles.fullBanner}><Feather name="alert-circle" size={18} color="#FFF" /><ThemedText style={{ color: "#FFF", fontWeight: "bold", marginLeft: 8 }}>ROOM IS FULL</ThemedText></View>
                )}
                <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.primary.main + "20" }]}><Feather name="home" size={24} color={Colors.primary.main} /></View>
                        <View style={styles.cardHeaderText}><ThemedText type="h3">Room {user?.roomNumber || "N/A"}</ThemedText><ThemedText type="body" secondary>Block {user?.hostelBlock || "N/A"}</ThemedText></View>
                    </View>
                    <View style={styles.divider} />
                    {roomData && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}><Feather name="users" size={20} color={theme.textSecondary} /><View style={styles.infoText}><ThemedText type="caption" secondary>Capacity</ThemedText><ThemedText type="body">{roomData.capacity} Students</ThemedText></View></View>
                            <View style={styles.infoItem}><Feather name="user-check" size={20} color={theme.textSecondary} /><View style={styles.infoText}><ThemedText type="caption" secondary>Occupied</ThemedText><ThemedText type="body">{roomData.currentOccupancy} Students</ThemedText></View></View>
                            <View style={[styles.statusBadge, { backgroundColor: roomData.currentOccupancy < roomData.capacity ? Colors.status.success + "20" : Colors.status.error + "20" }]}><ThemedText type="caption" style={{ color: roomData.currentOccupancy < roomData.capacity ? Colors.status.success : Colors.status.error }}>{roomData.currentOccupancy < roomData.capacity ? `${roomData.capacity - roomData.currentOccupancy} Vacant Bed(s)` : "Fully Occupied"}</ThemedText></View>
                        </View>
                    )}
                </View>

                {(requests || []).length > 0 && (
                    <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
                        <ThemedText type="bodySmall" style={{ fontWeight: "bold", color: theme.textSecondary, marginBottom: Spacing.sm }}>
                            RECENT REQUESTS
                        </ThemedText>
                        {(requests || []).slice(0, 3).map((req, idx) => (
                            <View key={req._id} style={{ marginBottom: idx === 2 ? 0 : Spacing.md }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: req.status === 'approved' ? Colors.status.success : req.status === 'rejected' ? Colors.status.error : Colors.status.warning }} />
                                        <ThemedText type="body" style={{ fontWeight: '600' }}>
                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                        </ThemedText>
                                    </View>
                                    <ThemedText type="caption" secondary>{new Date(req.createdAt).toLocaleDateString()}</ThemedText>
                                </View>
                                {req.requestedRoom && (
                                    <ThemedText type="caption" style={{ color: Colors.primary.main, marginTop: 2 }}>
                                        Requested Room: {req.requestedRoom}
                                    </ThemedText>
                                )}
                                <ThemedText type="bodySmall" secondary style={{ marginTop: 4 }}>Reason: {req.reason}</ThemedText>
                                {req.adminRemarks && (
                                    <View style={{ marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: theme.backgroundSecondary, borderRadius: BorderRadius.xs }}>
                                        <ThemedText type="caption" style={{ fontWeight: '700' }}>Admin Reply:</ThemedText>
                                        <ThemedText type="caption" secondary>{req.adminRemarks}</ThemedText>
                                    </View>
                                )}
                                {idx < (requests || []).length - 1 && idx < 2 && <View style={{ height: 1, backgroundColor: theme.border, marginTop: Spacing.md }} />}
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.sectionHeader}><ThemedText type="h3">Roommates</ThemedText><View style={[styles.badge, { backgroundColor: Colors.primary.main }]}><ThemedText type="caption" style={{ color: "#FFFFFF" }}>{roommateList.length}</ThemedText></View></View>
                {roommateList.length > 0 ? roommateList.map((roommate: Roommate, index: number) => (
                    <View key={roommate._id} style={[styles.roommateCard, { backgroundColor: theme.backgroundDefault }, index === roommateList.length - 1 && styles.lastCard]}>
                        <View style={[styles.avatar, { backgroundColor: Colors.primary.main + "20" }]}><ThemedText type="h3" style={{ color: Colors.primary.main }}>{roommate.name.charAt(0).toUpperCase()}</ThemedText></View>
                        <View style={styles.roommateInfo}><ThemedText type="body" style={{ fontWeight: "600" }}>{roommate.name}</ThemedText><ThemedText type="bodySmall" secondary>{roommate.registerId}</ThemedText>{roommate.phone ? <View style={styles.phoneRow}><Feather name="phone" size={14} color={theme.textSecondary} /><ThemedText type="caption" secondary style={{ marginLeft: Spacing.xs }}>{roommate.phone}</ThemedText></View> : null}</View>
                        <Pressable style={[styles.contactButton, { backgroundColor: Colors.primary.main + "10" }]} onPress={() => { if (roommate.phone) { Linking.openURL(`tel:${roommate.phone}`); } else { Alert.alert("Error", "Phone number not available"); } }}><Feather name="phone" size={18} color={Colors.primary.main} /></Pressable>
                    </View>
                )) : (
                    <View style={[styles.emptyCard, { backgroundColor: theme.backgroundDefault }]}><Feather name="users" size={48} color={theme.textSecondary} /><ThemedText type="body" secondary style={{ marginTop: Spacing.md }}>No roommates yet</ThemedText><ThemedText type="caption" secondary style={{ textAlign: "center" }}>You"ll see your roommates here once they register</ThemedText></View>
                )}

                <ThemedText type="h3" style={styles.sectionTitle}>Room Facilities</ThemedText>
                <View style={[styles.facilitiesCard, { backgroundColor: theme.backgroundDefault }]}>
                    {[{ icon: "wifi", label: "WiFi" }, { icon: "monitor", label: "Study Table" }, { icon: "zap", label: "Power Backup" }, { icon: "droplet", label: "Water Cooler" }, { icon: "wind", label: "Fan" }, { icon: "package", label: "Storage" }].map((facility, index) => (
                        <View key={index} style={styles.facilityItem}><View style={[styles.facilityIcon, { backgroundColor: Colors.primary.main + "10" }]}><Feather name={facility.icon as any} size={20} color={Colors.primary.main} /></View><ThemedText type="caption" secondary>{facility.label}</ThemedText></View>
                    ))}
                </View>

                <Pressable
                    style={[styles.changeButton, { backgroundColor: theme.backgroundDefault, opacity: pendingRequest ? 0.6 : 1 }]}
                    onPress={handleRequestRoomChange}
                >
                    <Feather name={pendingRequest ? "clock" : "refresh-cw"} size={20} color={pendingRequest ? theme.textSecondary : Colors.primary.main} />
                    <ThemedText type="body" style={{ color: pendingRequest ? theme.textSecondary : Colors.primary.main, marginLeft: Spacing.sm }}>
                        {pendingRequest ? "Request Pending" : "Request Room Change"}
                    </ThemedText>
                </Pressable>
                <View style={styles.helpBox}><Feather name="info" size={16} color={theme.textSecondary} /><ThemedText type="caption" secondary style={{ marginLeft: Spacing.sm, flex: 1 }}>For room-related issues, please file a complaint or contact the admin</ThemedText></View>
            </ScrollView>
            <BrandedLoadingOverlay visible={isLoading} message="Fetching details..." icon="home" />

            <Modal visible={showChangeModal} animationType="slide" transparent onRequestClose={() => { setShowChangeModal(false); Keyboard.dismiss(); }}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
                        <View style={styles.modalHeaderCustom}>
                            <ThemedText type="h3">Room Change Request</ThemedText>
                            <Pressable onPress={() => { setShowChangeModal(false); Keyboard.dismiss(); }}><Feather name="x" size={24} color={theme.text} /></Pressable>
                        </View>
                        <View style={styles.modalForm}>
                            <ThemedText type="bodySmall" secondary style={styles.label}>Requested Room (Optional)</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
                                placeholder="e.g. 705"
                                placeholderTextColor={theme.textSecondary}
                                value={requestedRoom}
                                onChangeText={setRequestedRoom}
                            />

                            {requestedRoom.length > 0 && (
                                <View style={{ marginTop: -Spacing.xs, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
                                    {isCheckingRoom ? (
                                        <ThemedText type="caption" secondary>Checking availability...</ThemedText>
                                    ) : targetRoomData ? (
                                        <>
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isTargetFull ? Colors.status.error : Colors.status.success, marginRight: 6 }} />
                                            <ThemedText type="caption" style={{ color: isTargetFull ? Colors.status.error : Colors.status.success }}>
                                                {isTargetFull ? 'Room is Full' : `Available (${targetRoomData.capacity - targetRoomData.currentOccupancy} spots left)`}
                                            </ThemedText>
                                        </>
                                    ) : (
                                        <ThemedText type="caption" style={{ color: Colors.status.warning }}>Virtual room (Capacity: 4)</ThemedText>
                                    )}
                                </View>
                            )}

                            <ThemedText type="bodySmall" secondary style={styles.label}>Reason for Request</ThemedText>
                            <TextInput
                                style={[styles.textAreaCustom, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
                                placeholder="Explain why you want to change your room..."
                                placeholderTextColor={theme.textSecondary}
                                value={changeReason}
                                onChangeText={setChangeReason}
                                multiline
                                numberOfLines={4}
                            />
                            <Button
                                onPress={submitRoomChange}
                                loading={roomChangeMutation.isPending}
                                disabled={requestedRoom.length > 0 && isTargetFull}
                                style={{ marginTop: Spacing.md }}
                            >
                                Submit Request
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.lg },
    card: { padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.lg, ...Shadows.card },
    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
    iconContainer: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: "center", alignItems: "center", marginRight: Spacing.md },
    cardHeaderText: { flex: 1 },
    divider: { height: 1, backgroundColor: "#E5E7EB", marginBottom: Spacing.md },
    infoRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: Spacing.md },
    infoItem: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 120 },
    infoText: { marginLeft: Spacing.sm },
    statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.xs, marginLeft: "auto" },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md, marginTop: Spacing.md },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
    roommateCard: { flexDirection: "row", alignItems: "center", padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm, ...Shadows.card },
    lastCard: { marginBottom: Spacing.lg },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: Spacing.md },
    roommateInfo: { flex: 1 },
    phoneRow: { flexDirection: "row", alignItems: "center", marginTop: Spacing.xs },
    contactButton: { width: 40, height: 40, borderRadius: BorderRadius.full, justifyContent: "center", alignItems: "center" },
    emptyCard: { padding: Spacing.xxl, borderRadius: BorderRadius.md, alignItems: "center", marginBottom: Spacing.lg, ...Shadows.card },
    sectionTitle: { marginBottom: Spacing.md },
    facilitiesCard: { flexDirection: "row", flexWrap: "wrap", padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg, ...Shadows.card },
    facilityItem: { width: "33.33%", alignItems: "center", marginBottom: Spacing.md },
    facilityIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: "center", alignItems: "center", marginBottom: Spacing.xs },
    changeButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary.main },
    helpBox: { flexDirection: "row", padding: Spacing.md, backgroundColor: Colors.status.info + "10", borderRadius: BorderRadius.sm, marginBottom: Spacing.lg },
    fullBanner: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.status.error, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
    modalContent: { borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, paddingBottom: Spacing.xxl },
    modalHeaderCustom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
    modalForm: { padding: Spacing.xl, gap: Spacing.md },
    label: { marginBottom: Spacing.xs },
    input: { height: 50, borderRadius: BorderRadius.xs, paddingHorizontal: Spacing.md, fontSize: 16 },
    textAreaCustom: { height: 100, borderRadius: BorderRadius.xs, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, fontSize: 16, textAlignVertical: "top" },
});
