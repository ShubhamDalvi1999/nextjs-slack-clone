import { useContext } from 'react'
import UserContext from '~/lib/UserContext'
import { deleteMessage } from '~/lib/Store'
import { hasPermission } from '~/lib/permissions'
import TrashIcon from '~/components/TrashIcon'

const Message = ({ message }) => {
  const { user } = useContext(UserContext)

  return (
    <div className="px-3 py-2 flex items-start space-x-2 hover:bg-gray-900 rounded">
      <div className="text-gray-400 w-4 pt-1">
        {(user?.id === message.user_id || hasPermission(user && { id: user.id, role: user.role }, 'delete:comments')) && (
          <button className="hover:text-red-400" onClick={() => deleteMessage(message.id)}>
            <TrashIcon />
          </button>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <p className="text-blue-400 font-medium text-sm">{message?.author?.username}</p>
          <span className="text-xs text-gray-500">{new Date(message.inserted_at).toLocaleTimeString()}</span>
        </div>
        <p className="text-gray-100 leading-relaxed">{message.message}</p>
      </div>
    </div>
  )
}

export default Message
