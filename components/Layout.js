import Link from 'next/link'
import { useContext } from 'react'
import UserContext from '~/lib/UserContext'
import { addChannel, deleteChannel } from '~/lib/Store'
import RoleBadge from '~/components/RoleBadge'
import { getPermissionsForRole } from '~/lib/permissions'
import TrashIcon from '~/components/TrashIcon'

export default function Layout(props) {
  const { signOut, user } = useContext(UserContext)

  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  }

  const newChannel = async () => {
    if (!user?.id) return
    const slug = prompt('Please enter your name')
    if (slug) {
      const { error, status } = await addChannel(slugify(slug), user.id)
      if (status === 409) {
        alert('Channel name already exists. Try another name.')
      } else if (error) {
        alert(error.message || 'Failed to create channel')
      }
    }
  }

  return (
    <main className="main flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <nav
        className="w-72 bg-gray-900 text-gray-100 overflow-y-auto border-r border-gray-800"
        style={{ maxWidth: '24%', minWidth: 220, maxHeight: '100vh' }}
      >
        <div className="px-3 py-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Workspace</h2>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-3">
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded w-full transition duration-150 text-sm"
              onClick={() => newChannel()}
              disabled={!user?.id}
            >
              New Channel
            </button>
          </div>
          <div className="flex flex-col space-y-2 p-2 bg-gray-800 rounded">
            <div className="flex items-center justify-between">
              <h6 className="text-xs truncate mr-2">{user?.email}</h6>
              <RoleBadge role={user?.role || user?.appRole} error={user?.roleError} />
            </div>
            {(user?.role || user?.appRole) && (
              <div className="mt-1 text-[11px] text-gray-400">
                <div className="uppercase tracking-wide text-gray-500 mb-1">Permissions</div>
                <ul className="list-disc ml-4 space-y-0.5">
                  {getPermissionsForRole(user.role || user.appRole).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white py-1.5 px-3 rounded w-full transition duration-150 text-sm"
              onClick={() => signOut()}
            >
              Log out
            </button>
          </div>
          <div className="mt-3">
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="# Filter channels"
              onChange={() => {}}
            />
          </div>
          <h4 className="font-bold mt-3 mb-1 text-xs text-gray-400">Channels</h4>
          <ul className="channel-list space-y-1">
            {props.channels.map((x) => (
              <SidebarItem
                channel={x}
                key={x.id}
                isActiveChannel={x.id === props.activeChannelId}
                user={user}
              />
            ))}
          </ul>
          {user?.role === 'admin' && (
            <div className="mt-4">
              <Link href="/admin/users">
                <a className="text-blue-400 underline text-sm">Admin: Users & Roles</a>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 bg-gray-800 h-screen">{props.children}</div>
    </main>
  )
}

const SidebarItem = ({ channel, isActiveChannel, user }) => (
  <>
    <li className={`flex items-center justify-between px-2 py-1 rounded ${isActiveChannel ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
      <Link href="/channels/[id]" as={`/channels/${channel.id}`}>
        <a className={`text-sm ${isActiveChannel ? 'font-semibold text-white' : 'text-gray-300'}`}>#{channel.slug}</a>
      </Link>
      {channel.id !== 1 && (channel.created_by === user?.id || user?.appRole === 'admin') && (
        <button className="text-gray-400 hover:text-red-400" onClick={() => deleteChannel(channel.id)}>
          <TrashIcon />
        </button>
      )}
    </li>
  </>
)
