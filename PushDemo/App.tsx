// App.tsx
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View, Button, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

// -----------------------------------------------------------------------------
// 1) GLOBAL HANDLER
// Must be set OUTSIDE the component so it runs before any notification arrives.
// Controls how notifications behave when the app is in the FOREGROUND.
// -----------------------------------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      // SDK-compat: some versions use shouldShowAlert, newer iOS APIs also expose banner/list.
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }) as any,
});

// -----------------------------------------------------------------------------
// 2) Registration function
// Asks permission, sets up the Android channel, returns the Expo push token.
// -----------------------------------------------------------------------------
async function registerForPushNotificationsAsync(): Promise<string | null> {
  // 2a. Notifications need a real device.
  if (!Device.isDevice) {
    Alert.alert("Please use a physical device for push notifications.");
    return null;
  }

  // 2b. On Android, a channel must exist BEFORE requesting the token.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // 2c. Check / request permission.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    Alert.alert("Permission for notifications was denied.");
    return null;
  }

  // 2d. Get projectId from app.json (placed there by `eas init`).
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;

  if (!projectId) {
    Alert.alert("No projectId found. Did you run `eas init`?");
    return null;
  }

  // 2e. Finally, ask Expo's servers for the push token.
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenResponse.data; // e.g. ExponentPushToken[xxxxxxxxxxxxxxxx]
  } catch (err) {
    console.error("getExpoPushTokenAsync failed:", err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// 3) The App component
// -----------------------------------------------------------------------------
export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastReceived, setLastReceived] = useState<string>("—");

  // Refs hold the listener subscriptions so they can be cleaned up on unmount.
  const receivedRef = useRef<Notifications.EventSubscription | null>(null);
  const responseRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // 3a. On mount, register and store the token.
    registerForPushNotificationsAsync().then(setExpoPushToken);

    // 3b. Fires whenever a notification arrives while the app is OPEN.
    receivedRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setLastReceived(notification.request.content.body ?? "(empty body)");
      },
    );

    // 3c. Fires whenever the user TAPS a notification.
    //     Works in foreground, background, AND cold-start.
    responseRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        Alert.alert("Notification tapped", JSON.stringify(data));
        // Real apps would call navigation.navigate(...) here.
      },
    );

    return () => {
      receivedRef.current?.remove();
      responseRef.current?.remove();
    };
  }, []);

  // 3d. Helper: fire a LOCAL notification after 2 seconds (no internet needed).
  async function fireLocalNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hello from the app",
        body: "This is a local notification (no server needed).",
        data: { screen: "Home" },
      },
      // SDK-compat: avoids enum/type mismatch across expo-notifications versions
      trigger: { seconds: 2 } as any,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo Push Demo</Text>
      <Text style={styles.label}>Your push token:</Text>
      <Text selectable style={styles.token}>
        {expoPushToken ?? "Fetching…"}
      </Text>
      <Text style={styles.label}>Last received body:</Text>
      <Text style={styles.body}>{lastReceived}</Text>
      <View style={{ height: 16 }} />
      <Button
        title="Fire LOCAL notification (2s)"
        onPress={fireLocalNotification}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80, paddingHorizontal: 20, gap: 8 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 12 },
  label: { fontSize: 13, color: "#666", marginTop: 8 },
  token: { fontSize: 12, color: "#000", fontFamily: "monospace" },
  body: { fontSize: 15, color: "#222" },
});

