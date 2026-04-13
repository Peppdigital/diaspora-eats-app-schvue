import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { API_URL, getBearerToken, setBearerToken, clearAuthTokens } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string | null;
  full_name?: string | null;
  phone?: string | null;
  default_location_city?: string | null;
  default_location_state?: string | null;
  diaspora_segment?: string[] | null;
  favorite_cuisines?: string[] | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<User | null>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<User | null>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
  updateUser: (updates: Partial<Omit<User, 'id' | 'email'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (): Promise<User | null> => {
    try {
      const token = await getBearerToken();
      if (!token) {
        setUser(null);
        return null;
      }
      const res = await fetch(`${API_URL}/functions/v1/api-auth-me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = await res.json();
      const u: User | null = data.user ?? null;
      setUser(u);
      return u;
    } catch (error) {
      console.error("Failed to fetch user session:", error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const subscription = Linking.addEventListener("url", () => {
      console.log("Deep link received, refreshing user session");
      fetchUser();
    });

    const intervalId = setInterval(() => {
      fetchUser();
    }, 5 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
    console.log("signInWithEmail called", { email });
    const res = await fetch(`${API_URL}/functions/v1/auth-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Email sign in failed");
    await setBearerToken(data.token);
    return fetchUser();
  };

  const signUpWithEmail = async (email: string, password: string, name?: string): Promise<User | null> => {
    console.log("signUpWithEmail called", { email, name });
    const res = await fetch(`${API_URL}/functions/v1/auth-signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name ?? "" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Email sign up failed");
    await setBearerToken(data.token);
    return fetchUser();
  };

  const signInWithSocial = async (provider: string) => {
    console.log("signInWithSocial called", { provider });
    if (Platform.OS === "web") {
      const token = await openOAuthPopup(provider);
      await setBearerToken(token);
      await fetchUser();
    } else {
      const WebBrowser = await import("expo-web-browser");
      const callbackURL = "jambalayajerkjollof://auth-callback";
      const authURL = `${API_URL}/functions/v1/auth-social?provider=${provider}&callbackURL=${encodeURIComponent(callbackURL)}`;
      const result = await WebBrowser.openAuthSessionAsync(authURL, callbackURL);

      if (result.type === "success" && result.url) {
        const queryString = result.url.includes("?") ? result.url.split("?")[1] : "";
        const token = new URLSearchParams(queryString).get("better_auth_token");
        if (!token) throw new Error(`${provider} sign in failed: no token received`);
        await setBearerToken(token);
        await fetchUser();
      } else if (result.type === "cancel" || result.type === "dismiss") {
        throw new Error("Authentication cancelled");
      } else {
        throw new Error(`${provider} sign in failed`);
      }
    }
  };

  const signInWithGoogle = () => {
    console.log("signInWithGoogle called");
    return signInWithSocial("google");
  };

  const signInWithApple = async () => {
    console.log("signInWithApple called");
    if (Platform.OS === "ios") {
      const AppleAuthentication = await import("expo-apple-authentication");
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error("No identity token received from Apple");
      }
      const res = await fetch(`${API_URL}/functions/v1/auth-social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "apple", idToken: credential.identityToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Apple sign in failed");
      await setBearerToken(data.token);
      await fetchUser();
    } else {
      await signInWithSocial("apple");
    }
  };

  const signOut = async () => {
    console.log("signOut called");
    setUser(null);
    await clearAuthTokens();
  };

  const updateUser = async (updates: Partial<Omit<User, 'id' | 'email'>>) => {
    const token = await getBearerToken();
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_URL}/functions/v1/api-user-profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update profile");
    if (data.profile) setUser(data.profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signInWithEmail,
        signUpWithEmail,
        signInWithApple,
        signInWithGoogle,
        signOut,
        fetchUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
