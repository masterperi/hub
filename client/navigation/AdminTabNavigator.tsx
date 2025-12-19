import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { HeaderBackButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

import AdminDashboardScreen from "@/screens/admin/AdminDashboardScreen";
import ManageMenuScreen from "@/screens/admin/ManageMenuScreen";
import ManageAttendanceScreen from "@/screens/admin/ManageAttendanceScreen";
import ManageRoomsScreen from "@/screens/admin/ManageRoomsScreen";
import LeaveApprovalsScreen from "@/screens/admin/LeaveApprovalsScreen";
import ComplaintManagementScreen from "@/screens/admin/ComplaintManagementScreen";
import AdminProfileScreen from "@/screens/admin/AdminProfileScreen";
import AnnouncementManagementScreen from "@/screens/admin/AnnouncementManagementScreen";
import RoomChangeApprovalsScreen from "@/screens/admin/RoomChangeApprovalsScreen";
import ManageLeaveWindowScreen from "@/screens/admin/ManageLeaveWindowScreen";

export type AdminTabParamList = {
  HomeTab: undefined;
  ManageTab: undefined;
  AttendanceTab: undefined;
  ApprovalsTab: undefined;
  ProfileTab: undefined;
};

export type AdminStackParamList = {
  Dashboard: undefined;
  ManageMenu: undefined;
  ManageRooms: undefined;
  ManageAnnouncements: undefined;
  ManageAttendance: undefined;
  ManageLeaveWindow: undefined;
  LeaveApprovals: undefined;
  RoomChangeApprovals: undefined;
  ComplaintManagement: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function BackToHomeButton({ pointerEvents, canGoBack, label, tintColor, style, ...props }: any) {
  const navigation = useNavigation<any>();
  return (
    <HeaderBackButton
      canGoBack={canGoBack}
      label={label}
      tintColor={tintColor}
      style={[style, pointerEvents && { pointerEvents }]}
      {...props}
      onPress={() => {
        navigation.navigate("HomeTab", { screen: "Dashboard" });
      }}
    />
  );
}

function HomeStack() {
  const screenOptions = useScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ComplaintManagement"
        component={ComplaintManagementScreen}
        options={{
          headerTitle: "Complaints",
          headerLeft: (props) => <BackToHomeButton {...props} />
        }}
      />
    </Stack.Navigator>
  );
}

function ManageStack() {
  const screenOptions = useScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ManageMenu"
        component={ManageMenuScreen}
        options={{
          headerTitle: "Manage Menu",
          headerLeft: (props) => <BackToHomeButton {...props} />
        }}
      />
      <Stack.Screen
        name="ManageRooms"
        component={ManageRoomsScreen}
        options={{
          headerTitle: "Room Allotment",
          headerLeft: (props) => <BackToHomeButton {...props} />
        }}
      />
      <Stack.Screen
        name="ManageAnnouncements"
        component={AnnouncementManagementScreen}
        options={{
          headerTitle: "Announcements",
          headerLeft: (props) => <BackToHomeButton {...props} />
        }}
      />
      <Stack.Screen
        name="ManageLeaveWindow"
        component={ManageLeaveWindowScreen}
        options={{
          headerTitle: "Leave Window",
          headerLeft: (props) => <BackToHomeButton {...props} />
        }}
      />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  const screenOptions = useScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ManageAttendance"
        component={ManageAttendanceScreen}
        options={{
          headerTitle: "Attendance",
          headerLeft: (props) => <BackToHomeButton {...props} />
        }}
      />
    </Stack.Navigator>
  );
}

function ApprovalsStack() {
  const screenOptions = useScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="LeaveApprovals"
        component={LeaveApprovalsScreen}
        options={{
          headerTitle: "Leave Approvals",
          headerLeft: (props) => <BackToHomeButton {...props} />
        }}
      />
      <Stack.Screen
        name="RoomChangeApprovals"
        component={RoomChangeApprovalsScreen}
        options={{
          headerTitle: "Room Changes",
          headerLeft: (props) => <BackToHomeButton {...props} />
        }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const screenOptions = useScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={AdminProfileScreen}
        options={{
          headerTitle: "Profile",
          headerLeft: (props) => <BackToHomeButton {...props} />
        }}
      />
    </Stack.Navigator>
  );
}

export default function AdminTabNavigator() {
  const { theme, isDark } = useTheme();

  const getTabBarVisibility = (route: any) => {
    const routeName = getFocusedRouteNameFromRoute(route);
    // Hide tab bar on any sub-stack screens
    if (
      routeName === "ManageMenu" ||
      routeName === "ManageRooms" ||
      routeName === "ManageAnnouncements" ||
      routeName === "ManageAttendance" ||
      routeName === "ManageLeaveWindow" ||
      routeName === "LeaveApprovals" ||
      routeName === "RoomChangeApprovals" ||
      routeName === "ComplaintManagement" ||
      routeName === "Profile"
    ) {
      return "none";
    }
    return "flex";
  };

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: Colors.secondary.main, // Distinguish admin with secondary color
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundSecondary, // Themed color for premium feel
          }),
          borderTopWidth: 0,
          elevation: 8,
          height: Spacing.tabBarHeight,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarBackground: Platform.OS === "ios" ? () => (
          <BlurView
            intensity={100}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : undefined,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={({ route }) => ({
          title: "Home",
          tabBarStyle: { display: getTabBarVisibility(route), position: 'absolute', backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.backgroundRoot, borderTopWidth: 0, elevation: 0, height: Spacing.tabBarHeight, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        })}
      />
      <Tab.Screen
        name="ManageTab"
        component={ManageStack}
        options={({ route }) => ({
          title: "Manage",
          tabBarStyle: { display: getTabBarVisibility(route), position: 'absolute', backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.backgroundRoot, borderTopWidth: 0, elevation: 0, height: Spacing.tabBarHeight, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        })}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceStack}
        options={({ route }) => ({
          title: "Attendance",
          tabBarStyle: { display: getTabBarVisibility(route), position: 'absolute', backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.backgroundRoot, borderTopWidth: 0, elevation: 0, height: Spacing.tabBarHeight, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.centerTab,
                { backgroundColor: focused ? Colors.primary.main : theme.backgroundSecondary },
              ]}
            >
              <Feather name="check-circle" size={24} color={focused ? "#FFFFFF" : color} />
            </View>
          ),
          tabBarLabel: () => null,
        })}
      />
      <Tab.Screen
        name="ApprovalsTab"
        component={ApprovalsStack}
        options={({ route }) => ({
          title: "Approvals",
          tabBarStyle: { display: getTabBarVisibility(route), position: 'absolute', backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.backgroundRoot, borderTopWidth: 0, elevation: 0, height: Spacing.tabBarHeight, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size} color={color} />
          ),
        })}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={({ route }) => ({
          title: "Profile",
          tabBarStyle: { display: getTabBarVisibility(route), position: 'absolute', backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.backgroundRoot, borderTopWidth: 0, elevation: 0, height: Spacing.tabBarHeight, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centerTab: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
});
