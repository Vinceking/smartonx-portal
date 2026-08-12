import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useGetMe, useLogin, useLogout } from '@workspace/api-client-react';
import type { AuthSession, LoginCredentials } from '@workspace/api-client-react';

interface AuthContextType {
  user: AuthSession | null;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>['mutateAsync'];
  logout: ReturnType<typeof useLogout>['mutateAsync'];
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = useGetMe({ query: { retry: false } });
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
