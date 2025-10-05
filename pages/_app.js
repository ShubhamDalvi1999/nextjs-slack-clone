import '~/styles/style.scss'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import UserContext from 'lib/UserContext'
import { supabase } from 'lib/Store'
import { jwtDecode } from 'jwt-decode'
import { deriveRoleFromAppRoleClaim } from '~/lib/permissions'

export default function SupabaseSlackClone({ Component, pageProps }) {
  const [userLoaded, setUserLoaded] = useState(false)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const router = useRouter()
  const didRefresh = useRef(false)

  useEffect(() => {
    async function saveSession(
      /** @type {Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']} */
      session
    ) {
      setSession(session)
      const currentUser = session?.user
      try {
        if (session) {
          let jwt = jwtDecode(session.access_token)
          currentUser.appRole = jwt.user_role
          currentUser.role = deriveRoleFromAppRoleClaim(jwt.user_role)

          // If role claim was recently added via auth hook, force a one-time refresh to get a new JWT
          if (!currentUser.role && !didRefresh.current) {
            const { data, error } = await supabase.auth.refreshSession()
            if (!error && data?.session?.access_token) {
              didRefresh.current = true
              jwt = jwtDecode(data.session.access_token)
              currentUser.appRole = jwt.user_role
              currentUser.role = deriveRoleFromAppRoleClaim(jwt.user_role)
            }
          }
        }
      } catch (e) {
        currentUser.roleError = e?.message || 'Failed to decode JWT'
      }
      setUser(currentUser ?? null)
      setUserLoaded(!!currentUser)
      if (currentUser) {
        router.push('/channels/[id]', '/channels/1')
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => saveSession(session))

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(session)
        await saveSession(session)
      }
    )

    return () => {
      authListener?.unsubscribe?.()
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
  }

  return (
    <UserContext.Provider
      value={{
        userLoaded,
        user,
        signOut,
      }}
    >
      <Component {...pageProps} />
    </UserContext.Provider>
  )
}
