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
    return "bg-red-500/20 text-red-400 border-red-500/30";
  if (a.includes("create") || a.includes("confirm")) 
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (a.includes("update") || a.includes("change")) 
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-white/10 text-white/70 border-white/20";
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
  <Card className="mb-3 last:mb-0 bg-white/5 border-white/10">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Badge 
          variant="outline" 
          className={cn("font-medium", getActionBadgeClass(log.action_type))}
        >
          {log.action_type.replace(/_/g, " ")}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-white/40">
          <Clock className="w-3 h-3" />
          <span title={new Date(log.created_at).toLocaleString()}>
            {formatRelativeTime(log.created_at)}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40">Actor</p>
            <p className="text-sm text-white/80 truncate">{log.actor_email || log.actor_id || "system"}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40">Target</p>
            {log.entity === "order" && log.entity_id ? (
              <Link to="/admin/orders" className="text-sm text-primary hover:underline truncate block">
                {log.entity_id}
              </Link>
            ) : (
              <p className="text-sm text-white/80 truncate">{log.entity_id || "—"}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40">Details</p>
            <p className="text-sm text-white/70 break-words">{formatDetails(log.details)}</p>
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
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl text-white">Audit Logs</CardTitle>
              <p className="text-sm text-white/50 max-w-2xl">
                Track moderator actions, payment events, and order changes. 
                {totalCount !== null && (
                  <span className="ml-2 font-medium text-white/70">
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
                className="sm:hidden border-white/10 text-white hover:bg-white/10"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">•</Badge>
                )}
              </Button>
              
              <Button
                onClick={() => downloadAuditLogsCsv(filteredLogs)}
                disabled={filteredLogs.length === 0}
                size="sm"
                className="whitespace-nowrap bg-primary text-white hover:bg-primary/80"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search by action, entity, actor, or target ID..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10 bg-black/30 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
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
                  <label className="text-xs text-white/50 flex items-center gap-1">
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
                    className="w-full bg-black/30 border-white/10 text-white focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/50 flex items-center gap-1">
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
                    className="w-full bg-black/30 border-white/10 text-white focus:border-primary/50"
                  />
                </div>
              </div>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="whitespace-nowrap text-white/60 hover:text-white hover:bg-white/10"
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
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50 whitespace-nowrap">
                  When
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">
                  Action
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50 hidden md:table-cell">
                  Actor
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50 hidden lg:table-cell">
                  Target
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-24 bg-white/10" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-20 bg-white/10" />
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <Skeleton className="h-4 w-32 bg-white/10" />
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <Skeleton className="h-4 w-24 bg-white/10" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-40 bg-white/10" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <AlertCircle className="w-12 h-12 text-white/30 mb-3" />
                      <p className="text-white/50 font-medium">No audit logs found</p>
                      <p className="text-sm text-white/30 mt-1">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-white/80">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-white/40">
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
                        <div className="text-xs text-white/40">{log.entity}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/60 hidden md:table-cell">
                      <span className="text-sm">{log.actor_email || log.actor_id || "system"}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {log.entity === "order" && log.entity_id ? (
                        <Link to="/admin/orders" className="text-primary hover:underline text-sm">
                          {log.entity_id}
                        </Link>
                      ) : (
                        <span className="text-sm text-white/60">{log.entity_id || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-xs text-white/50 hover:text-white/80 transition-colors text-left line-clamp-2">
                              {formatDetails(log.details)}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-4 bg-[hsl(240,10%,6%)] border-white/10">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-white">Details</h4>
                              <pre className="text-xs bg-black/30 text-white/80 p-3 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
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
                <Card key={index} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-24 bg-white/10 mb-3" />
                    <Skeleton className="h-4 w-full bg-white/10 mb-2" />
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="w-12 h-12 text-white/30 mb-3" />
              <p className="text-white/50 font-medium">No audit logs found</p>
              <p className="text-sm text-white/30 mt-1">
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
          <div className="p-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full border-white/10 text-white hover:bg-white/10"
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