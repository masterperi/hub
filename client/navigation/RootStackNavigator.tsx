import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";

import AuthScreen from "@/screens/AuthScreen";
import StudentTabNavigator from "@/navigation/StudentTabNavigator";
import AdminTabNavigator from "@/navigation/AdminTabNavigator";

export type RootStackParamList = {
  Auth: undefined;
  StudentMain: undefined;
  AdminMain: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, user } = useAuth();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : user?.role === "admin" ? (
        <Stack.Screen
          name="AdminMain"
          component={AdminTabNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="StudentMain"
          component={StudentTabNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
