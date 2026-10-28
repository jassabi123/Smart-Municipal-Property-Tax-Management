import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { api } from './api/client'

// Layout & Common
import ProtectedRoute from './components/common/ProtectedRoute'
import RoleDashboardRouter from './components/dashboards/RoleDashboardRouter'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import PublicInfoPage from './pages/PublicInfoPage'
import TaxRulesPage from './pages/TaxRulesPage'
import PropertiesPage from './pages/PropertiesPage'
import TaxAssessmentsPage from './pages/TaxAssessmentsPage'
import TaxPaymentsPage from './pages/TaxPaymentsPage'
import NOCPage from './pages/NOCPage'
import GrievancesPage from './pages/GrievancesPage'
import NoticesPage from './pages/NoticesPage'
import ExemptionsPage from './pages/ExemptionsPage'
import Analytics from './pages/Analytics'
import WardPerformance from './pages/WardPerformance'
import RevenueReports from './pages/RevenueReports'
import Defaulters from './pages/Defaulters'
import ReportsPage from './pages/ReportsPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AuditLogsPage from './pages/AuditLogsPage'
import ProfilePage from './pages/ProfilePage'
import AccessDenied from './pages/AccessDenied'

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tax_user') || 'null')
    } catch {
      return null
    }
  })

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('tax_token')
    localStorage.removeItem('tax_user')
    setUser(null)
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage setUser={setUser} />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage setUser={setUser} />} 
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/public-info" element={<PublicInfoPage />} />
      <Route path="/tax-rules" element={<TaxRulesPage />} />
      <Route path="/access-denied" element={<AccessDenied user={user} />} />

      {/* Protected Workspaces */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <RoleDashboardRouter user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/properties"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <PropertiesPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tax-assessments"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <TaxAssessmentsPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tax-payments"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <TaxPaymentsPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/noc-requests"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <NOCPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/grievances"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <GrievancesPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notices"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <NoticesPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exemptions"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <ExemptionsPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <Analytics user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ward-performance"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <WardPerformance user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/revenue-reports"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <RevenueReports user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/defaulters"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <Defaulters user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/financial-reports"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <RevenueReports user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <ReportsPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <NotificationsPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-users"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <AdminUsersPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <AuditLogsPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <AdminUsersPage user={user} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user} logout={logout}>
            <ProfilePage user={user} setUser={setUser} />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  )
}
