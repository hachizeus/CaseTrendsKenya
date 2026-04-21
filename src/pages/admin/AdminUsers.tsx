import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { useAuth } from "@/contexts/AuthContext";
import { Search, User, Loader, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logAuditAction } from "@/lib/audit";
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
  const { user } = useAuth();
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
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const { data: profiles, error: profilesError } = profilesResult;
      const { data: allRoles, error: rolesError } = rolesResult;

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (rolesError) {
        console.error("Error loading roles:", rolesError);
      }

      const rolesByUserId = new Map<string, string[]>();
      (allRoles || []).forEach((role: any) => {
        const userRoles = rolesByUserId.get(role.user_id) || [];
        userRoles.push(role.role);
        rolesByUserId.set(role.user_id, userRoles);
      });

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile: any) => ({
        ...profile,
        roles: rolesByUserId.get(profile.user_id) || [],
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

      if (currentRole !== newRole) {
        const userRoles: any = supabase.from("user_roles" as any);

        const { error: deleteError } = await userRoles
          .delete()
          .eq("user_id", userId);

        if (deleteError) throw deleteError;

        if (newRole !== "none") {
          const { error: insertError } = await userRoles.insert(
            { user_id: userId, role: newRole },
          );

          if (insertError) throw insertError;
        }
      }

      await loadUsersWithRoles();
      await logAuditAction({
        action_type: "user_role_updated",
        entity: "user_roles",
        entity_id: userId,
        details: { old_role: currentRole || "none", new_role: newRole },
        user_id: userId,
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
      });
      toast({ title: "Success", description: `User role updated to ${newRole}` });
    } catch (err: any) {
      console.error("Error updating role:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
      await loadUsersWithRoles();
    } finally {
      setUpdatingRole(null);
    }
  };

  const deleteUser = async (userId: string, displayName: string) => {
    if (!confirm(`Delete user "${displayName}"? This will remove their profile and roles, but they may still be able to sign in.`)) return;

    try {
      // Delete from user_roles first (due to foreign key constraints)
      const { error: rolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      // Delete from profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (profileError) throw profileError;

      await loadUsersWithRoles();
      await logAuditAction({
        action_type: "user_deleted",
        entity: "users",
        entity_id: userId,
        details: { display_name: displayName },
        user_id: userId,
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
      });
      toast({ title: "Success", description: `User "${displayName}" deleted` });
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filtered = users.filter(u =>
    !search ||
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").includes(search)
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
              <th className="text-right px-4 py-3"></th>
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
                <td className="px-4 py-3 text-right"><div className="h-3 bg-secondary rounded w-8 animate-pulse" /></td>
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
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteUser(u.user_id, u.display_name || "Unknown")} className="p-1.5 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
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
