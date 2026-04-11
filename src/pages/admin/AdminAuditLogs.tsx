import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { Search, FileText, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

const getActionColor = (action: string) => {
  const a = action?.toLowerCase() || "";
  if (a.includes("delete") || a.includes("cancel")) return "text-red-600 bg-red-50";
  if (a.includes("create") || a.includes("confirm")) return "text-emerald-600 bg-emerald-50";
  if (a.includes("update") || a.includes("change")) return "text-amber-600 bg-amber-50";
  return "text-slate-600 bg-slate-50";
};

const formatDetails = (details: any) => {
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

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { refreshTrigger } = useRefreshTrigger();

  const serializeDateFilter = (value: string, endOfDay = false) => {
    if (!value) return null;
    const date = new Date(value);
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
  };

  const loadAuditLogs = async () => {
    setLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const searchTerm = search.trim();

    let query = supabase
      .from("audit_logs")
      .select("id,actor_id,actor_email,user_id,action_type,entity,entity_id,details,created_at")
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

    const { data, error } = await query;

    if (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
      setLogs([]);
      setHasMore(false);
    } else {
      setLogs(data || []);
      setHasMore((data?.length || 0) >= PAGE_SIZE);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAuditLogs();
  }, [refreshTrigger, page, search, fromDate, toDate]);

  const filteredLogs = useMemo(() => logs, [logs]);

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <div>
            <h1 className="text-xl font-bold">Audit Logs</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Track moderator actions, payment events, and order changes in one place. Choose a date range and download filtered logs anytime.
            </p>
          </div>
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <label className="flex flex-col text-xs text-muted-foreground">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="flex flex-col text-xs text-muted-foreground">
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setPage(0);
            }}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear dates
          </button>
          <button
            type="button"
            onClick={() => downloadAuditLogsCsv(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">When</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Actor</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Target</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4"><div className="h-3 bg-secondary rounded animate-pulse" /></td>
                      <td className="px-4 py-4 hidden md:table-cell"><div className="h-3 bg-secondary rounded animate-pulse" /></td>
                      <td className="px-4 py-4"><div className="h-3 bg-secondary rounded animate-pulse" /></td>
                      <td className="px-4 py-4 hidden lg:table-cell"><div className="h-3 bg-secondary rounded animate-pulse" /></td>
                      <td className="px-4 py-4"><div className="h-3 bg-secondary rounded animate-pulse" /></td>
                    </tr>
                  ))
                : filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-primary mt-0.5" />
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getActionColor(log.action_type)}`}>
                              {log.action_type.replace(/_/g, " ")}
                            </span>
                            <div className="text-[11px] text-muted-foreground">{log.entity}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {log.actor_email || log.actor_id || "system"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {log.entity === "order" && log.entity_id ? (
                          <Link to="/admin/orders" className="text-primary hover:underline">
                            {log.entity_id}
                          </Link>
                        ) : (
                          log.entity_id || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate hover:whitespace-normal transition-all">
                        {formatDetails(log.details)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!loading && filteredLogs.length === 0 && (
          <p className="text-muted-foreground text-center py-12 text-sm">
            No audit log entries match your current search.
          </p>
        )}
      </div>
      {!loading && hasMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
