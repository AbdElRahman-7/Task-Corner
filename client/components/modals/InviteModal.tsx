"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { toast } from "react-hot-toast";
import { User, Board } from "@appTypes/index";
import { Search, UserPlus, Globe, CheckCircle, X, Mail } from "lucide-react";

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
        setManualEmail("");
        setManualName("");
        onClose();
      }
      if (failCount > 0) {
        toast.error(`${failCount} invite${failCount > 1 ? "s" : ""} failed: ${lastError}`);
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
    <div className="backdrop" onClick={onClose}>
      <div className="modal modal--invite" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modalHeader">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="modalTitle flex items-center gap-2">
                <UserPlus size={24} />
                {boardId || selectedBoardId ? "Invite to Board" : "Invite to Workspace"}
              </h2>
              <p className="modalSubtitle">
                {boardId || selectedBoardId 
                  ? "Select users and assign roles for your board." 
                  : "Add new members to your workspace."}
              </p>
            </div>
            <button onClick={onClose} className="modalClose">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="inviteContent">
          {/* Left Panel: User Selection */}
          <div className="inviteLeft">
            <div className="inviteSearch">
              <div className="inviteSearch__wrapper">
                <Search className="icon" size={16} />
                <input
                  type="text"
                  placeholder="Search existing users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="loaderWrapper">
                  <div className="loaderWrapper__spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : (
                <table className="userSelectTable">
                  <thead>
                    <tr>
                      <th className="w-10">Select</th>
                      <th>User Info</th>
                      <th>Assign Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const id = user._id || user.id;
                      return (
                        <tr 
                          key={id}
                          className={user.selected ? 'tr--selected' : ''}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={user.selected}
                              onChange={() => toggleUserSelection(id)}
                              className="autoDoneCheckbox"
                            />
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="assignments__avatar">
                                {user.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="assignments__name">{user.username}</div>
                                <div className="email opacity-50 text-[10px]">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <select
                              disabled={!user.selected}
                              value={user.role}
                              onChange={(e) => updateUserRole(id, e.target.value as any)}
                              className="assignments__roleSelect"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-800/20">
              <h4 className="sidebarSectionHeader">
                <Mail size={14} />
                Direct Email Invite
              </h4>
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="formInput flex-1"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="formInput flex-[2]"
                />
                <select
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value as any)}
                  className="assignments__roleSelect h-11"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Panel: Settings */}
          <div className="inviteRight">
            <div>
              <label className="sidebarSectionHeader">
                <Globe size={14} />
                Target Board
              </label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="formInput"
              >
                <option value="">Select a board...</option>
                {boards.map((board) => (
                  <option key={board._id || board.id} value={board._id || board.id}>
                    {board.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <h3 className="sidebarSectionHeader">
                <CheckCircle size={14} />
                Invite Summary
              </h3>
              <div className="inviteSummaryCard mt-3">
                <div className="inviteSummaryCard__count">{selectedCount + (hasManual ? 1 : 0)}</div>
                <div className="inviteSummaryCard__label">Total Recipients</div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <button
                onClick={handleBulkInvite}
                disabled={sending || (selectedCount === 0 && !hasManual) || (!selectedBoardId && !workspaceId)}
                className="btnSave"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Send Invites
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="btnDanger btnDanger--full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}