import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/app-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { ProtectedRoute } from "@/components/routes/protected-route";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageSpinner } from "@/components/states/loading-state";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { LocaleProvider } from "@/i18n/locale-context";
import { AdminCategoriesPage } from "@/pages/admin/admin-categories-page";
import { AdminJobsPage } from "@/pages/admin/admin-jobs-page";
import { AdminReviewsPage } from "@/pages/admin/admin-reviews-page";
import { AdminUsersPage } from "@/pages/admin/admin-users-page";
import { ApplicationsPage } from "@/pages/app/applications-page";
import { ChatPage } from "@/pages/app/chat-page";
import { DashboardPage } from "@/pages/app/dashboard-page";
import { ProfilePage } from "@/pages/app/profile-page";
import { SettingsPage } from "@/pages/app/settings-page";
import { CreateJobPage } from "@/pages/customer/create-job-page";
import { EditJobPage } from "@/pages/customer/edit-job-page";
import { MyJobsPage } from "@/pages/customer/my-jobs-page";
import { CategoriesPage } from "@/pages/public/categories-page";
import { JobDetailsPage } from "@/pages/public/job-details-page";
import { ForgotPasswordPage } from "@/pages/public/forgot-password-page";
import { GoogleCompletePage } from "@/pages/public/google-complete-page";
import { CompleteProfilePage } from "@/pages/public/complete-profile-page";
import { TermsPage, PrivacyPage } from "@/pages/public/legal-pages";
import { JobsPage } from "@/pages/public/jobs-page";
import { LandingPage } from "@/pages/public/landing-page";
import { LoginPage } from "@/pages/public/login-page";
import { NotFoundPage } from "@/pages/public/not-found-page";
import { RegisterPage } from "@/pages/public/register-page";
import { VerifyEmailPage } from "@/pages/public/verify-email-page";
import { ReviewsPage } from "@/pages/public/reviews-page";
import { JobsSearchPage } from "@/pages/worker/jobs-search-page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-[50svh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="atlas.theme">
        <LocaleProvider>
        <TooltipProvider delayDuration={200}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <GuestRoute>
                    <VerifyEmailPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <GuestRoute>
                    <ForgotPasswordPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/complete-profile"
                element={
                  <GuestRoute>
                    <CompleteProfilePage />
                  </GuestRoute>
                }
              />
              <Route
                path="/auth/google/complete"
                element={
                  <GuestRoute>
                    <GoogleCompletePage />
                  </GuestRoute>
                }
              />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
            </Route>

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route
                path="jobs"
                element={
                  <ProtectedRoute roles={["customer", "admin"]}>
                    <MyJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="jobs/new"
                element={
                  <ProtectedRoute roles={["customer", "admin"]}>
                    <CreateJobPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="jobs/:jobId/edit"
                element={
                  <ProtectedRoute roles={["customer", "admin"]}>
                    <EditJobPage />
                  </ProtectedRoute>
                }
              />
              <Route path="jobs/:jobId" element={<JobDetailsPage />} />
              <Route path="search" element={<JobsSearchPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="chat/:conversationId" element={<ChatPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/categories"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminCategoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/jobs"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/reviews"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminReviewsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
