"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "@utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { toast } from "react-hot-toast";
import { User, Board } from "@appTypes/index";
import { Search, UserPlus, Globe, CheckCircle, X, Mail, Users } from "lucide-react";

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

  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualRole, setManualRole] = useState<"viewer" | "editor">("viewer");

  const token = useSelector((state: RootState) => state.auth.token);

  // Lock body scroll
  useEffect(() => {
    const rootElements = [document.documentElement, document.body];
    if (isOpen) {
      rootElements.forEach(el => el.classList.add("modal-open"));
    }
    return () => rootElements.forEach(el => el.classList.remove("modal-open"));
  }, [isOpen]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, boardsRes] = await Promise.all([
        apiFetch("/admin/users", { token, auth: true }),
        apiFetch("/boards?status=active", { token, auth: true })
      ]);

      if (usersRes.success) {
        setUsers(usersRes.users.map((u: any) => ({
          ...u,
          selected: false,
          role: "viewer"
        })));
      }

      setBoards(boardsRes);

      if (boardId) {
        setSelectedBoardId(boardId);
      } else if (boardsRes.length > 0) {
        setSelectedBoardId(boardsRes[0]._id || boardsRes[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load users or boards");
    } finally {
      setLoading(false);
    }
  }, [token, boardId]);

  useEffect(() => {
    if (isOpen && token) {
      fetchData();
    }
  }, [isOpen, token, fetchData]);

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [users, searchTerm]);

  const toggleUserSelection = (userId: string) => {
    setUsers(prev => prev.map(u =>
      (u._id || u.id) === userId ? { ...u, selected: !u.selected } : u
    ));
  };

  const selectAllFiltered = () => {
    const allSelected = filteredUsers.every(u => u.selected);
    const filteredIds = new Set(filteredUsers.map(u => u._id || u.id));
    setUsers(prev => prev.map(u =>
      filteredIds.has(u._id || u.id) ? { ...u, selected: !allSelected } : u
    ));
  };

  const updateUserRole = (userId: string, role: "viewer" | "editor") => {
    setUsers(prev => prev.map(u =>
      (u._id || u.id) === userId ? { ...u, role } : u
    ));
  };

  const handleBulkInvite = async () => {
    const selectedUsers = users.filter(u => u.selected);
    const hasManual = manualEmail.trim() !== "";

    if (selectedUsers.length === 0 && !hasManual) {
      toast.error("Please select a user or enter an email");
      return;
    }

    const cleanBoardId = (selectedBoardId && selectedBoardId !== "undefined") ? selectedBoardId : undefined;
    const cleanWorkspaceId = (workspaceId && workspaceId !== "undefined") ? workspaceId : undefined;

    if (!cleanBoardId && !cleanWorkspaceId) {
      toast.error("Please select a target board or workspace");
      return;
    }

    setSending(true);
    try {
      const payloads = selectedUsers.map(u => ({
        email: u.email,
        name: u.username,
        boardId: cleanBoardId,
        workspaceId: cleanWorkspaceId,
        role: u.role,
      }));

      if (hasManual) {
        const manualEmailLower = manualEmail.toLowerCase().trim();
        const alreadyIncluded = payloads.some(p => p.email.toLowerCase().trim() === manualEmailLower);

        if (!alreadyIncluded) {
          payloads.push({
            email: manualEmailLower,
            name: manualName.trim() || manualEmailLower.split('@')[0],
            boardId: cleanBoardId,
            workspaceId: cleanWorkspaceId,
            role: manualRole,
          });
        }
      }

      await Promise.all(payloads.map(p =>
        apiFetch("/invite", {
          method: "POST",
          body: JSON.stringify(p),
          token,
          auth: true,
        })
      ));

      toast.success(`Successfully sent ${payloads.length} invite${payloads.length > 1 ? 's' : ''}!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to send some invites");
    } finally {
      setSending(false);
    }
  };

  const selectedCount = users.filter(u => u.selected).length;
  const hasManual = manualEmail.trim() !== "";

  if (!isOpen) return null;

  return (
    <div className="backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--invite" onClick={e => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="modalTitle flex items-center gap-2">
                <UserPlus size={22} />
                {boardId || selectedBoardId ? "Invite to Board" : "Invite to Workspace"}
              </h2>
              <p className="modalSubtitle">
                {boardId || selectedBoardId
                  ? "Collaborate by adding members to this board."
                  : "Expand your workspace team."}
              </p>
            </div>
            <button onClick={onClose} className="modalClose" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="inviteContent">
          <div className="inviteLeft">
            <div className="inviteSearch">
              <div className="inviteSearch__wrapper">
                <Search className="icon" size={16} />
                <input
                  type="text"
                  placeholder="Search and select users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="loaderWrapper">
                  <div className="loaderWrapper__spinner" />
                  <p>Searching directory...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="loaderWrapper">
                  <Users size={32} style={{ opacity: 0.2 }} />
                  <p>No users found</p>
                </div>
              ) : (
                <table className="userSelectTable">
                  <thead>
                    <tr>
                      <th className="w-10">
                        <input
                          type="checkbox"
                          className="autoDoneCheckbox"
                          checked={filteredUsers.length > 0 && filteredUsers.every(u => u.selected)}
                          onChange={selectAllFiltered}
                        />
                      </th>
                      <th>User Info</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => {
                      const id = user._id || user.id;
                      return (
                        <tr key={id} className={user.selected ? 'tr--selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={!!user.selected}
                              onChange={() => toggleUserSelection(id)}
                              className="autoDoneCheckbox"
                            />
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="userSelectTable__avatar">
                                {user.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex flex-col">
                                <span className="userSelectTable__name">{user.username}</span>
                                <span className="userSelectTable__email">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <select
                              disabled={!user.selected}
                              value={user.role}
                              onChange={e => updateUserRole(id, e.target.value as any)}
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
          </div>

          <div className="inviteRight">

            {/* Board selector */}
            <div>
              <label className="sidebarSectionHeader">
                <Globe size={14} />
                Target Board
              </label>
              <select
                value={selectedBoardId}
                onChange={e => setSelectedBoardId(e.target.value)}
                className="formSelect"
              >
                <option value="">Select a board...</option>
                {boards.map(board => (
                  <option key={board._id || board.id} value={board._id || board.id}>
                    {board.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary — flex:1 so it fills space and pushes actions down */}
            <div className="inviteRight__grow">
              <h3 className="sidebarSectionHeader">
                <CheckCircle size={14} />
                Invite Summary
              </h3>
              <div className="inviteSummaryCard mt-3">
                <div className="inviteSummaryCard__count">
                  {selectedCount + (hasManual ? 1 : 0)}
                </div>
                <div className="inviteSummaryCard__label">Total Recipients</div>

                {(selectedCount > 0 || hasManual) && (
                  <div className="flex justify-center gap-4 mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                    {selectedCount > 0 && (
                      <span className="text-[0.65rem] font-bold uppercase opacity-60">
                        {selectedCount} from list
                      </span>
                    )}
                    {hasManual && (
                      <span className="text-[0.65rem] font-bold uppercase opacity-60">
                        1 via email
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions — sits right below summary, no fighting for space */}
            <div className="inviteRight__actions">
              <button
                onClick={handleBulkInvite}
                disabled={
                  sending ||
                  (selectedCount === 0 && !hasManual) ||
                  (!selectedBoardId && !workspaceId)
                }
                className="btnSave"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Send {selectedCount + (hasManual ? 1 : 0) > 0
                      ? `${selectedCount + (hasManual ? 1 : 0)} `
                      : ""}Invite{selectedCount + (hasManual ? 1 : 0) !== 1 ? "s" : ""}
                  </>
                )}
              </button>
              <button onClick={onClose} className="btnDanger btnDanger--full">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}