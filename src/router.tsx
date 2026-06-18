import { createBrowserRouter, Navigate } from 'react-router'
import { AdminLayout } from '@/layouts/AdminLayout'
import { MainShellPlain } from '@/layouts/MainShellPlain'
import { MainShellWithSidebar } from '@/layouts/MainShellWithSidebar'
import { RequireAuth } from '@/middleware/RequireAuth'
import { RequireApproved } from '@/middleware/RequireApproved'
import { RequireNotRejected } from '@/middleware/RequireNotRejected'
import { RequireStaff } from '@/middleware/RequireStaff'
import { DashboardPage } from '@/pages/DashboardPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LoginPage } from '@/pages/LoginPage'
import { PendingApprovalPage } from '@/pages/PendingApprovalPage'
import { RejectedAccessPage } from '@/pages/RejectedAccessPage'
import { PocDetailPage } from '@/pages/PocDetailPage'
import { AiPrescriptionProjectPage } from '@/pages/projects/AiPrescriptionProjectPage'
import { AiPrescriptionDetailPage } from '@/pages/projects/AiPrescriptionDetailPage'
import { HealthscopeInsightsProjectPage } from '@/pages/projects/HealthscopeInsightsProjectPage'
import { HealthscopeInsightsDetailPage } from '@/pages/projects/HealthscopeInsightsDetailPage'
import { PatientVisitAnalyticsHospitalPerformanceDetailPage } from '@/pages/projects/PatientVisitAnalyticsHospitalPerformanceDetailPage'
import { PatientVisitAnalyticsHospitalPerformanceProjectPage } from '@/pages/projects/PatientVisitAnalyticsHospitalPerformanceProjectPage'
import { PVPanelDegradationIntelligenceLabDetailPage } from '@/pages/projects/PVPanelDegradationIntelligenceLabDetailPage'
import { PVPanelDegradationIntelligenceLabProjectPage } from '@/pages/projects/PVPanelDegradationIntelligenceLabProjectPage'
import { SolarPowerGenerationForecastingLabDetailPage } from '@/pages/projects/SolarPowerGenerationForecastingLabDetailPage'
import { SolarPowerGenerationForecastingLabProjectPage } from '@/pages/projects/SolarPowerGenerationForecastingLabProjectPage'
import { InverterFailurePredictionLabDetailPage } from '@/pages/projects/InverterFailurePredictionLabDetailPage'
import { InverterFailurePredictionLabProjectPage } from '@/pages/projects/InverterFailurePredictionLabProjectPage'
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
import { RouteOptimizationLogisticsEfficiencyProjectPage } from '@/pages/projects/RouteOptimizationLogisticsEfficiencyProjectPage'
import { RouteOptimizationLogisticsEfficiencyDetailPage } from '@/pages/projects/RouteOptimizationLogisticsEfficiencyDetailPage'
import { AiGoldNegotiationProjectPage } from '@/pages/projects/AiGoldNegotiationProjectPage'
import { AiGoldNegotiationDetailPage } from '@/pages/projects/AiGoldNegotiationDetailPage'
import { RealEstateIntelligenceSuiteDetailPage } from '@/pages/projects/RealEstateIntelligenceSuiteDetailPage'
import { RealEstateIntelligenceSuiteSectionPage } from '@/pages/projects/RealEstateIntelligenceSuiteSectionPage'
import { RealEstateDemandForecastingDetailPage } from '@/pages/projects/RealEstateDemandForecastingDetailPage'
import { RealEstateDemandForecastingSectionPage } from '@/pages/projects/RealEstateDemandForecastingSectionPage'
import { MachineFailurePredictiveMaintenanceDetailPage } from '@/pages/projects/MachineFailurePredictiveMaintenanceDetailPage'
import { MachineFailurePredictiveMaintenanceProjectPage } from '@/pages/projects/MachineFailurePredictiveMaintenanceProjectPage'
import { OrderToDeliveryAnalyticsLabDetailPage } from '@/pages/projects/OrderToDeliveryAnalyticsLabDetailPage'
import { OrderToDeliveryAnalyticsLabProjectPage } from '@/pages/projects/OrderToDeliveryAnalyticsLabProjectPage'
import { InventoryPileupShortageAnalyticsLabDetailPage } from '@/pages/projects/InventoryPileupShortageAnalyticsLabDetailPage'
import { InventoryPileupShortageAnalyticsLabProjectPage } from '@/pages/projects/InventoryPileupShortageAnalyticsLabProjectPage'
import { OrderFulfillmentSlaAnalyticsDetailPage } from '@/pages/projects/OrderFulfillmentSlaAnalyticsDetailPage'
import { OrderFulfillmentSlaAnalyticsProjectPage } from '@/pages/projects/OrderFulfillmentSlaAnalyticsProjectPage'
import { MarketingCampaignPerformanceAnalyzerDetailPage } from '@/pages/projects/MarketingCampaignPerformanceAnalyzerDetailPage'
import { MarketingCampaignPerformanceAnalyzerProjectPage } from '@/pages/projects/MarketingCampaignPerformanceAnalyzerProjectPage'

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
      { path: 'pending-approval', element: <MainShellPlain />, children: [{ index: true, element: <PendingApprovalPage /> }] },
      { path: 'rejected-access', element: <MainShellPlain />, children: [{ index: true, element: <RejectedAccessPage /> }] },
      {
        element: <RequireNotRejected />,
        children: [
          {
            path: 'dashboard',
            element: <MainShellWithSidebar />,
            children: [{ index: true, element: <DashboardPage /> }],
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
            element: <RequireApproved />,
            children: [
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
                path: 'projects/healthscope-insights',
                element: <MainShellPlain />,
                children: [{ index: true, element: <HealthscopeInsightsProjectPage /> }],
              },
              {
                path: 'projects/healthscope-insights-detail',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <HealthscopeInsightsDetailPage /> }],
              },
              {
                path: 'projects/patient-visit-analytics-hospital-performance',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <PatientVisitAnalyticsHospitalPerformanceDetailPage /> }],
              },
              {
                path: 'projects/patient-visit-analytics-hospital-performance/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <PatientVisitAnalyticsHospitalPerformanceProjectPage /> }],
              },
              {
                path: 'projects/pv-panel-degradation-intelligence-lab',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <PVPanelDegradationIntelligenceLabDetailPage /> }],
              },
              {
                path: 'projects/pv-panel-degradation-intelligence-lab/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <PVPanelDegradationIntelligenceLabProjectPage /> }],
              },
              {
                path: 'projects/solar-power-generation-forecasting-lab',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <SolarPowerGenerationForecastingLabDetailPage /> }],
              },
              {
                path: 'projects/solar-power-generation-forecasting-lab/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <SolarPowerGenerationForecastingLabProjectPage /> }],
              },
              {
                path: 'projects/inverter-failure-prediction-lab',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <InverterFailurePredictionLabDetailPage /> }],
              },
              {
                path: 'projects/inverter-failure-prediction-lab/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <InverterFailurePredictionLabProjectPage /> }],
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
                path: 'projects/route-optimization-logistics-efficiency',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <RouteOptimizationLogisticsEfficiencyDetailPage /> }],
              },
              {
                path: 'projects/route-optimization-logistics-efficiency/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <RouteOptimizationLogisticsEfficiencyProjectPage /> }],
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
                path: 'projects/real-estate-demand-forecasting-lab',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <RealEstateDemandForecastingDetailPage /> }],
              },
              {
                path: 'projects/real-estate-demand-forecasting-lab/section',
                element: <MainShellPlain />,
                children: [{ index: true, element: <RealEstateDemandForecastingSectionPage /> }],
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
                path: 'projects/machine-failure-predictive-maintenance-lab',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <MachineFailurePredictiveMaintenanceDetailPage /> }],
              },
              {
                path: 'projects/machine-failure-predictive-maintenance-lab/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <MachineFailurePredictiveMaintenanceProjectPage /> }],
              },
              {
                path: 'projects/order-to-delivery-analytics-lab',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <OrderToDeliveryAnalyticsLabDetailPage /> }],
              },
              {
                path: 'projects/order-to-delivery-analytics-lab/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <OrderToDeliveryAnalyticsLabProjectPage /> }],
              },
              {
                path: 'projects/inventory-pileup-shortage-analytics-lab',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <InventoryPileupShortageAnalyticsLabDetailPage /> }],
              },
              {
                path: 'projects/inventory-pileup-shortage-analytics-lab/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <InventoryPileupShortageAnalyticsLabProjectPage /> }],
              },
              {
                path: 'projects/order-fulfillment-sla-analytics',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <OrderFulfillmentSlaAnalyticsDetailPage /> }],
              },
              {
                path: 'projects/order-fulfillment-sla-analytics/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <OrderFulfillmentSlaAnalyticsProjectPage /> }],
              },
              {
                path: 'projects/marketing-campaign-performance-analyzer',
                element: <MainShellWithSidebar />,
                children: [{ index: true, element: <MarketingCampaignPerformanceAnalyzerDetailPage /> }],
              },
              {
                path: 'projects/marketing-campaign-performance-analyzer/full',
                element: <MainShellPlain />,
                children: [{ index: true, element: <MarketingCampaignPerformanceAnalyzerProjectPage /> }],
              },
            ],
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
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
