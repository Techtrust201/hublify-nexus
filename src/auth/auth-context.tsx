import { createContext, useContext, type ReactNode } from "react";
import { aLeDroit, type AuthContexte, type DroitId } from "@/auth/permissions";

const AuthCtx = createContext<AuthContexte | null>(null);

export function AuthProvider({
  valeur,
  children,
}: {
  valeur: AuthContexte | null;
  children: ReactNode;
}) {
  return <AuthCtx.Provider value={valeur}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

export function useDroit(id: DroitId) {
  const auth = useAuth();
  return Boolean(auth && aLeDroit(auth.droits, id));
}
