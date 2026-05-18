import { createBrowserRouter, Navigate } from 'react-router'
import { AdminLayout } from '@/layouts/AdminLayout'
import { MainShellPlain } from '@/layouts/MainShellPlain'
import { MainShellWithSidebar } from '@/layouts/MainShellWithSidebar'
import { RequireAuth } from '@/middleware/RequireAuth'
import { RequireStaff } from '@/middleware/RequireStaff'
import { DashboardPage } from '@/pages/DashboardPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LoginPage } from '@/pages/LoginPage'
import { PendingApprovalPage } from '@/pages/PendingApprovalPage'
import { PocDetailPage } from '@/pages/PocDetailPage'
import { AiPrescriptionProjectPage } from '@/pages/projects/AiPrescriptionProjectPage'
import { AiPrescriptionDetailPage } from '@/pages/projects/AiPrescriptionDetailPage'
import { OfferLetterProjectPage } from '@/pages/projects/OfferLetterProjectPage'
import { OfferLetterDetailPage } from '@/pages/projects/OfferLetterDetailPage'

import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignupPage } from '@/pages/SignupPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { AdminAccessManagementPage } from '@/pages/admin/AdminAccessManagementPage'
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: 'dashboard',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <DashboardPage /> }],
      },
      {
        path: 'poc/:slug',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <PocDetailPage /> }],
      },
      {
        path: 'projects/ai-prescription',
        element: <MainShellPlain />,
        children: [{ index: true, element: <AiPrescriptionProjectPage /> }],
      },
      {
        path: 'projects/ai-prescription-detail',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <AiPrescriptionDetailPage /> }],
      },
      {
        path: 'projects/offerletter-generator',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <OfferLetterDetailPage /> }],
      },
      {
        path: 'projects/offerletter-generator/full',
        element: <MainShellPlain />,
        children: [{ index: true, element: <OfferLetterProjectPage /> }],
      },

      {
        path: 'profile',
        element: <MainShellPlain />,
        children: [{ index: true, element: <ProfilePage /> }],
      },
      {
        path: 'settings',
        element: <MainShellPlain />,
        children: [{ index: true, element: <SettingsPage /> }],
      },
      {
        path: 'pending-approval',
        element: <MainShellPlain />,
        children: [{ index: true, element: <PendingApprovalPage /> }],
      },
      {
        element: <RequireStaff />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminOverviewPage /> },
              { path: 'users', element: <AdminUsersPage /> },
              { path: 'access-management', element: <AdminAccessManagementPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
