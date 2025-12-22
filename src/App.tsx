import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Step1Assessment from "./pages/Step1Assessment";
import Step1Results from "./pages/Step1Results";
import MBTIAssessment from "./pages/MBTIAssessment";
import MBTIResults from "./pages/MBTIResults";
import DISCAssessment from "./pages/DISCAssessment";
import DISCResults from "./pages/DISCResults";
import AssessmentJourney from "./pages/AssessmentJourney";
import EmailCapture from "./pages/EmailCapture";
import FreeResults from "./pages/FreeResults";
import Paywall from "./pages/Paywall";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import FullAssessment from "./pages/FullAssessment";
import FullResults from "./pages/FullResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/assessment/step1" element={<Step1Assessment />} />
            <Route path="/assessment/step1/results" element={<Step1Results />} />
            <Route path="/assessment/mbti" element={<MBTIAssessment />} />
            <Route path="/assessment/mbti/results" element={<MBTIResults />} />
            <Route path="/assessment/disc" element={<DISCAssessment />} />
            <Route path="/assessment/disc/results" element={<DISCResults />} />
            <Route path="/history" element={<AssessmentJourney />} />
            <Route path="/email-capture" element={<EmailCapture />} />
            <Route path="/results/free" element={<FreeResults />} />
            <Route path="/paywall" element={<Paywall />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/assessment/full" element={<FullAssessment />} />
            <Route path="/results/full" element={<FullResults />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
