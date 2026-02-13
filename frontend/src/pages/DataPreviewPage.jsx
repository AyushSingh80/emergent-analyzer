import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Database,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Columns,
  Hash,
  Type,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DataPreviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, page]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API}/session/${sessionId}`);
      setSession(response.data);
      setVisibleColumns(response.data.columns);
    } catch (error) {
      console.error("Session fetch error:", error);
      toast.error("Failed to load session");
      navigate("/");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/session/${sessionId}/data`, {
        params: { page, page_size: 50 }
      });
      setData(response.data.data);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error("Data fetch error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const toggleVisibleColumn = (column) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const handleAnalyze = async () => {
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column to analyze");
      return;
    }

    setAnalyzing(true);
    try {
      await axios.post(`${API}/analyze`, {
        session_id: sessionId,
        columns: selectedColumns,
      });
      toast.success("Analysis complete!");
      navigate(`/dashboard/${sessionId}`);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze data");
    } finally {
      setAnalyzing(false);
    }
  };

  const getColumnIcon = (type) => {
    switch (type) {
      case "numeric":
        return <Hash className="w-3 h-3" strokeWidth={1.5} />;
      case "date":
        return <Calendar className="w-3 h-3" strokeWidth={1.5} />;
      default:
        return <Type className="w-3 h-3" strokeWidth={1.5} />;
    }
  };

  const getColumnBadgeColor = (type) => {
    switch (type) {
      case "numeric":
        return "bg-chart-1/20 text-blue-400 border-chart-1/30";
      case "date":
        return "bg-chart-4/20 text-emerald-400 border-chart-4/30";
      default:
        return "bg-chart-2/20 text-violet-400 border-chart-2/30";
    }
  };

  if (!session) {
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
            <Link to="/">
              <Button
                data-testid="back-to-home"
                variant="ghost"
                size="icon"
                className="rounded-none border border-border/50 hover:border-primary/30"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </Link>
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
                Data Preview
              </p>
              <h1 className="font-heading font-bold text-lg tracking-tight uppercase">
                {session.row_count.toLocaleString()} Records
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Column Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid="column-visibility-dropdown"
                  variant="outline"
                  className="rounded-none font-mono text-xs uppercase tracking-wider border-border/50 hover:border-primary/30"
                >
                  <Columns className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-popover/95 backdrop-blur-xl border-border/50"
              >
                {session.columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column}
                    checked={visibleColumns.includes(column)}
                    onCheckedChange={() => toggleVisibleColumn(column)}
                    className="font-mono text-xs"
                  >
                    {column}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Analyze Button */}
            <Button
              data-testid="analyze-selected-button"
              onClick={handleAnalyze}
              disabled={selectedColumns.length === 0 || analyzing}
              className="rounded-none font-mono uppercase tracking-wider text-xs bg-primary hover:bg-primary/90 border border-primary/50 hover:neon-glow transition-all"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Analyze ({selectedColumns.length})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Column Selection Bar */}
        <div className="px-4 md:px-6 pb-4">
          <p className="font-mono text-xs text-muted-foreground mb-3">
            SELECT COLUMNS FOR ANALYSIS:
          </p>
          <div className="flex flex-wrap gap-2">
            {session.columns.map((column) => {
              const type = session.column_types[column];
              const isSelected = selectedColumns.includes(column);
              return (
                <button
                  key={column}
                  data-testid={`column-select-${column}`}
                  onClick={() => toggleColumn(column)}
                  className={`column-badge inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-mono transition-all ${
                    isSelected
                      ? "bg-primary/20 border-primary text-primary-foreground"
                      : `${getColumnBadgeColor(type)} hover:border-primary/50`
                  }`}
                >
                  {getColumnIcon(type)}
                  {column}
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Data Table */}
      <main className="p-4 md:p-6">
        <div className="data-table-container bg-card/30 border border-border/50 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-xl">
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="w-12 font-mono text-xs uppercase text-muted-foreground">
                    #
                  </TableHead>
                  {visibleColumns.map((column) => (
                    <TableHead
                      key={column}
                      className="font-mono text-xs uppercase text-muted-foreground whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        {getColumnIcon(session.column_types[column])}
                        {column}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/30">
                      <TableCell colSpan={visibleColumns.length + 1}>
                        <div className="h-8 skeleton-shimmer rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  data.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {(page - 1) * 50 + idx + 1}
                      </TableCell>
                      {visibleColumns.map((column) => (
                        <TableCell
                          key={column}
                          className="font-mono text-sm max-w-[200px] truncate"
                        >
                          {row[column] !== null && row[column] !== undefined
                            ? String(row[column])
                            : <span className="text-muted-foreground/50">null</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border/50 bg-card/50">
            <p className="font-mono text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                data-testid="prev-page-button"
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="rounded-none border-border/50 hover:border-primary/30"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button
                data-testid="next-page-button"
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="rounded-none border-border/50 hover:border-primary/30"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
