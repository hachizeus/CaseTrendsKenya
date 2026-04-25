// @ts-nocheck
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { useAuth } from "@/contexts/AuthContext";
import { Search, User, Loader, Trash2, Mail, Phone, Calendar, Shield } from "lucide-react";
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
      const { error: rolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

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

  const MobileUserCard = ({ userItem }: { userItem: UserWithRole }) => (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-white">{userItem.display_name || "—"}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-white/40" />
              <Select
                value={userItem.roles?.[0] || "none"}
                onValueChange={(value) => handleRoleChange(userItem.user_id, value)}
                disabled={updatingRole === userItem.user_id}
              >
                <SelectTrigger className="w-20 h-7 text-xs bg-white/5 border-white/10 text-white">
                  {updatingRole === userItem.user_id ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-[hsl(240,10%,6%)] border-white/10">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <button 
          onClick={() => deleteUser(userItem.user_id, userItem.display_name || "Unknown")} 
          className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {userItem.email && (
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-white/30" />
          <p className="text-xs text-white/60 break-all">{userItem.email}</p>
        </div>
      )}
      
      {userItem.phone && (
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-white/30" />
          <p className="text-xs text-white/60">{userItem.phone}</p>
        </div>
      )}
      
      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        <Calendar className="w-3.5 h-3.5 text-white/30" />
        <p className="text-xs text-white/40">Joined {new Date(userItem.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Users
          </h1>
        </div>
        <p className="text-sm text-white/50 ml-3">{users.length} registered users</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input 
          placeholder="Search by name, email, or phone..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/10 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">User</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Joined</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 bg-white/10 rounded w-32 animate-pulse" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-3 bg-white/10 rounded w-40 animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-white/10 rounded w-24 animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-white/10 rounded w-20 animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-white/10 rounded w-16 animate-pulse" /></td>
                    <td className="px-4 py-3 text-right"><div className="h-3 bg-white/10 rounded w-8 animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-white">{u.display_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs break-all">{u.email || "—"}</td>
                    <td className="px-4 py-3 text-white/50">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.roles?.[0] || "none"}
                        onValueChange={(value) => handleRoleChange(u.user_id, value)}
                        disabled={updatingRole === u.user_id}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs bg-white/5 border-white/10 text-white">
                          {updatingRole === u.user_id ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent className="bg-[hsl(240,10%,6%)] border-white/10">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => deleteUser(u.user_id, u.display_name || "Unknown")} 
                        className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-3">
              <User className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50 font-medium">
              {search ? "No users match your search." : "No users yet."}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-24 mb-1" />
                  <div className="h-3 bg-white/10 rounded w-16" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-3">
              <User className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50 font-medium">
              {search ? "No users match your search." : "No users yet."}
            </p>
          </div>
        ) : (
          filtered.map((userItem) => <MobileUserCard key={userItem.id} userItem={userItem} />)
        )}
      </div>
    </div>
  );
};

export default AdminUsers;