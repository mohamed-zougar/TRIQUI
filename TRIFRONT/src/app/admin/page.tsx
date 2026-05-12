"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
  Users, 
  Package, 
  Truck, 
  TrendingUp, 
  CheckCircle, 
  Activity,
  Trash2,
  Mail,
  Calendar,
  ShieldCheck,
  User,
  Phone
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ApiError, adminApi, postsApi, type UserProfile, type ClientPost, type ShipperPost } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { ClientPostCard, ShipperPostCard } from "@/components/posts/PostCard";

interface Stats {
  totalUsers: number;
  totalClientPosts: number;
  totalShipperPosts: number;
  postsToday: number;
  verifiedUsers: number;
  activityRate: string;
}

export default function AdminPage() {
  const { user, isReady } = useRequireAuth();
  const isAdmin = user?.role === "admin";

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clientPosts, setClientPosts] = useState<ClientPost[]>([]);
  const [shipperPosts, setShipperPosts] = useState<ShipperPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | number | null }>({
    open: false,
    userId: null,
  });
  const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [statsData, usersData, cPosts, sPosts] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers(),
        postsApi.listClient(),
        postsApi.listShipper()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setClientPosts(cPosts);
      setShipperPosts(sPosts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load admin data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isReady && isAdmin) {
      loadData();
    }
  }, [isReady, isAdmin, loadData]);

  const handleDeleteUser = async (userId: string | number) => {
    setDeleteDialog({ open: true, userId });
  };

  const confirmDeleteUser = async () => {
    const userId = deleteDialog.userId;
    if (!userId) return;

    setDeleteLoading(userId);
    setDeleteMessage(null);
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev) =>
        prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : null
      );
      setDeleteDialog({ open: false, userId: null });
      setDeleteMessage({
        type: "success",
        text: "User deleted successfully.",
      });
      setTimeout(() => setDeleteMessage(null), 3000);
    } catch (err) {
      setDeleteMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Failed to delete user. Please try again.",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handlePostDelete = async (type: "client" | "shipper", id: number) => {
    try {
      if (type === "client") {
        await postsApi.deleteClient(id);
        setClientPosts(prev => prev.filter(p => p.id !== id));
      } else {
        await postsApi.deleteShipper(id);
        setShipperPosts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  if (!isReady || isLoading) {
    return (
      <AppShell user={user}>
        <div className="container-app py-10">
          <div className="animate-pulse space-y-8">
            <div className="h-20 w-1/3 bg-gray-200 rounded-xl mx-auto md:mx-0" />
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell user={user}>
        <div className="container-app py-20 text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
        </div>
      </AppShell>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Client Posts", value: stats?.totalClientPosts, icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Shipper Posts", value: stats?.totalShipperPosts, icon: Truck, color: "text-green-600", bg: "bg-green-50" },
    { label: "Posts Today", value: stats?.postsToday, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Verified Users", value: stats?.verifiedUsers, icon: CheckCircle, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Activity Rate", value: stats?.activityRate, icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <AppShell user={user}>
      <div className="w-full flex justify-center">
        <div className="container-app py-6 sm:py-10 pb-24 w-full">
          <PageHeader 
            title="Admin Dashboard" 
            description="Manage platform users and view real-time statistics."
          />

          {error && <Alert tone="error" className="mt-6">{error}</Alert>}

          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 w-full">
            {statCards.map((stat, i) => (
              <Card key={i} className="p-4 flex flex-col items-center text-center justify-center space-y-2 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <div className={cn("p-2 sm:p-3 rounded-2xl", stat.bg, stat.color)}>
                  <stat.icon size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value ?? 0}</p>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Users Management */}
          <div className="mt-10 w-full">
            <div className="flex items-center justify-between mb-6 px-2 sm:px-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="text-[var(--color-brand-500)]" size={24} />
                User Management
              </h2>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">
                {users.length} users
              </span>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">User</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Type</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Joined</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[var(--color-brand-50)] flex items-center justify-center text-[var(--color-brand-600)] font-bold text-sm overflow-hidden border border-gray-100">
                            {u.profilePictureUrl ? (
                              <img src={u.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span>{u.firstName?.[0]?.toUpperCase()}{u.lastName?.[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{u.firstName} {u.lastName}</span>
                            <span className="text-xs text-gray-500">ID: #{u.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            {u.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone size={14} className="text-gray-400" />
                            {u.phone || "No phone"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize",
                          u.accountType === "enterprise" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {u.accountType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {u.role === "admin" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                              <ShieldCheck size={12} /> Admin
                            </span>
                          )}
                          {u.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                              <CheckCircle size={12} /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400">
                              <Activity size={12} /> Unverified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(u.created_at as string).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                            onClick={() => handleDeleteUser(u.id)}
                            isLoading={deleteLoading === u.id}
                          >
                            <Trash2 size={18} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile User Card List */}
            <div className="grid grid-cols-1 gap-4 md:hidden px-2 w-full max-w-md mx-auto">
              {users.map((u) => (
                <Card key={u.id} className="p-4 border-gray-100 shadow-sm relative w-full">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[var(--color-brand-50)] flex items-center justify-center text-[var(--color-brand-600)] font-bold text-base overflow-hidden border border-gray-100">
                        {u.profilePictureUrl ? (
                          <img src={u.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{u.firstName?.[0]?.toUpperCase()}{u.lastName?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-lg leading-tight">{u.firstName} {u.lastName}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            u.accountType === "enterprise" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {u.accountType}
                          </span>
                          {u.role === "admin" && (
                            <span className="text-amber-600 font-bold text-[10px] flex items-center gap-0.5">
                              <ShieldCheck size={10} /> ADMIN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {u.id !== user?.id && (
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                  {/* ... (rest of the card content) */}
                  <div className="mt-4 space-y-2 border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} className="text-gray-400 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} className="text-gray-400 shrink-0" />
                      <span>{u.phone || "No phone"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium pt-1">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar size={14} />
                        Joined {new Date(u.created_at as string).toLocaleDateString()}
                      </div>
                      {u.emailVerified ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle size={14} /> Verified
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-1">
                          <Activity size={14} /> Unverified
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Global Post Feed Management */}
          <div className="mt-12 w-full">
             <div className="mb-6 px-2 sm:px-0">
               <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <Package className="text-[var(--color-brand-500)]" size={24} />
                 Recent Posts
               </h2>
               <p className="text-sm text-gray-500">Manage all platform activity</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full max-w-md mx-auto md:max-w-none">
               {shipperPosts.map(post => (
                 <ShipperPostCard 
                  key={`s-${post.id}`} 
                  post={post} 
                  href={`/shipper/${post.id}`} 
                  isAdmin={true} 
                  onAdminDelete={() => handlePostDelete("shipper", post.id)} 
                 />
               ))}
               {clientPosts.map(post => (
                 <ClientPostCard 
                  key={`c-${post.id}`} 
                  post={post} 
                  href={`/client/${post.id}`} 
                  isAdmin={true} 
                  onAdminDelete={() => handlePostDelete("client", post.id)} 
                 />
               ))}
             </div>
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialog.open}
            onOpenChange={(open) =>
              setDeleteDialog({ open, userId: open ? deleteDialog.userId : null })
            }
            title="Delete User"
            description="This action cannot be undone. The user and all their data will be permanently removed."
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialog({ open: false, userId: null })}
                  disabled={deleteLoading === deleteDialog.userId}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDeleteUser}
                  isLoading={deleteLoading === deleteDialog.userId}
                >
                  Delete User
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this user? All posts, messages, and associated data will be permanently deleted.
              </p>
            </div>
          </Dialog>

          {/* Success/Error Message */}
          {deleteMessage && (
            <div className="fixed bottom-6 right-6 z-50">
              <Alert
                tone={deleteMessage.type === "success" ? "success" : "error"}
                className="shadow-lg"
              >
                {deleteMessage.text}
              </Alert>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
