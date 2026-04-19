import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { 
  Search, 
  FileText, 
  Download, 
  Calendar, 
  X, 
  ChevronDown,
  Filter,
  AlertCircle,
  Clock,
  User,
  Target
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const auditLogsToCsv = (logs: any[]) => {
  const header = ["When", "Action", "Actor", "Target", "Details"];
  const rows = logs.map((log) => [
    new Date(log.created_at).toISOString(),
    log.action_type,
    log.actor_email || log.actor_id || "system",
    log.entity_id || "",
    formatDetails(log.details),
  ]);
  return [header, ...rows]
    .map((row) => row.map((value) => escapeCsv(String(value ?? ""))).join(","))
    .join("\n");
};

const downloadAuditLogsCsv = (logs: any[]) => {
  const csv = auditLogsToCsv(logs);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Custom badge variant function that returns className instead of using unsupported variants
const getActionBadgeClass = (action: string) => {
  const a = action?.toLowerCase() || "";
  if (a.includes("delete") || a.includes("cancel")) 
    return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
  if (a.includes("create") || a.includes("confirm")) 
    return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200";
  if (a.includes("update") || a.includes("change")) 
    return "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200";
  return "bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200";
};

const formatDetails = (details: any): string => {
  if (details == null) return "—";
  if (typeof details === "string") return details;
  if (Array.isArray(details)) return details.map((item) => formatDetails(item)).join(", ");
  if (typeof details === "object") {
    return Object.entries(details)
      .map(([key, value]) => {
        if (value == null) return `${key}: null`;
        if (typeof value === "object") return `${key}: ${JSON.stringify(value)}`;
        return `${key}: ${value}`;
      })
      .join(", ");
  }
  return String(details);
};

const formatRelativeTime = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
};

const MobileLogCard = ({ log }: { log: any }) => (
  <Card className="mb-3 last:mb-0">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Badge 
          variant="outline" 
          className={cn("font-medium", getActionBadgeClass(log.action_type))}
        >
          {log.action_type.replace(/_/g, " ")}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span title={new Date(log.created_at).toLocaleString()}>
            {formatRelativeTime(log.created_at)}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Actor</p>
            <p className="text-sm truncate">{log.actor_email || log.actor_id || "system"}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Target</p>
            {log.entity === "order" && log.entity_id ? (
              <Link to="/admin/orders" className="text-sm text-primary hover:underline truncate block">
                {log.entity_id}
              </Link>
            ) : (
              <p className="text-sm truncate">{log.entity_id || "—"}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Details</p>
            <p className="text-sm break-words">{formatDetails(log.details)}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { refreshTrigger } = useRefreshTrigger();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const serializeDateFilter = useCallback((value: string, endOfDay = false) => {
    if (!value) return null;
    const date = new Date(value);
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
  }, []);

  const loadAuditLogs = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const searchTerm = search.trim();

    let query = supabase
      .from("audit_logs")
      .select("id,actor_id,actor_email,user_id,action_type,entity,entity_id,details,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (searchTerm) {
      const term = `%${searchTerm}%`;
      query = query.or(
        `action_type.ilike.${term},entity.ilike.${term},actor_email.ilike.${term},entity_id.ilike.${term}`,
      );
    }

    const fromTimestamp = serializeDateFilter(fromDate);
    const toTimestamp = serializeDateFilter(toDate, true);

    if (fromTimestamp) {
      query = query.gte("created_at", fromTimestamp);
    }
    if (toTimestamp) {
      query = query.lte("created_at", toTimestamp);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
      if (!isLoadMore) {
        setLogs([]);
        setHasMore(false);
        setTotalCount(null);
      }
    } else {
      if (isLoadMore) {
        setLogs(prev => [...prev, ...(data || [])]);
      } else {
        setLogs(data || []);
      }
      setHasMore((data?.length || 0) >= PAGE_SIZE);
      if (count !== null) setTotalCount(count);
    }

    if (!isLoadMore) {
      setLoading(false);
    } else {
      setLoadingMore(false);
    }
  }, [page, search, fromDate, toDate, serializeDateFilter]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPage(0);
    }, 300);
  }, []);

  useEffect(() => {
    loadAuditLogs(false);
  }, [refreshTrigger, page, search, fromDate, toDate, loadAuditLogs]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await loadAuditLogs(true);
  };

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setSearch("");
    setPage(0);
    setShowFilters(false);
  };

  const hasActiveFilters = fromDate || toDate || search;

  const filteredLogs = useMemo(() => logs, [logs]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl">Audit Logs</CardTitle>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Track moderator actions, payment events, and order changes. 
                {totalCount !== null && (
                  <span className="ml-2 font-medium text-foreground">
                    {totalCount.toLocaleString()} total entries
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">•</Badge>
                )}
              </Button>
              
              <Button
                onClick={() => downloadAuditLogsCsv(filteredLogs)}
                disabled={filteredLogs.length === 0}
                size="sm"
                className="whitespace-nowrap"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by action, entity, actor, or target ID..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Filters - Desktop always visible, Mobile toggled */}
          <div className={`space-y-4 ${!showFilters ? 'hidden sm:block' : ''}`}>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPage(0);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPage(0);
                    }}
                    className="w-full"
                  />
                </div>
              </div>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="whitespace-nowrap"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  When
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Action
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                  Actor
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">
                  Target
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground font-medium">No audit logs found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <Badge 
                          variant="outline" 
                          className={cn("font-medium", getActionBadgeClass(log.action_type))}
                        >
                          {log.action_type.replace(/_/g, " ")}
                        </Badge>
                        <div className="text-xs text-muted-foreground">{log.entity}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      <span className="text-sm">{log.actor_email || log.actor_id || "system"}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {log.entity === "order" && log.entity_id ? (
                        <Link to="/admin/orders" className="text-primary hover:underline text-sm">
                          {log.entity_id}
                        </Link>
                      ) : (
                        <span className="text-sm">{log.entity_id || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left line-clamp-2">
                              {formatDetails(log.details)}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Details</h4>
                              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden p-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              {filteredLogs.map((log) => (
                <MobileLogCard key={log.id} log={log} />
              ))}
            </>
          )}
        </div>

        {/* Load More */}
        {!loading && hasMore && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <ChevronDown className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAuditLogs;