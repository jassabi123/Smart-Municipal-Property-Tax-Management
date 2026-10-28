import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isRouteAllowed } from '../../config/roles'
import Shell from '../layout/Shell'

export default function ProtectedRoute({ children, user, logout }) {
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Dashboard is always the landing workspace for authenticated users
  const isAllowed = location.pathname === '/dashboard' || location.pathname === '/access-denied' || isRouteAllowed(user.role, location.pathname)

  if (!isAllowed) {
    return <Navigate to="/access-denied" replace />
  }

  return (
    <Shell user={user} logout={logout}>
      {children}
    </Shell>
  )
}
