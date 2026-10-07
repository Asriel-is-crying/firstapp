import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AppState, Platform } from "react-native";
import { Session } from "@supabase/supabase-js";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { rows } from "./api";
import { Membership, Profile } from "../domain/models";
const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
  profile: Profile | undefined;
  memberships: Membership[];
  moderator: boolean;
}>({
  session: null,
  loading: true,
  profile: undefined,
  memberships: [],
  moderator: false,
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(!!supabase);
  const qc = useQueryClient();
  useEffect(() => {
    if (!supabase) {
      return;
    }
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") qc.clear();
    });
    const app = AppState.addEventListener("change", (state) => {
      if (Platform.OS !== "web") {
        if (state === "active") supabase?.auth.startAutoRefresh();
        else supabase?.auth.stopAutoRefresh();
      }
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
      app.remove();
    };
  }, [qc]);
  const uid = session?.user.id;
  const profile = useQuery({
    queryKey: ["profile", uid],
    queryFn: () => rows<Profile>("profiles", { id: uid }),
    enabled: !!uid,
  });
  const memberships = useQuery({
    queryKey: ["memberships", uid],
    queryFn: () => rows<Membership>("club_memberships", { user_id: uid }),
    enabled: !!uid,
  });
  const admins = useQuery({
    queryKey: ["platform_admins", uid],
    queryFn: () => rows("platform_admins", { user_id: uid }),
    enabled: !!uid,
  });
  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        profile: profile.data?.[0],
        memberships: memberships.data ?? [],
        moderator: !!admins.data?.length,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
