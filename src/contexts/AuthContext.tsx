/**
 * Auth context for TREE-LIFE.
 * Exposes the current Firebase Auth user + their custom claims
 * (role, orgId, custodianId) which are set by the setUserClaims
 * Cloud Function on account creation.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/firebase/config";
import type { AuthClaims } from "@/types/firestore";

interface AuthState {
  user:       User | null;
  claims:     AuthClaims | null;
  loading:    boolean;
  isRegistrar:  boolean;
  isCustodian:  boolean;
  isWardAdmin:  boolean;
  isUnassigned: boolean;
}

const AuthContext = createContext<AuthState>({
  user:         null,
  claims:       null,
  loading:      true,
  isRegistrar:  false,
  isCustodian:  false,
  isWardAdmin:  false,
  isUnassigned: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [claims,  setClaims]  = useState<AuthClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Force-refresh to get latest custom claims
        const token  = await firebaseUser.getIdTokenResult(true);
        const c = token.claims as Partial<AuthClaims>;
        setClaims({
          role:        c.role as any, // might be undefined
          orgId:       c.orgId,
          custodianId: c.custodianId,
        });
      } else {
        setClaims(null);
      }
      setLoading(false);
    });
  }, []);

  const value: AuthState = {
    user,
    claims,
    loading,
    isRegistrar: claims?.role === "registrar",
    isCustodian: claims?.role === "custodian",
    isWardAdmin: claims?.role === "ward_admin",
    isUnassigned: user !== null && !claims?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
