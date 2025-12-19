import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, ScrollView, Pressable, Modal, TextInput, Alert, FlatList, Image, Animated as RNAnimated } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInRight, useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { FloatingBackground } from "@/components/FloatingBackground";
import { BrandedLoadingOverlay } from "@/components/BrandedLoadingOverlay";

type MealType = "breakfast" | "lunch" | "dinner";

const MEAL_ICONS: Record<MealType, keyof typeof Feather.glyphMap> = {
  breakfast: "sunrise",
  lunch: "sun",
  dinner: "moon",
};

// Pulsing Icon Container
const PulsingIcon = ({ children, style }: { children: React.ReactNode, style: any }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

// Blinking Dot Component
const BlinkingDot = ({
  color,
  duration = 1000,
  minOpacity = 0.3,
  maxOpacity = 1.0
}: {
  color: string,
  duration?: number,
  minOpacity?: number,
  maxOpacity?: number
}) => {
  const opacity = useRef(new RNAnimated.Value(minOpacity)).current;

  // React to prop changes by restarting the animation
  useEffect(() => {
    // Reset to initial value first to avoid jumps
    opacity.setValue(minOpacity);

    const animation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: maxOpacity,
          duration: duration / 2,
          useNativeDriver: false
        }),
        RNAnimated.timing(opacity, {
          toValue: minOpacity,
          duration: duration / 2,
          useNativeDriver: false
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [duration, minOpacity, maxOpacity]);

  return <RNAnimated.View style={[styles.dot, { backgroundColor: color, opacity }]} />;
};

export default function MenuScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState<MealType>("breakfast");
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [dishName, setDishName] = useState("");
  const [dishDescription, setDishDescription] = useState("");

  // LIVE CLOCK State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Timer to update status every minute
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Helper to determine active state
  const getMealState = (type: MealType) => {
    const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    let isActive = false;
    let label = "Closed";

    let config = {
      duration: 2000,
      minOpacity: 0.4,
      maxOpacity: 0.8,
    };

    if (type === "breakfast") {
      // 7:30 (450) - 8:40 (520)
      if (minutes >= 450 && minutes <= 520) {
        isActive = true;
        label = "Serving";
      } else if (minutes >= 420 && minutes < 450) {
        label = "Prep";
      }
    } else if (type === "lunch") {
      // 12:15 (735) - 13:00 (780)
      if (minutes >= 735 && minutes <= 780) {
        isActive = true;
        label = "Serving";
      } else if (minutes >= 700 && minutes < 735) {
        label = "Prep";
      }
    } else if (type === "dinner") {
      // 19:30 (1170) - 20:30 (1230)
      if (minutes >= 1170 && minutes <= 1230) {
        isActive = true;
        label = "Serving";
      } else if (minutes >= 1140 && minutes < 1170) {
        label = "Prep";
      }
    }

    if (isActive) {
      config.duration = 400;
      config.minOpacity = 0.6;
      config.maxOpacity = 1.0;
    }

    return { ...config, label };
  };

  const breakfastState = getMealState("breakfast");
  const lunchState = getMealState("lunch");
  const dinnerState = getMealState("dinner");

  const { data: menuData } = useQuery({
    queryKey: [
      "mess-menus",
      `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}?hostelBlock=${user?.hostelBlock || ''}`,
    ],
    enabled: !!user?.hostelBlock,
  });

  const { data: suggestions } = useQuery({
    queryKey: ['menu-suggestions', `?hostelBlock=${user?.hostelBlock || ''}&mealType=${selectedMeal}`],
    enabled: !!user?.hostelBlock,
  });

  const isLoading = !menuData && !suggestions;

  const createSuggestionMutation = useMutation({
    mutationFn: async (data: { userId: string; dishName: string; description?: string; hostelBlock: string; forDate: Date; mealType: string }) => {
      const response = await apiRequest("POST", "/menu-suggestions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-suggestions'] });
      setShowSuggestionModal(false);
      setDishName("");
      setDishDescription("");
      Alert.alert("Success", "Your suggestion has been submitted!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to submit suggestion");
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/menu-suggestions/${id}/vote`, {});
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to vote");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-suggestions'] });
    },
    onError: (error: Error) => {
      Alert.alert("Already Liked", error.message);
    },
  });

  const getDates = () => {
    const dates = [];
    for (let i = -1; i <= 12; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      isToday: date.toDateString() === new Date().toDateString(),
    };
  };

  const getCurrentMealMenu = () => {
    const menus = menuData as any[];
    if (!menus) return null;
    return menus.find((m) => m.mealType === selectedMeal);
  };

  const currentMenu = getCurrentMealMenu();

  const handleSubmitSuggestion = () => {
    if (!dishName.trim()) {
      Alert.alert("Error", "Please enter a dish name");
      return;
    }
    if (!user?.id || !user?.hostelBlock) {
      Alert.alert("Error", "You must be logged in and assigned to a hostel");
      return;
    }
    createSuggestionMutation.mutate({
      userId: user.id,
      dishName: dishName.trim(),
      description: dishDescription.trim() || undefined,
      hostelBlock: user.hostelBlock,
      forDate: selectedDate,
      mealType: selectedMeal,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <FloatingBackground primaryColor={Colors.primary.main} secondaryColor={Colors.secondary.main} />
      {/* Background Header */}
      <View style={[styles.headerBg, { backgroundColor: theme.backgroundSecondary }]} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Dashboard */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.statusDashboard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
            <ThemedText type="h3">Mess Status</ThemedText>
            <ThemedText type="caption" secondary>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
          </View>
          <View style={styles.statusRow}>
            {/* Breakfast Status */}
            <View style={[styles.statusBox, { backgroundColor: Colors.status.success + '10', borderColor: Colors.status.success + '20' }]}>
              <View style={styles.statusHeader}>
                <BlinkingDot
                  color={Colors.status.success}
                  duration={breakfastState.duration}
                  minOpacity={breakfastState.minOpacity}
                  maxOpacity={breakfastState.maxOpacity}
                />
                <ThemedText type="caption" style={{ color: Colors.status.success, fontWeight: '700' }}>{breakfastState.label}</ThemedText>
              </View>
              <ThemedText type="bodySmall" style={{ fontWeight: '600' }}>Breakfast</ThemedText>
            </View>

            {/* Lunch Status */}
            <View style={[styles.statusBox, { backgroundColor: Colors.status.warning + '10', borderColor: Colors.status.warning + '20' }]}>
              <View style={styles.statusHeader}>
                <BlinkingDot
                  color={Colors.status.warning}
                  duration={lunchState.duration}
                  minOpacity={lunchState.minOpacity}
                  maxOpacity={lunchState.maxOpacity}
                />
                <ThemedText type="caption" style={{ color: Colors.status.warning, fontWeight: '700' }}>{lunchState.label}</ThemedText>
              </View>
              <ThemedText type="bodySmall" style={{ fontWeight: '600' }}>Lunch</ThemedText>
            </View>

            {/* Dinner Status */}
            <View style={[styles.statusBox, { backgroundColor: Colors.status.error + '10', borderColor: Colors.status.error + '20' }]}>
              <View style={styles.statusHeader}>
                <BlinkingDot
                  color={Colors.status.error}
                  duration={dinnerState.duration}
                  minOpacity={dinnerState.minOpacity}
                  maxOpacity={dinnerState.maxOpacity}
                />
                <ThemedText type="caption" style={{ color: Colors.status.error, fontWeight: '700' }}>{dinnerState.label}</ThemedText>
              </View>
              <ThemedText type="bodySmall" style={{ fontWeight: '600' }}>Dinner</ThemedText>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: Spacing.md }} />

        {/* Date Scroller */}
        <FlatList
          horizontal
          data={getDates()}
          keyExtractor={(item) => item.toISOString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroller}
          renderItem={({ item, index }) => {
            const { day, date, isToday } = formatDate(item);
            const isSelected = item.toDateString() === selectedDate.toDateString();
            return (
              <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
                <Pressable
                  style={[
                    styles.dateItem,
                    { backgroundColor: isSelected ? Colors.primary.main : theme.backgroundDefault },
                  ]}
                  onPress={() => setSelectedDate(item)}
                >
                  <ThemedText
                    type="caption"
                    style={[styles.dateDay, { color: isSelected ? "#FFFFFF" : theme.textSecondary }]}
                  >
                    {day}
                  </ThemedText>
                  <ThemedText
                    type="h3"
                    style={{ color: isSelected ? "#FFFFFF" : theme.text }}
                  >
                    {date}
                  </ThemedText>
                  {isToday ? (
                    <View style={[styles.todayDot, { backgroundColor: isSelected ? "#FFFFFF" : Colors.primary.main }]} />
                  ) : null}
                </Pressable>
              </Animated.View>
            );
          }}
        />

        <View style={styles.mealTabs}>
          {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => (
            <Pressable
              key={meal}
              style={[
                styles.mealTab,
                {
                  backgroundColor: selectedMeal === meal ? Colors.primary.main : theme.backgroundDefault,
                  borderColor: selectedMeal === meal ? Colors.primary.main : theme.border,
                },
              ]}
              onPress={() => setSelectedMeal(meal)}
            >
              <Feather
                name={MEAL_ICONS[meal]}
                size={20}
                color={selectedMeal === meal ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                type="bodySmall"
                style={[styles.mealTabText, { color: selectedMeal === meal ? "#FFFFFF" : theme.text }]}
              >
                {meal.charAt(0).toUpperCase() + meal.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.menuCard, { backgroundColor: theme.backgroundDefault }]}>
          {currentMenu ? (
            <>
              <View style={styles.menuHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <PulsingIcon style={[styles.mealIcon, { backgroundColor: Colors.primary.light + '20' }]}>
                    <Feather name={MEAL_ICONS[selectedMeal]} size={20} color={Colors.primary.main} />
                  </PulsingIcon>
                  <View>
                    <ThemedText type="h3">Today's {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}</ThemedText>
                    <ThemedText type="caption" secondary>
                      {selectedMeal === 'breakfast' ? '07:30 AM - 09:00 AM' : selectedMeal === 'lunch' ? '12:30 PM - 02:00 PM' : '07:30 PM - 09:00 PM'}
                    </ThemedText>
                  </View>
                </View>

                {currentMenu.isSpecial ? (
                  <View style={styles.specialBadge}>
                    <BlinkingDot color="#fff" duration={600} />
                    <ThemedText type="caption" style={styles.specialText}>SPECIAL</ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {currentMenu.specialNote ? (
                <View style={[styles.noteBox, { backgroundColor: Colors.status.warning + '10' }]}>
                  <Feather name="info" size={14} color={Colors.status.warning} />
                  <ThemedText type="caption" style={{ color: Colors.status.warning }}>{currentMenu.specialNote}</ThemedText>
                </View>
              ) : null}

              <View style={styles.menuItems}>
                {currentMenu.menuItems && currentMenu.menuItems.length > 0 ? (
                  currentMenu.menuItems.map((item: any, index: number) => (
                    <View key={`item-${index}-${item.name}`} style={[styles.menuItemCard, { borderBottomColor: theme.border }]}>
                      <View style={styles.menuItemContent}>
                        <ThemedText type="body" style={styles.menuItemName}>•  {item.name}</ThemedText>
                      </View>
                    </View>
                  ))
                ) : (
                  <ThemedText type="body" style={{ lineHeight: 24, padding: Spacing.md }}>
                    {currentMenu.items}
                  </ThemedText>
                )}
              </View>
            </>
          ) : (
            <View style={styles.noMenuState}>
              <Feather name="coffee" size={48} color={theme.textSecondary} />
              <ThemedText type="body" secondary style={styles.noMenuText}>
                No menu available for this date
              </ThemedText>
            </View>
          )}
        </Animated.View>

        <ThemedText type="h3" style={styles.sectionTitle}>Menu Suggestions</ThemedText>
        <ThemedText type="bodySmall" secondary style={styles.sectionSubtitle}>
          Vote for dishes you'd like to see on the menu
        </ThemedText>

        {(suggestions as any[])?.length > 0 ? (
          (suggestions as any[]).map((suggestion: any, index: number) => (
            <Animated.View key={suggestion._id || index} entering={FadeInDown.delay(300 + index * 50)} style={[styles.suggestionCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.suggestionContent}>
                <ThemedText type="body" style={styles.suggestionName}>{suggestion.dishName}</ThemedText>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 2, marginBottom: 4 }}>
                  <View style={{ backgroundColor: Colors.secondary.main + '20', paddingHorizontal: 6, borderRadius: 4 }}>
                    <ThemedText type="caption" style={{ color: Colors.secondary.main, fontSize: 10, textTransform: 'capitalize' }}>{suggestion.mealType}</ThemedText>
                  </View>
                  <ThemedText type="caption" secondary style={{ fontSize: 10 }}>Suggested on {new Date(suggestion.createdAt).toLocaleDateString()}</ThemedText>
                </View>
                {suggestion.description ? (
                  <ThemedText type="bodySmall" secondary>{suggestion.description}</ThemedText>
                ) : null}
              </View>
              <Pressable
                style={[
                  styles.voteButton,
                  {
                    backgroundColor: suggestion.votedBy?.some((v: any) => String(v) === String(user?.id || (user as any)?._id))
                      ? Colors.primary.main
                      : Colors.primary.light + "20"
                  }
                ]}
                onPress={() => {
                  const hasVoted = suggestion.votedBy?.some((v: any) => String(v) === String(user?.id || (user as any)?._id));
                  if (!hasVoted) {
                    voteMutation.mutate(suggestion._id || suggestion.id);
                  } else {
                    Alert.alert("Already Liked", "You have already voted for this suggestion");
                  }
                }}
              >
                <Feather
                  name={suggestion.votedBy?.some((v: any) => String(v) === String(user?.id || (user as any)?._id)) ? "check-circle" : "thumbs-up"}
                  size={18}
                  color={suggestion.votedBy?.some((v: any) => String(v) === String(user?.id || (user as any)?._id)) ? "#FFFFFF" : Colors.primary.main}
                />
                <ThemedText
                  type="bodySmall"
                  style={{
                    color: suggestion.votedBy?.some((v: any) => String(v) === String(user?.id || (user as any)?._id)) ? "#FFFFFF" : Colors.primary.main,
                    fontWeight: "600"
                  }}
                >
                  {suggestion.votedBy?.some((v: any) => String(v) === String(user?.id || (user as any)?._id)) ? `Liked (${suggestion.votes})` : suggestion.votes}
                </ThemedText>
              </Pressable>
            </Animated.View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="body" secondary>No suggestions yet. Be the first!</ThemedText>
          </View>
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { backgroundColor: Colors.primary.main }]}
        onPress={() => setShowSuggestionModal(true)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={showSuggestionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSuggestionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Suggest a Dish</ThemedText>
              <Pressable onPress={() => setShowSuggestionModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
                placeholder="Dish Name (e.g., Dosa)"
                placeholderTextColor={theme.textSecondary}
                value={dishName}
                onChangeText={setDishName}
              />

              <ThemedText type="bodySmall" secondary style={styles.label}>Select Date</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, marginBottom: Spacing.md }}>
                {getDates().map((d, index) => {
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  const { day, date } = formatDate(d);
                  return (
                    <Pressable
                      key={index}
                      style={[
                        styles.dateCard,
                        { backgroundColor: isSelected ? Colors.primary.main : theme.backgroundDefault, borderColor: isSelected ? Colors.primary.main : theme.border, marginRight: 8, height: 45, width: 50, justifyContent: 'center', alignItems: 'center' }
                      ]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <ThemedText type="caption" style={{ color: isSelected ? "#FFFFFF" : theme.textSecondary, fontSize: 10 }}>{day}</ThemedText>
                      <ThemedText type="bodySmall" style={{ color: isSelected ? "#FFFFFF" : theme.text, fontWeight: 'bold' }}>{date}</ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <ThemedText type="bodySmall" secondary style={styles.label}>Select Session</ThemedText>
              <View style={[styles.mealTabs, { marginBottom: Spacing.md }]}>
                {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => (
                  <Pressable
                    key={meal}
                    style={[
                      styles.mealTab,
                      {
                        backgroundColor: selectedMeal === meal ? Colors.primary.main : theme.backgroundDefault,
                        borderColor: selectedMeal === meal ? Colors.primary.main : theme.border,
                        paddingVertical: 8
                      },
                    ]}
                    onPress={() => setSelectedMeal(meal)}
                  >
                    <ThemedText style={{ color: selectedMeal === meal ? "#FFFFFF" : theme.text, fontSize: 12, textTransform: 'capitalize' }}>
                      {meal}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
                placeholder="Description (optional)"
                placeholderTextColor={theme.textSecondary}
                value={dishDescription}
                onChangeText={setDishDescription}
                multiline
                numberOfLines={3}
              />

              <Button
                onPress={handleSubmitSuggestion}
                loading={createSuggestionMutation.isPending}
                fullWidth
              >
                Submit Suggestion
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      <BrandedLoadingOverlay visible={isLoading} message="Fetching today's menu..." icon="coffee" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  statusDashboard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusBox: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dateScroller: {
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  dateItem: {
    width: 60,
    height: 85,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.card,
  },
  dateDay: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.xs,
  },
  mealTabs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  mealTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  mealTabText: {
    fontWeight: "500",
  },
  menuCard: {
    padding: 0,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xxl,
    ...Shadows.card,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.status.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  specialText: {
    color: "#FFFFFF",
    fontWeight: 'bold',
    fontSize: 10,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  divider: {
    height: 1,
    opacity: 0.5,
  },
  menuItems: {
    padding: Spacing.md,
    paddingTop: 0,
    gap: Spacing.md,
  },
  menuItemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemName: {
    fontWeight: "600",
  },
  noMenuState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  noMenuText: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.lg,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    gap: Spacing.xs,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.tabBarHeight + Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.fab,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalForm: {
    gap: Spacing.sm
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs
  },
  dateCard: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
});
