import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const API_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
export const BEARER_TOKEN_KEY = "diasporaeats_bearer_token";

const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      deleteItem: (key: string) => localStorage.removeItem(key),
    }
  : SecureStore;

// Used only for OAuth social sign-in redirect flow (auth-popup.tsx)
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "jambalayajerkjollof",
      storagePrefix: "diasporaeats",
      storage,
    }),
  ],
});

export async function getBearerToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(BEARER_TOKEN_KEY);
  }
  const token = await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
  console.log('[auth] getBearerToken result:', token ? `${token.slice(0, 8)}...` : 'NULL');
  return token;
}

export async function setBearerToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
  }
}

export async function clearAuthTokens() {
  if (Platform.OS === "web") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
  }
}
