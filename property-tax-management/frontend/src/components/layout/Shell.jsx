import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Shell({ children, user, logout }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`app-shell-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar user={user} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="app-main-wrapper">
        <Navbar user={user} logout={logout} />
        <main className="app-content-body">
          {children}
        </main>
      </div>
    </div>
  )
}
