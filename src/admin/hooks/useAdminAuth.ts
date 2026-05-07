import { neonAuth } from "../../lib/auth";

export const useAdminAuth = () => {
  const session = neonAuth.useSession();
  const user = session.data?.user ?? null;

  return { 
    isAuthenticated: Boolean(user),
    isLoading: session.isPending,
    user,
    logout: () => neonAuth.signOut(),
    refresh: () => void session.refetch(),
  };
};
