import React, { createContext, useContext, ReactNode } from 'react';
import { useGetAdminMe, useAdminLogin, useAdminLogout } from '@workspace/api-client-react';
import type { AdminSession } from '@workspace/api-client-react';

interface AdminAuthContextType {
  admin: AdminSession | null;
  isLoading: boolean;
  login: ReturnType<typeof useAdminLogin>['mutateAsync'];
  logout: ReturnType<typeof useAdminLogout>['mutateAsync'];
  refetch: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { data: admin, isLoading, refetch } = useGetAdminMe({ query: { retry: false } });
  const loginMutation = useAdminLogin();
  const logoutMutation = useAdminLogout();

  return (
    <AdminAuthContext.Provider
      value={{
        admin: admin ?? null,
        isLoading,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        refetch,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
