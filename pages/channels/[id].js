import Layout from '~/components/Layout'
import Message from '~/components/Message'
import MessageInput from '~/components/MessageInput'
import { useRouter } from 'next/router'
import { useStore, addMessage } from '~/lib/Store'
import { useContext, useEffect, useRef } from 'react'
import UserContext from '~/lib/UserContext'

const ChannelsPage = (props) => {
  const router = useRouter()
  const { user, authLoaded, signOut } = useContext(UserContext)
  const messagesEndRef = useRef(null)

  // Else load up the page
  const { id: channelId } = router.query
  const { messages, channels } = useStore({ channelId })

  useEffect(() => {
    messagesEndRef.current.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    })
  }, [messages])

  // redirect to public channel when current channel is deleted (only after channels load)
  useEffect(() => {
    if (channels.length > 0 && !channels.some((channel) => channel.id === Number(channelId))) {
      router.push('/channels/1')
    }
  }, [channels, channelId])

  // Channel header (title)
  return (
    <Layout channels={channels} activeChannelId={channelId}>
      <div className="flex flex-col h-screen">
        <div className="px-4 py-2 border-b border-gray-700 bg-gray-900 flex items-center justify-between sticky top-0 z-10">
          <div className="text-white font-semibold">
            #{channels.find((c) => c.id === Number(channelId))?.slug || 'general'}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {messages.map((x) => (
            <Message key={x.id} message={x} />
          ))}
          <div ref={messagesEndRef} style={{ height: 0 }} />
        </div>
        <div className="p-2 border-t border-gray-700 bg-gray-900">
          <MessageInput
            disabled={!user?.id}
            onSubmit={async (text) => {
              try {
                await addMessage(text, channelId, user.id)
              } catch (e) {
                alert('Failed to send message')
              }
            }}
          />
        </div>
      </div>
    </Layout>
  )
}

export default ChannelsPage
