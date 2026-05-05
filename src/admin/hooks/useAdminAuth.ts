import { useFamilyStore } from "../../hooks/useFamilyStore";

export const useAdminAuth = () => {
  const { isAuthenticated, login, logout } = useFamilyStore();

  return { 
    isAuthenticated, 
    login, 
    logout, 
    refresh: () => {} // Refresh is no longer needed as state is global
  };
};
