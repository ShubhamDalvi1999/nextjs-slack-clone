export const ROLES = {
  admin: [
    'view:comments',
    'create:comments',
    'update:comments',
    'delete:comments',
    '*',
  ] as const,
  moderator: ['view:comments', 'create:comments'] as const,
  user: ['view:comments', 'create:comments'] as const,
} as const

export type Role = keyof typeof ROLES
export type Permission = (typeof ROLES)[Role][number]

export function hasPermission(
  user: { id: string; role?: Role } | null | undefined,
  permission: Permission
): boolean {
  if (!user?.role) return false
  const perms = ROLES[user.role] as readonly Permission[]
  return (perms as readonly string[]).includes('*') || perms.includes(permission)
}

// Map Supabase JWT claim to our Role type
export function deriveRoleFromAppRoleClaim(appRole: unknown): Role | undefined {
  if (appRole === 'admin' || appRole === 'moderator' || appRole === 'user') return appRole
  return undefined
}

