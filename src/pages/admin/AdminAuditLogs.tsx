import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { Search, User, Clock, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { refreshTrigger } = useRefreshTrigger();

  const loadAuditLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,actor_id,actor_email,user_id,action_type,entity,entity_id,details,created_at")
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
      setLogs([]);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAuditLogs();
  }, [refreshTrigger]);

  const filteredLogs = logs.filter((log) => {
    const searchText = `${log.action_type} ${log.entity} ${log.actor_email ?? log.actor_id ?? ""} ${log.entity_id ?? ""} ${JSON.stringify(log.details ?? {})}`.toLowerCase();
    return !search || searchText.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">
              Track moderator actions, payment events, and order changes in one place.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
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
                      <td className="px-4 py-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <div>
                            <div>{log.action_type.replace(/_/g, " ")}</div>
                            <div className="text-[11px] text-muted-foreground">{log.entity}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {log.actor_email || log.actor_id || "system"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {log.entity_id || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-pre-line">
                        {log.details ? JSON.stringify(log.details, null, 2) : "—"}
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
    </div>
  );
};

export default AdminAuditLogs;
