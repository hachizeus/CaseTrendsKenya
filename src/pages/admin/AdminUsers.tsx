import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { Search, User, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UserWithRole extends Record<string, any> {
  id: string;
  user_id: string;
  display_name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  roles: string[];
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const { refreshTrigger } = useRefreshTrigger();

  useEffect(() => {
    loadUsersWithRoles();
  }, [refreshTrigger]);

  const loadUsersWithRoles = async () => {
    setLoading(true);
    try {
      // First, fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Then fetch all user roles with type bypass
      const { data: allRoles, error: rolesError } = await (supabase
        .from("user_roles" as any)
        .select("user_id, role")
        .order("user_id") as any);

      if (rolesError) {
        console.error("Error loading roles:", rolesError);
        // Continue without roles if fetch fails
      }

      // Combine profiles with their roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        ...profile,
        roles: (allRoles || [])
          .filter((r: any) => r.user_id === profile.user_id)
          .map((r: any) => r.role),
      }));

      setUsers(usersWithRoles);
    } catch (err) {
      console.error("Error in loadUsersWithRoles:", err);
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const currentUser = users.find((u) => u.user_id === userId);
      const currentRole = (currentUser?.roles || [])[0];

      // If role is different, update it
      if (currentRole !== newRole) {
        // Delete old role if exists
        if (currentRole) {
          const { error: deleteError } = await (supabase
            .from("user_roles" as any)
            .delete()
            .eq("user_id", userId)
            .eq("role", currentRole) as any);

          if (deleteError) throw deleteError;
        }

        // Insert new role
        if (newRole !== "none") {
          const { error: insertError } = await (supabase
            .from("user_roles" as any)
            .insert([{ user_id: userId, role: newRole }]) as any);

          if (insertError) throw insertError;
        }
      }

      // Refresh the user list
      await loadUsersWithRoles();
      toast({ title: "Success", description: `User role updated to ${newRole}` });
    } catch (err: any) {
      console.error("Error updating role:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
      // Refresh to show actual state
      await loadUsersWithRoles();
    } finally {
      setUpdatingRole(null);
    }
  };

  const filtered = users.filter(u =>
    !search || (u.display_name || "").toLowerCase().includes(search.toLowerCase()) || (u.phone || "").includes(search)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} registered users</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Phone</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-secondary animate-pulse" /><div className="h-3 bg-secondary rounded w-32 animate-pulse" /></div></td>
                <td className="px-4 py-3 hidden sm:table-cell"><div className="h-3 bg-secondary rounded w-40 animate-pulse" /></td>
                <td className="px-4 py-3 hidden md:table-cell"><div className="h-3 bg-secondary rounded w-24 animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-3 bg-secondary rounded w-20 animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-3 bg-secondary rounded w-16 animate-pulse" /></td>
              </tr>
            )) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 border border-border flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{u.display_name || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs break-all">{u.email || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.phone || "—"}</td>
                <td className="px-4 py-3">
                  <Select
                    value={u.roles?.[0] || "none"}
                    onValueChange={(value) => handleRoleChange(u.user_id, value)}
                    disabled={updatingRole === u.user_id}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      {updatingRole === u.user_id ? (
                        <Loader className="w-3 h-3 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-12 text-sm">{search ? "No users match your search." : "No users yet."}</p>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
