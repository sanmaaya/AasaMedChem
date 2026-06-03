export type UserRole = 'admin' | 'seller' | 'buyer';

export function dashboardPathForRole(role: string | undefined | null): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'seller':
      return '/seller/dashboard';
    case 'buyer':
      return '/buyer/dashboard';
    default:
      return '/';
  }
}
