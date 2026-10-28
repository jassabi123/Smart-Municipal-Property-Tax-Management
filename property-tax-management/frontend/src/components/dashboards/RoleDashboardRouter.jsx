import React from 'react'
import PropertyOwnerDashboard from './PropertyOwnerDashboard'
import WardOfficerDashboard from './WardOfficerDashboard'
import TaxAssessorDashboard from './TaxAssessorDashboard'
import FinanceOfficerDashboard from './FinanceOfficerDashboard'
import CommissionerDashboard from './CommissionerDashboard'
import AdminDashboard from './AdminDashboard'

export default function RoleDashboardRouter({ user }) {
  const role = user?.role || 'PROPERTY_OWNER'

  switch (role) {
    case 'PROPERTY_OWNER':
      return <PropertyOwnerDashboard user={user} />
    case 'WARD_OFFICER':
      return <WardOfficerDashboard user={user} />
    case 'TAX_ASSESSOR':
      return <TaxAssessorDashboard user={user} />
    case 'FINANCE_OFFICER':
      return <FinanceOfficerDashboard user={user} />
    case 'COMMISSIONER':
      return <CommissionerDashboard user={user} />
    case 'ADMIN':
      return <AdminDashboard user={user} />
    case 'GUEST':
    default:
      return <PropertyOwnerDashboard user={user} />
  }
}
