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
import { PiiRedactionProjectPage } from '@/pages/projects/PiiRedactionProjectPage'
import { PiiRedactionDetailPage } from '@/pages/projects/PiiRedactionDetailPage'
import { MultimodalRAGProjectPage } from '@/pages/projects/MultimodalRAGProjectPage'
import { MultimodalRAGDetailPage } from '@/pages/projects/MultimodalRAGDetailPage'
import { SentimentAnalyzerProjectPage } from '@/pages/projects/SentimentAnalyzerProjectPage'
import { SentimentAnalyzerDetailPage } from '@/pages/projects/SentimentAnalyzerDetailPage'
import { IntelligentDocumentProcessorProjectPage } from '@/pages/projects/IntelligentDocumentProcessorProjectPage'
import { IntelligentDocumentProcessorDetailPage } from '@/pages/projects/IntelligentDocumentProcessorDetailPage'
import { AiGoldNegotiationProjectPage } from '@/pages/projects/AiGoldNegotiationProjectPage'
import { AiGoldNegotiationDetailPage } from '@/pages/projects/AiGoldNegotiationDetailPage'
import { RealEstateIntelligenceSuiteDetailPage } from '@/pages/projects/RealEstateIntelligenceSuiteDetailPage'
import { RealEstateIntelligenceSuiteSectionPage } from '@/pages/projects/RealEstateIntelligenceSuiteSectionPage'

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
        path: 'projects/sentiment-analyzer',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <SentimentAnalyzerDetailPage /> }],
      },
      {
        path: 'projects/sentiment-analyzer/full',
        element: <MainShellPlain />,
        children: [{ index: true, element: <SentimentAnalyzerProjectPage /> }],
      },
      {
        path: 'projects/intelligent-document-processor',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <IntelligentDocumentProcessorDetailPage /> }],
      },
      {
        path: 'projects/intelligent-document-processor/full',
        element: <MainShellPlain />,
        children: [{ index: true, element: <IntelligentDocumentProcessorProjectPage /> }],
      },
      {
        path: 'projects/ai-gold-negotiation',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <AiGoldNegotiationDetailPage /> }],
      },
      {
        path: 'projects/ai-gold-negotiation/full',
        element: <MainShellPlain />,
        children: [{ index: true, element: <AiGoldNegotiationProjectPage /> }],
      },
      {
        path: 'projects/real-estate-intelligence-suite',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <RealEstateIntelligenceSuiteDetailPage /> }],
      },
      {
        path: 'projects/real-estate-intelligence-suite/section',
        element: <MainShellPlain />,
        children: [{ index: true, element: <RealEstateIntelligenceSuiteSectionPage /> }],
      },
      {
        path: 'projects/pii-redaction',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <PiiRedactionDetailPage /> }],
      },
      {
        path: 'projects/pii-redaction/full',
        element: <MainShellPlain />,
        children: [{ index: true, element: <PiiRedactionProjectPage /> }],
      },
      {
        path: 'projects/multimodal-rag',
        element: <MainShellWithSidebar />,
        children: [{ index: true, element: <MultimodalRAGDetailPage /> }],
      },
      {
        path: 'projects/multimodal-rag/full',
        element: <MainShellPlain />,
        children: [{ index: true, element: <MultimodalRAGProjectPage /> }],
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
