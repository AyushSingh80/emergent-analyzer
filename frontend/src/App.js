import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import DataPreviewPage from "@/pages/DataPreviewPage";
import DashboardPage from "@/pages/DashboardPage";
import ComparisonPage from "@/pages/ComparisonPage";

function App() {
  return (
    <div className="App min-h-screen bg-background noise-overlay">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/preview/:sessionId" element={<DataPreviewPage />} />
          <Route path="/dashboard/:sessionId" element={<DashboardPage />} />
          <Route path="/compare/:sessionId" element={<ComparisonPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(18, 18, 18, 0.95)',
            border: '1px solid rgba(39, 39, 42, 0.5)',
            color: '#EDEDED',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
}

export default App;
