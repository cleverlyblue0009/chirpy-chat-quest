import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Assessment from "./pages/Assessment";
import LearningPath from "./pages/LearningPath";
import EnhancedLearningPath from "./pages/EnhancedLearningPath";
import BirdCollection from "./pages/BirdCollection";
import ConversationPractice from "./pages/ConversationPractice";
import StructuredLesson from "./pages/StructuredLesson";
import Achievements from "./pages/Achievements";
import ParentDashboard from "./pages/ParentDashboard";
import TherapistDashboard from "./pages/TherapistDashboard";
import MiniChallenge from "./pages/MiniChallenge";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute requiresAssessment>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/assessment" element={
              <ProtectedRoute requiresOnboarding>
                <Assessment />
              </ProtectedRoute>
            } />
            <Route path="/path" element={
              <ProtectedRoute requiresAssessment>
                <EnhancedLearningPath />
              </ProtectedRoute>
            } />
            <Route path="/birds" element={
              <ProtectedRoute requiresAssessment>
                <BirdCollection />
              </ProtectedRoute>
            } />
            <Route path="/achievements" element={
              <ProtectedRoute requiresAssessment>
                <Achievements />
              </ProtectedRoute>
            } />
            <Route path="/parent-dashboard" element={
              <ProtectedRoute requiresAssessment>
                <ParentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/therapist-dashboard" element={
              <ProtectedRoute requiresAssessment>
                <TherapistDashboard />
              </ProtectedRoute>
            } />
            <Route path="/conversation/:levelId" element={
              <ProtectedRoute requiresAssessment>
                <StructuredLesson />
              </ProtectedRoute>
            } />
            <Route path="/conversation-freeform/:levelId" element={
              <ProtectedRoute requiresAssessment>
                <ConversationPractice />
              </ProtectedRoute>
            } />
            <Route path="/mini-challenge" element={
              <ProtectedRoute requiresAssessment>
                <MiniChallenge />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
