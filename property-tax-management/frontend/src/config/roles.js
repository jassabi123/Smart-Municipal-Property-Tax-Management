// Central Role-Based Access Control Configuration
// Defines roles, allowed routes/modules, granular permissions, and sidebar navigation items.

export const ROLES = {
  GUEST: 'GUEST',
  PROPERTY_OWNER: 'PROPERTY_OWNER',
  WARD_OFFICER: 'WARD_OFFICER',
  TAX_ASSESSOR: 'TAX_ASSESSOR',
  FINANCE_OFFICER: 'FINANCE_OFFICER',
  COMMISSIONER: 'COMMISSIONER',
  ADMIN: 'ADMIN',
}

export const ROLE_CONFIGS = {
  [ROLES.GUEST]: {
    label: 'Public Guest',
    defaultRoute: '/',
    allowedModules: ['/public-info', '/tax-rules', '/login', '/register'],
    actions: {
      canViewPublicInfo: true,
      canUseCalculatorPreview: true,
    },
    sidebar: [
      { path: '/', label: 'Home', icon: 'Home' },
      { path: '/public-info', label: 'Public Tax Info', icon: 'Info' },
      { path: '/tax-rules', label: 'Tax Rules & Guides', icon: 'BookOpen' },
    ],
  },

  [ROLES.PROPERTY_OWNER]: {
    label: 'Property Owner',
    defaultRoute: '/dashboard',
    allowedModules: [
      '/dashboard',
      '/properties',
      '/tax-assessments',
      '/tax-payments',
      '/noc-requests',
      '/grievances',
      '/notifications',
      '/profile',
    ],
    actions: {
      canRegisterProperty: true,
      canViewOwnPropertiesOnly: true,
      canViewOwnAssessmentsOnly: true,
      canPayPropertyTax: true,
      canViewPaymentHistory: true,
      canDownloadReceipt: true,
      canRequestNOC: true,
      canTrackNOC: true,
      canSubmitGrievance: true,
      canViewGrievanceStatus: true,
      canUpdateOwnProfile: true,
    },
    sidebar: [
      { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { path: '/properties', label: 'My Properties', icon: 'Building2' },
      { path: '/tax-assessments', label: 'My Assessments', icon: 'FileSpreadsheet' },
      { path: '/tax-payments', label: 'Tax Payments', icon: 'CreditCard' },
      { path: '/noc-requests', label: 'NOC Requests', icon: 'FileCheck' },
      { path: '/grievances', label: 'Grievances', icon: 'MessageSquare' },
      { path: '/notifications', label: 'Notifications', icon: 'Bell' },
      { path: '/profile', label: 'Profile', icon: 'User' },
    ],
  },

  [ROLES.WARD_OFFICER]: {
    label: 'Ward Officer',
    defaultRoute: '/dashboard',
    allowedModules: [
      '/dashboard',
      '/properties',
      '/noc-requests',
      '/notices',
      '/notifications',
      '/profile',
    ],
    actions: {
      canViewWardProperties: true,
      canVerifyProperties: true,
      canUpdatePropertyStatus: true,
      canManagePermittedRecords: true,
      canProcessNOC: true,
      canIssueNotices: true,
    },
    sidebar: [
      { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { path: '/properties', label: 'Properties', icon: 'Building2' },
      { path: '/noc-requests', label: 'NOC Requests', icon: 'FileCheck' },
      { path: '/notices', label: 'Notices', icon: 'AlertTriangle' },
      { path: '/notifications', label: 'Notifications', icon: 'Bell' },
      { path: '/profile', label: 'Profile', icon: 'User' },
    ],
  },

  [ROLES.TAX_ASSESSOR]: {
    label: 'Tax Assessor',
    defaultRoute: '/dashboard',
    allowedModules: [
      '/dashboard',
      '/properties',
      '/tax-assessments',
      '/reports',
      '/notifications',
      '/profile',
    ],
    actions: {
      canViewPermittedProperties: true,
      canCreateAssessments: true,
      canUpdateAssessments: true,
      canCalculateTax: true,
      canApplyPenalties: true,
      canViewAssessmentReports: true,
      canIssueNotices: true,
    },
    sidebar: [
      { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { path: '/properties', label: 'Properties', icon: 'Building2' },
      { path: '/tax-assessments', label: 'Tax Assessments', icon: 'FileSpreadsheet' },
      { path: '/reports', label: 'Reports', icon: 'BarChart3' },
      { path: '/notifications', label: 'Notifications', icon: 'Bell' },
      { path: '/profile', label: 'Profile', icon: 'User' },
    ],
  },

  [ROLES.FINANCE_OFFICER]: {
    label: 'Finance Officer',
    defaultRoute: '/dashboard',
    allowedModules: [
      '/dashboard',
      '/tax-payments',
      '/exemptions',
      '/defaulters',
      '/financial-reports',
      '/reports',
      '/analytics',
      '/notifications',
      '/profile',
    ],
    actions: {
      canViewPayments: true,
      canVerifyPaymentRecords: true,
      canViewRevenue: true,
      canManageExemptions: true,
      canViewDefaulters: true,
      canGenerateFinancialReports: true,
      canViewFinancialAnalytics: true,
    },
    sidebar: [
      { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { path: '/tax-payments', label: 'Payments', icon: 'CreditCard' },
      { path: '/exemptions', label: 'Exemptions', icon: 'Percent' },
      { path: '/defaulters', label: 'Defaulters', icon: 'AlertOctagon' },
      { path: '/financial-reports', label: 'Financial Reports', icon: 'FileText' },
      { path: '/analytics', label: 'Analytics', icon: 'LineChart' },
      { path: '/notifications', label: 'Notifications', icon: 'Bell' },
      { path: '/profile', label: 'Profile', icon: 'User' },
    ],
  },

  [ROLES.COMMISSIONER]: {
    label: 'Commissioner',
    defaultRoute: '/dashboard',
    allowedModules: [
      '/dashboard',
      '/analytics',
      '/ward-performance',
      '/revenue-reports',
      '/defaulters',
      '/reports',
      '/notifications',
      '/profile',
    ],
    actions: {
      canViewMunicipalityAnalytics: true,
      canViewWardPerformance: true,
      canViewCollectionPerformance: true,
      canViewDefaulterReports: true,
      canViewExecutiveReports: true,
      canMonitorOperations: true,
    },
    sidebar: [
      { path: '/dashboard', label: 'Executive Dashboard', icon: 'LayoutDashboard' },
      { path: '/analytics', label: 'Analytics', icon: 'LineChart' },
      { path: '/ward-performance', label: 'Ward Performance', icon: 'Compass' },
      { path: '/revenue-reports', label: 'Revenue Reports', icon: 'TrendingUp' },
      { path: '/defaulters', label: 'Defaulters', icon: 'AlertOctagon' },
      { path: '/reports', label: 'Reports', icon: 'FileText' },
      { path: '/notifications', label: 'Notifications', icon: 'Bell' },
      { path: '/profile', label: 'Profile', icon: 'User' },
    ],
  },

  [ROLES.ADMIN]: {
    label: 'System Administrator',
    defaultRoute: '/dashboard',
    allowedModules: [
      '/dashboard',
      '/admin-users',
      '/properties',
      '/tax-assessments',
      '/tax-payments',
      '/exemptions',
      '/noc-requests',
      '/grievances',
      '/analytics',
      '/ward-performance',
      '/revenue-reports',
      '/defaulters',
      '/financial-reports',
      '/reports',
      '/audit-logs',
      '/settings',
      '/notifications',
      '/profile',
    ],
    actions: {
      canManageUsers: true,
      canCreateUsers: true,
      canEditUsers: true,
      canDeactivateUsers: true,
      canChangeRoles: true,
      canManageProperties: true,
      canViewAllAssessments: true,
      canViewPayments: true,
      canManageExemptions: true,
      canManageNOC: true,
      canViewGrievances: true,
      canViewAnalytics: true,
      canViewAuditLogs: true,
      canManageSystemSettings: true,
    },
    sidebar: [
      { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { path: '/admin-users', label: 'Users', icon: 'Users' },
      { path: '/properties', label: 'Properties', icon: 'Building2' },
      { path: '/tax-assessments', label: 'Assessments', icon: 'FileSpreadsheet' },
      { path: '/tax-payments', label: 'Payments', icon: 'CreditCard' },
      { path: '/exemptions', label: 'Exemptions', icon: 'Percent' },
      { path: '/noc-requests', label: 'NOC', icon: 'FileCheck' },
      { path: '/grievances', label: 'Grievances', icon: 'MessageSquare' },
      { path: '/analytics', label: 'Analytics', icon: 'LineChart' },
      { path: '/reports', label: 'Reports', icon: 'FileText' },
      { path: '/audit-logs', label: 'Audit Logs', icon: 'ShieldCheck' },
      { path: '/settings', label: 'Settings', icon: 'Settings' },
      { path: '/profile', label: 'Profile', icon: 'User' },
    ],
  },
}

export function isRouteAllowed(role, pathname) {
  if (!role) return false
  const config = ROLE_CONFIGS[role]
  if (!config) return false
  return config.allowedModules.some(mod => pathname === mod || pathname.startsWith(mod + '/'))
}

export function hasActionPermission(role, actionKey) {
  if (!role) return false
  const config = ROLE_CONFIGS[role]
  return Boolean(config?.actions?.[actionKey])
}
