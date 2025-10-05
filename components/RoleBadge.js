const ROLE_STYLES = {
  admin: 'bg-red-100 text-red-800 border border-red-300',
  moderator: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  user: 'bg-green-100 text-green-800 border border-green-300',
}

export default function RoleBadge({ role, error }) {
  if (!role) {
    return (
      <span
        title={error ? String(error) : 'No role present in JWT'}
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 border border-gray-300"
      >
        role: unavailable
      </span>
    )
  }
  const cls = ROLE_STYLES[role] || 'bg-gray-100 text-gray-800 border border-gray-300'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {role}
    </span>
  )
}


