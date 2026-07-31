'use client';
import {useState} from 'react'; import {Sidebar} from './Sidebar'; import {Topbar} from './Topbar'; import {Footer} from './Footer';
export function AppShell({children}:{children:React.ReactNode}){const[open,setOpen]=useState(false);return <div className="min-h-screen bg-[#f6f8fa]"><Sidebar open={open} onClose={()=>setOpen(false)}/><div className="lg:pl-64"><Topbar onMenu={()=>setOpen(true)}/><main className="min-h-[calc(100vh-144px)] px-4 py-6 sm:px-6 lg:px-8">{children}</main><Footer/></div></div>}
