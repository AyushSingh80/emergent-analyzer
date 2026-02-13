import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Database, BarChart3, ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error("Please enter a webhook URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/fetch-data`, { url });
      const { session_id, row_count, columns } = response.data;
      
      toast.success(`Loaded ${row_count} rows with ${columns.length} columns`);
      navigate(`/preview/${session_id}`);
    } catch (error) {
      console.error("Fetch error:", error);
      const message = error.response?.data?.detail || "Failed to fetch data from URL";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-lines">
      {/* Hero Section */}
      <div className="hero-gradient min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 md:p-8 lg:p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight uppercase">
              Data Terminal
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          <div className="w-full max-w-3xl space-y-12 animate-fade-in-up">
            {/* Title */}
            <div className="text-center space-y-4">
              <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
                Advanced Analytics Platform
              </p>
              <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase">
                Data Intelligence
                <br />
                <span className="text-primary">Terminal</span>
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
                Transform any JSON webhook into powerful analytics. 
                Visualize, analyze, and compare your data in seconds.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-primary text-sm">
                  {">>"}
                </div>
                <Input
                  data-testid="webhook-url-input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter webhook URL..."
                  className="w-full h-14 md:h-16 pl-12 pr-4 bg-black/50 border-b-2 border-border hover:border-primary/50 focus:border-primary rounded-none font-mono text-base md:text-lg placeholder:text-muted-foreground/50 transition-colors"
                  disabled={loading}
                />
              </div>

              <Button
                data-testid="analyze-button"
                type="submit"
                disabled={loading}
                className="w-full h-12 md:h-14 rounded-none font-mono uppercase tracking-wider text-sm md:text-base bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/50 hover:neon-glow transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Data...
                  </>
                ) : (
                  <>
                    Initialize Analysis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
              <FeatureCard
                icon={<Zap className="w-5 h-5" strokeWidth={1.5} />}
                title="Real-time Processing"
                description="Instant analytics on any JSON data source"
              />
              <FeatureCard
                icon={<BarChart3 className="w-5 h-5" strokeWidth={1.5} />}
                title="Advanced Charts"
                description="Multiple visualization options with Recharts"
              />
              <FeatureCard
                icon={<TrendingUp className="w-5 h-5" strokeWidth={1.5} />}
                title="Deep Insights"
                description="Statistical analysis and comparisons"
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 md:p-8 border-t border-border/50">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>v1.0.0</span>
            <span className="flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Secure Data Processing
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 bg-card/50 border border-border/50 hover:border-primary/30 transition-colors card-hover">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-primary">{icon}</div>
        <h3 className="font-heading font-bold text-sm uppercase tracking-tight">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
