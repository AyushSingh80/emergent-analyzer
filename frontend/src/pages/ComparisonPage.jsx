import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  RefreshCw,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CHART_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#F43F5E",
  "#10B981",
  "#F59E0B",
];

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: LineChartIcon },
  { value: "area", label: "Area Chart", icon: AreaChartIcon },
  { value: "pie", label: "Pie Chart", icon: PieChartIcon },
];

export default function ComparisonPage() {
  const { sessionId } = useParams();
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Left panel state
  const [leftColumn, setLeftColumn] = useState("");
  const [leftChartType, setLeftChartType] = useState("bar");
  
  // Right panel state
  const [rightColumn, setRightColumn] = useState("");
  const [rightChartType, setRightChartType] = useState("bar");
  
  // Sync tooltips
  const [syncTooltips, setSyncTooltips] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [sessionId]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/session/${sessionId}/analytics`);
      setAnalytics(response.data.analytics);
      
      // Set default selections
      if (response.data.analytics.length >= 2) {
        setLeftColumn(response.data.analytics[0].column);
        setRightColumn(response.data.analytics[1].column);
      } else if (response.data.analytics.length === 1) {
        setLeftColumn(response.data.analytics[0].column);
        setRightColumn(response.data.analytics[0].column);
      }
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const getColumnData = (columnName) => {
    return analytics.find((col) => col.column === columnName);
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

  const renderChart = (columnData, chartType, side) => {
    if (!columnData) return null;
    
    const data = columnData.distribution || [];
    const color = side === "left" ? CHART_COLORS[0] : CHART_COLORS[1];

    if (data.length === 0) {
      return (
        <div className="h-[350px] flex items-center justify-center text-muted-foreground">
          No data available for visualization
        </div>
      );
    }

    const chartProps = {
      data,
      margin: { top: 20, right: 20, left: 0, bottom: 20 },
      ...(syncTooltips && { syncId: "comparison" }),
    };

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey={columnData.data_type === "numeric" ? "range" : "name"}
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
                angle={-45}
                textAnchor="end"
                height={80}
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
                name={columnData.column}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart {...chartProps}>
              <defs>
                <linearGradient id={`gradient-${side}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey={columnData.data_type === "numeric" ? "range" : "name"}
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
                angle={-45}
                textAnchor="end"
                height={80}
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
                name={columnData.column}
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${side})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data.slice(0, 8)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
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
          <ResponsiveContainer width="100%" height={350}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey={columnData.data_type === "numeric" ? "range" : "name"}
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={{ stroke: "#27272a" }}
                axisLine={{ stroke: "#27272a" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={columnData.data_type === "numeric" ? "count" : "value"}
                name={columnData.column}
                fill={color}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const swapCharts = () => {
    const tempCol = leftColumn;
    const tempType = leftChartType;
    setLeftColumn(rightColumn);
    setLeftChartType(rightChartType);
    setRightColumn(tempCol);
    setRightChartType(tempType);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid-lines flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const leftData = getColumnData(leftColumn);
  const rightData = getColumnData(rightColumn);

  return (
    <div className="min-h-screen grid-lines">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/dashboard/${sessionId}`}>
              <Button
                data-testid="back-to-dashboard"
                variant="ghost"
                size="icon"
                className="rounded-none border border-border/50 hover:border-primary/30"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </Link>
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
                Chart Comparison
              </p>
              <h1 className="font-heading font-bold text-lg tracking-tight uppercase">
                Compare Analytics
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="sync-tooltips"
                data-testid="sync-tooltips-toggle"
                checked={syncTooltips}
                onCheckedChange={setSyncTooltips}
              />
              <Label htmlFor="sync-tooltips" className="font-mono text-xs uppercase tracking-wider">
                Sync Tooltips
              </Label>
            </div>

            <Button
              data-testid="swap-charts-button"
              variant="outline"
              onClick={swapCharts}
              className="rounded-none font-mono text-xs uppercase tracking-wider border-border/50 hover:border-primary/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Swap
            </Button>
          </div>
        </div>
      </header>

      {/* Comparison Content */}
      <main className="p-4 md:p-6 lg:p-8">
        <div className="comparison-split">
          {/* Left Panel */}
          <Card className="bg-card/50 border-border/50 rounded-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <Select value={leftColumn} onValueChange={setLeftColumn}>
                  <SelectTrigger
                    data-testid="left-column-select"
                    className="w-[180px] rounded-none border-border/50 font-mono text-xs"
                  >
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                    {analytics.map((col) => (
                      <SelectItem
                        key={col.column}
                        value={col.column}
                        className="font-mono text-xs"
                      >
                        {col.column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={leftChartType} onValueChange={setLeftChartType}>
                  <SelectTrigger
                    data-testid="left-chart-type-select"
                    className="w-[140px] rounded-none border-border/50 font-mono text-xs"
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

              {leftData && (
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="outline"
                    className={`rounded-none text-[10px] uppercase tracking-wider ${
                      leftData.data_type === "numeric"
                        ? "border-chart-1/50 text-blue-400"
                        : "border-chart-2/50 text-violet-400"
                    }`}
                  >
                    {leftData.data_type}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {leftData.count.toLocaleString()} records
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderChart(leftData, leftChartType, "left")}

              {/* Stats */}
              {leftData && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/30">
                  {leftData.data_type === "numeric" ? (
                    <>
                      <ComparisonStat label="Mean" value={formatNumber(leftData.mean)} />
                      <ComparisonStat label="Median" value={formatNumber(leftData.median)} />
                      <ComparisonStat label="Std Dev" value={formatNumber(leftData.std_dev)} />
                    </>
                  ) : (
                    <>
                      <ComparisonStat label="Count" value={leftData.count} />
                      <ComparisonStat label="Unique" value={leftData.unique_count} />
                      <ComparisonStat label="Mode" value={leftData.mode || "N/A"} truncate />
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel */}
          <Card className="bg-card/50 border-border/50 rounded-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <Select value={rightColumn} onValueChange={setRightColumn}>
                  <SelectTrigger
                    data-testid="right-column-select"
                    className="w-[180px] rounded-none border-border/50 font-mono text-xs"
                  >
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                    {analytics.map((col) => (
                      <SelectItem
                        key={col.column}
                        value={col.column}
                        className="font-mono text-xs"
                      >
                        {col.column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={rightChartType} onValueChange={setRightChartType}>
                  <SelectTrigger
                    data-testid="right-chart-type-select"
                    className="w-[140px] rounded-none border-border/50 font-mono text-xs"
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

              {rightData && (
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="outline"
                    className={`rounded-none text-[10px] uppercase tracking-wider ${
                      rightData.data_type === "numeric"
                        ? "border-chart-1/50 text-blue-400"
                        : "border-chart-2/50 text-violet-400"
                    }`}
                  >
                    {rightData.data_type}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {rightData.count.toLocaleString()} records
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderChart(rightData, rightChartType, "right")}

              {/* Stats */}
              {rightData && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/30">
                  {rightData.data_type === "numeric" ? (
                    <>
                      <ComparisonStat label="Mean" value={formatNumber(rightData.mean)} />
                      <ComparisonStat label="Median" value={formatNumber(rightData.median)} />
                      <ComparisonStat label="Std Dev" value={formatNumber(rightData.std_dev)} />
                    </>
                  ) : (
                    <>
                      <ComparisonStat label="Count" value={rightData.count} />
                      <ComparisonStat label="Unique" value={rightData.unique_count} />
                      <ComparisonStat label="Mode" value={rightData.mode || "N/A"} truncate />
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ComparisonStat({ label, value, truncate = false }) {
  return (
    <div className="text-center">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={`font-mono text-base font-semibold ${
          truncate ? "truncate max-w-[100px] mx-auto" : ""
        }`}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}
