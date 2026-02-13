import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompare,
  Hash,
  Layers,
  Activity,
  Target,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  AreaChartIcon,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CHART_COLORS = [
  "#3B82F6", // primary blue
  "#8B5CF6", // accent violet
  "#F43F5E", // secondary rose
  "#10B981", // success green
  "#F59E0B", // warning amber
];

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: LineChartIcon },
  { value: "area", label: "Area Chart", icon: AreaChartIcon },
  { value: "pie", label: "Pie Chart", icon: PieChartIcon },
];

export default function DashboardPage() {
  const { sessionId } = useParams();
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartTypes, setChartTypes] = useState({});

  useEffect(() => {
    fetchAnalytics();
  }, [sessionId]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/session/${sessionId}/analytics`);
      setAnalytics(response.data.analytics);
      
      // Set default chart types based on data type
      const defaultTypes = {};
      response.data.analytics.forEach((col) => {
        defaultTypes[col.column] = col.data_type === "numeric" ? "bar" : "pie";
      });
      setChartTypes(defaultTypes);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const setChartType = (column, type) => {
    setChartTypes((prev) => ({ ...prev, [column]: type }));
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "N/A";
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(2) + "M";
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(2) + "K";
    return Number(num).toFixed(2);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="text-muted-foreground mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = (columnData) => {
    const chartType = chartTypes[columnData.column] || "bar";
    const data = columnData.distribution || [];

    if (data.length === 0) {
      return (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          No data available for visualization
        </div>
      );
    }

    const chartProps = {
      data,
      margin: { top: 10, right: 10, left: -10, bottom: 0 },
    };

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey={columnData.data_type === "numeric" ? "range" : "name"}
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={columnData.data_type === "numeric" ? "count" : "value"}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[0], strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: CHART_COLORS[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart {...chartProps}>
              <defs>
                <linearGradient id={`gradient-${columnData.column}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey={columnData.data_type === "numeric" ? "range" : "name"}
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={columnData.data_type === "numeric" ? "count" : "value"}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                fill={`url(#gradient-${columnData.column})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.slice(0, 8)}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey={columnData.data_type === "numeric" ? "count" : "value"}
                nameKey={columnData.data_type === "numeric" ? "range" : "name"}
              >
                {data.slice(0, 8).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default: // bar
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey={columnData.data_type === "numeric" ? "range" : "name"}
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={columnData.data_type === "numeric" ? "count" : "value"}
                fill={CHART_COLORS[0]}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid-lines flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-lines">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/preview/${sessionId}`}>
              <Button
                data-testid="back-to-preview"
                variant="ghost"
                size="icon"
                className="rounded-none border border-border/50 hover:border-primary/30"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </Link>
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
                Analytics Dashboard
              </p>
              <h1 className="font-heading font-bold text-lg tracking-tight uppercase">
                {analytics.length} Columns Analyzed
              </h1>
            </div>
          </div>

          <Link to={`/compare/${sessionId}`}>
            <Button
              data-testid="compare-charts-button"
              className="rounded-none font-mono uppercase tracking-wider text-xs bg-secondary hover:bg-secondary/90 border border-secondary/50 hover:neon-glow-secondary transition-all"
            >
              <GitCompare className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Compare Charts
            </Button>
          </Link>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="p-4 md:p-6 lg:p-8">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {analytics.slice(0, 4).map((col, idx) => (
            <KPICard key={col.column} data={col} index={idx} formatNumber={formatNumber} />
          ))}
        </div>

        {/* Charts Grid - Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {analytics.map((columnData, idx) => (
            <Card
              key={columnData.column}
              data-testid={`chart-card-${columnData.column}`}
              className="bg-card/50 border-border/50 rounded-sm hover:border-primary/30 transition-colors stat-card"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`rounded-none text-[10px] uppercase tracking-wider ${
                        columnData.data_type === "numeric"
                          ? "border-chart-1/50 text-blue-400"
                          : "border-chart-2/50 text-violet-400"
                      }`}
                    >
                      {columnData.data_type}
                    </Badge>
                    <CardTitle className="font-heading text-sm uppercase tracking-tight">
                      {columnData.column}
                    </CardTitle>
                  </div>
                  <Select
                    value={chartTypes[columnData.column] || "bar"}
                    onValueChange={(value) => setChartType(columnData.column, value)}
                  >
                    <SelectTrigger
                      data-testid={`chart-type-select-${columnData.column}`}
                      className="w-[120px] h-8 rounded-none border-border/50 font-mono text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                      {CHART_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="font-mono text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <type.icon className="w-3 h-3" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="chart-container">
                {renderChart(columnData)}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/30">
                  {columnData.data_type === "numeric" ? (
                    <>
                      <StatItem label="Mean" value={formatNumber(columnData.mean)} />
                      <StatItem label="Median" value={formatNumber(columnData.median)} />
                      <StatItem label="Std Dev" value={formatNumber(columnData.std_dev)} />
                      <StatItem label="Min" value={formatNumber(columnData.min_val)} />
                      <StatItem label="Max" value={formatNumber(columnData.max_val)} />
                      <StatItem label="Sum" value={formatNumber(columnData.sum)} />
                    </>
                  ) : (
                    <>
                      <StatItem label="Count" value={columnData.count} />
                      <StatItem label="Unique" value={columnData.unique_count} />
                      <StatItem label="Mode" value={columnData.mode || "N/A"} truncate />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function KPICard({ data, index, formatNumber }) {
  const isNumeric = data.data_type === "numeric";
  const value = isNumeric ? data.mean : data.unique_count;
  const label = isNumeric ? "Average" : "Unique Values";
  
  const icons = [TrendingUp, Target, Activity, Layers];
  const Icon = icons[index % icons.length];

  return (
    <Card className="bg-card/50 border-border/50 rounded-sm hover:border-primary/30 transition-colors stat-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {data.column}
            </p>
            <p className="font-heading font-black text-2xl tracking-tight">
              {isNumeric ? formatNumber(value) : value}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              {label}
            </p>
          </div>
          <div
            className="p-2 rounded-sm"
            style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}20` }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}
              strokeWidth={1.5}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value, truncate = false }) {
  return (
    <div className="text-center">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </p>
      <p
        className={`font-mono text-sm font-semibold ${
          truncate ? "truncate max-w-[80px] mx-auto" : ""
        }`}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}
