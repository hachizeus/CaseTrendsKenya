import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers(data || []);
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users ({users.length})</h1>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3 hidden sm:table-cell">Phone</th>
              <th className="text-left p-3 hidden md:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">
                  <p className="font-medium">{u.display_name || "—"}</p>
                </td>
                <td className="p-3 hidden sm:table-cell text-muted-foreground">{u.phone || "—"}</td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-muted-foreground text-center py-12">No users yet.</p>}
      </div>
    </div>
  );
};

export default AdminUsers;
