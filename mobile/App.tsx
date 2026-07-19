import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";

export default function App() {
  // Set a default IP that you can edit here, or type it in the app UI
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState("3000");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    if (!ipAddress.trim()) {
      alert("Please enter a valid IP address.");
      return;
    }
    setIsLoading(true);
    // Simple transition
    setTimeout(() => {
      setIsLoading(false);
      setIsConnected(true);
    }, 800);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  // Full-screen WebView showing the workspace
  if (isConnected) {
    const targetUrl = `http://${ipAddress.trim()}:${port.trim()}/?platform=mobile`;
    return (
      <SafeAreaView style={styles.webContainer}>
        <StatusBar style="light" backgroundColor="#0F0F11" />
        <WebView
          source={{ uri: targetUrl }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webLoader}>
              <ActivityIndicator size="large" color="#D4AF37" />
            </View>
          )}
        />
        
        {/* Floating Settings Button to go back to configuration screen */}
        <TouchableOpacity style={styles.floatingButton} onPress={handleDisconnect}>
          <Text style={styles.floatingButtonText}>⚙️</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Configuration Setup Screen (styled to match EndoCore Obsidian-Dark theme)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#0F0F11" />
      <View style={styles.card}>
        <Text style={styles.logoText}>🕊️ EndoCore</Text>
        <Text style={styles.subtitleText}>Mobile Workspace Pipeline</Text>
        
        <View style={styles.divider} />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>PC Local IP Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 192.168.1.15"
            placeholderTextColor="#666"
            value={ipAddress}
            onChangeText={setIpAddress}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Express Server Port</Text>
          <TextInput
            style={styles.input}
            placeholder="3000"
            placeholderTextColor="#666"
            value={port}
            onChangeText={setPort}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#0F0F11" />
          ) : (
            <Text style={styles.buttonText}>Connect Workspace</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Ensure your PC and phone are connected to the same Wi-Fi network and that the Express server is running.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F11",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  webContainer: {
    flex: 1,
    backgroundColor: "#0F0F11",
  },
  webview: {
    flex: 1,
  },
  webLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F0F11",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1E1E24",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2E2E38",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 14,
    color: "#D4AF37", // Golden theme
    textAlign: "center",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#2E2E38",
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: "#A0A0B0",
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#0F0F11",
    borderWidth: 1,
    borderColor: "#2E2E38",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#D4AF37", // Gold Button
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#0F0F11",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "rgba(30, 30, 36, 0.8)",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    elevation: 4,
  },
  floatingButtonText: {
    fontSize: 20,
  },
});
