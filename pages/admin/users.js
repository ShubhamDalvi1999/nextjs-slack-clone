import { useEffect, useState, useContext } from 'react'
import UserContext from '~/lib/UserContext'
import { listUsersWithRoles, setUserRole } from '~/lib/Store'

export default function AdminUsersPage() {
  const { user } = useContext(UserContext)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const allowed = user?.role === 'admin'

  useEffect(() => {
    const load = async () => {
      if (!allowed) return
      try {
        setLoading(true)
        const data = await listUsersWithRoles()
        setRows(data)
      } catch (e) {
        alert('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [allowed])

  const toggleRole = async (email, role, hasRole) => {
    try {
      await setUserRole(email, role, !hasRole)
      const data = await listUsersWithRoles()
      setRows(data)
    } catch (e) {
      alert('Failed to update role')
    }
  }

  if (!allowed) {
    return (
      <div className="p-4 text-white">
        <h2 className="text-xl font-bold mb-2">Forbidden</h2>
        <p className="text-sm text-gray-400">Only admins can access the roles dashboard. Your JWT must include user_role=admin.</p>
      </div>
    )
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-1">Users & Roles</h2>
      <p className="text-sm text-gray-400 mb-4">Admins can promote/demote existing users only. Changes require user re-login to refresh JWT claims.</p>
      <div className="mb-3 p-3 bg-gray-800 rounded text-sm text-gray-300">
        <p className="mb-2 font-semibold">Search users</p>
        <UserSearch onChange={(q) => setQuery(q)} />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-gray-900">
          <thead>
            <tr>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Username</th>
              <th className="text-left p-2">Admin</th>
              <th className="text-left p-2">Moderator</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) => !query || r.email.toLowerCase().includes(query.toLowerCase()) || (r.username || '').toLowerCase().includes(query.toLowerCase()))
              .map((r) => {
              const hasAdmin = r.roles?.includes('admin')
              const hasMod = r.roles?.includes('moderator')
                const isSelf = r.email === user?.email
              return (
                <tr key={r.user_id} className="border-t border-gray-700">
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">{r.username}</td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={!!hasAdmin}
                        onChange={() => toggleRole(r.email, 'admin', hasAdmin)}
                        disabled={isSelf}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={!!hasMod}
                        onChange={() => toggleRole(r.email, 'moderator', hasMod)}
                        disabled={isSelf}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function UserSearch({ onChange }) {
  return (
    <input
      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100 w-full"
      type="text"
      placeholder="Search by email or username"
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
