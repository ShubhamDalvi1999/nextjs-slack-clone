export const ROLES = {
  admin: ['view:comments', 'create:comments', 'update:comments', 'delete:comments', '*'],
  moderator: ['view:comments', 'create:comments'],
  user: ['view:comments', 'create:comments'],
}

export function hasPermission(user, permission) {
  if (!user || !user.role) return false
  const perms = ROLES[user.role] || []
  return perms.includes('*') || perms.includes(permission)
}

export function deriveRoleFromAppRoleClaim(appRole) {
  if (appRole === 'admin' || appRole === 'moderator' || appRole === 'user') return appRole
  return undefined
}

export function getPermissionsForRole(role) {
  if (!role) return []
  return ROLES[role] || []
}


