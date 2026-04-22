"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { User, Board } from "@appTypes/index";
import { Search, UserPlus, Shield, ShieldCheck, Mail, CheckCircle, Globe } from "lucide-react";

interface UserWithSelection extends User {
  selected?: boolean;
  role?: "viewer" | "editor";
}

interface InviteModalProps {
  boardId?: string;
  workspaceId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ boardId, workspaceId, isOpen, onClose }: InviteModalProps) {
  const [users, setUsers] = useState<UserWithSelection[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (isOpen && token) {
      fetchData();
    }
  }, [isOpen, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Users
      const usersRes = await apiFetch("/admin/users", { token, auth: true });
      if (usersRes.success) {
        setUsers(usersRes.users.map((u: any) => ({ ...u, selected: false, role: "viewer" })));
      }

      // Fetch Boards
      const boardsRes = await apiFetch("/boards?status=active", { token, auth: true });
      setBoards(boardsRes);
      
      if (boardId) {
        setSelectedBoardId(boardId);
      } else if (boardsRes.length > 0) {
        setSelectedBoardId(boardsRes[0]._id || boardsRes[0].id);
      }
    } catch (error) {
      console.error("Error fetching data for invite:", error);
      toast.error("Failed to load users or boards");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        (u._id || u.id) === userId ? { ...u, selected: !u.selected } : u
      )
    );
  };

  const updateUserRole = (userId: string, role: "viewer" | "editor") => {
    setUsers((prev) =>
      prev.map((u) =>
        (u._id || u.id) === userId ? { ...u, role } : u
      )
    );
  };

  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualRole, setManualRole] = useState<"viewer" | "editor">("viewer");

  const handleBulkInvite = async () => {
    const selectedUsers = users.filter((u) => u.selected);
    const hasManual = manualEmail.trim() !== "";

    if (selectedUsers.length === 0 && !hasManual) {
      toast.error("Please select a user or enter an email");
      return;
    }

    // Clean up IDs
    const cleanWorkspaceId = (workspaceId && workspaceId !== "undefined" && workspaceId !== "null" && workspaceId !== "default-workspace") ? workspaceId : undefined;
    const cleanBoardId = (selectedBoardId && selectedBoardId !== "undefined" && selectedBoardId !== "null") ? selectedBoardId : undefined;

    if (!cleanBoardId && !cleanWorkspaceId) {
      toast.error("Please select a board or workspace");
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;
    let lastError = "";

    try {
      const allPayloads = selectedUsers.map((u) => ({
        email: u.email,
        name: u.username,
        boardId: cleanBoardId,
        workspaceId: cleanWorkspaceId,
        role: u.role,
      }));

      if (hasManual) {
        if (!allPayloads.some(p => p.email.toLowerCase() === manualEmail.toLowerCase())) {
          allPayloads.push({
            email: manualEmail,
            name: manualName,
            boardId: cleanBoardId,
            workspaceId: cleanWorkspaceId,
            role: manualRole,
          });
        }
      }

      for (const payload of allPayloads) {
        try {
          await apiFetch("/invite", {
            method: "POST",
            body: JSON.stringify(payload),
            token,
            auth: true,
          });
          successCount++;
        } catch (error: any) {
          console.error(`Failed to invite ${payload.email}:`, error);
          failCount++;
          lastError = error.message;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully invited ${successCount} user${successCount > 1 ? "s" : ""}!`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} invite${failCount > 1 ? "s" : ""} failed: ${lastError}`);
      }

      if (successCount > 0) {
        setManualEmail("");
        setManualName("");
        onClose();
      }
    } catch (error: any) {
      console.error("Bulk invite overall error:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = users.filter((u) => u.selected).length;
  const hasManual = manualEmail.trim() !== "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideInUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus className="text-blue-500 w-6 h-6" />
              {boardId || selectedBoardId ? "Invite to Board" : "Invite to Workspace"}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {boardId || selectedBoardId 
                ? "Select users and assign roles for your board." 
                : "Add new members to your workspace."}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Left Panel: User Selection */}
          <div className="flex-[2] flex flex-col border-r border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 bg-gray-50/50 dark:bg-zinc-800/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                   <p className="text-sm text-gray-400">Loading users...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10 shadow-sm">
                      <tr className="text-[10px] uppercase text-gray-400 font-bold border-b border-gray-100 dark:border-zinc-800">
                        <th className="p-3 w-10">Select</th>
                        <th className="p-3">User Info</th>
                        <th className="p-3">Assign Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user._id || user.id}
                          className={`group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors ${user.selected ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={user.selected}
                              onChange={() => toggleUserSelection(user._id || user.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                                {user.username.substring(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.username}</div>
                                <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <select
                              disabled={!user.selected}
                              value={user.role}
                              onChange={(e) => updateUserRole((user._id || user.id), e.target.value as any)}
                              className={`text-[10px] font-bold p-1.5 rounded border transition-all outline-none ${
                                  !user.selected 
                                  ? 'bg-gray-100 text-gray-400 border-transparent' 
                                  : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 cursor-pointer hover:border-blue-500'
                              }`}
                            >
                              <option value="viewer">VIEWER</option>
                              <option value="editor">EDITOR</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-800/20">
              <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest flex items-center gap-2">
                <UserPlus className="w-3 h-3" />
                Invite via Email
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="flex-[2] px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <select
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value as any)}
                  className="px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Panel: Settings */}
          <div className="flex-1 bg-gray-50 dark:bg-zinc-800/50 p-6 flex flex-col border-l border-gray-100 dark:border-zinc-800 overflow-y-auto">
            <div className="mb-6">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Target Board
              </label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              >
                <option value="">Select a board...</option>
                {boards.map((board) => (
                  <option key={board._id || board.id} value={board._id || board.id}>
                    {board.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 space-y-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                Invite Summary
              </h3>
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 transition-all">
                <div className="text-4xl font-black text-blue-600 mb-1">{selectedCount + (hasManual ? 1 : 0)}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Recipients</div>
              </div>
              
              {(selectedCount > 0 || hasManual) && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed italic">
                    Invitations will be sent immediately. Users not already registered will receive a secure joining link.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={handleBulkInvite}
                disabled={sending || (selectedCount === 0 && !hasManual) || (!selectedBoardId && !workspaceId)}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    SEND INVITES
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-widest"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}