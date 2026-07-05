import { useAuthStore } from '../store/authStore';

/**
 * Hook to check if the current user has a specific permission.
 * Usage: const canApproveLeave = usePermission('leave:approve:team');
 */
export function usePermission(permission: string): boolean {
  return useAuthStore((state) => state.hasPermission(permission));
}

/**
 * Hook to check if the user has any of the given permissions.
 * Usage: const canManageEmployees = useAnyPermission('employee:read:all', 'employee:read:team');
 */
export function useAnyPermission(...permissions: string[]): boolean {
  return useAuthStore((state) => state.hasAnyPermission(...permissions));
}

/**
 * Get current user's role name.
 */
export function useRole(): string | null {
  return useAuthStore((state) => state.user?.role ?? null);
}
