import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setToken } from './api'
import type { Usuario } from './types'

type AuthContextType = { user: Usuario|null; loading: boolean; signIn:(email:string,senha:string)=>Promise<void>; signUp:(nome:string,email:string,senha:string)=>Promise<void>; signOut:()=>void }
const AuthContext = createContext<AuthContextType>(null!)
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser] = useState<Usuario|null>(null)
  const [loading,setLoading] = useState(true)
  useEffect(()=>{ if(localStorage.getItem('achados_token')) api.me().then(setUser).catch(()=>{setToken('');setUser(null)}).finally(()=>setLoading(false)); else setLoading(false) },[])
  async function signIn(email:string,senha:string){ const result=await api.login(email,senha); setToken(result.access_token); setUser(result.usuario) }
  async function signUp(nome:string,email:string,senha:string){ await api.register(nome,email,senha); await signIn(email,senha) }
  function signOut(){setToken('');setUser(null)}
  return <AuthContext.Provider value={{user,loading,signIn,signUp,signOut}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext)
