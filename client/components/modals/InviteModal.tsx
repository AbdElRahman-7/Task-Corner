"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { X, UserPlus, Search, CheckCircle, Globe, AlignLeft, CheckSquare, Mail, User } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { apiFetch } from "@utils/api";
import { toast } from "react-hot-toast";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId?: string; // Optional: If we're already in a board
  workspaceId?: string; // Optional: If we're already in a workspace
  taskId?: string; // Optional: If we're inviting specifically to a task
  initialTasks?: any[]; // Pre-loaded tasks from parent
  initialLists?: any[]; // Pre-loaded lists from parent
}

export default function InviteModal({
  isOpen,
  onClose,
  boardId,
  workspaceId,
  taskId,
  initialTasks,
  initialLists
}: InviteModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>(initialTasks || []);
  const [lists, setLists] = useState<any[]>(initialLists || []);
  
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [manualEmail, setManualEmail] = useState("");
  const [manualEmails, setManualEmails] = useState<string[]>([]);

  const token = useSelector((state: RootState) => state.auth.token);
  
  const [selectedBoardId, setSelectedBoardId] = useState(boardId || "");
  const [selectedListId, setSelectedListId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(taskId || "");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all users for the directory
      const usersRes = await apiFetch("/admin/users", { token, auth: true });
      // Fetch boards if not already provided
      const boardsRes = boardId ? [] : await apiFetch("/boards", { token, auth: true });
      
      if (usersRes?.success && Array.isArray(usersRes.users)) {
        setUsers(usersRes.users.map((u: any) => ({
          ...u,
          selected: false,
          role: "viewer"
        })));
      } else if (Array.isArray(usersRes)) {
        // Fallback if the API returns an array directly
        setUsers(usersRes.map((u: any) => ({
          ...u,
          selected: false,
          role: "viewer"
        })));
      }

      setBoards(Array.isArray(boardsRes) ? boardsRes : (boardsRes?.boards || []));

      const actualBoards = Array.isArray(boardsRes) ? boardsRes : (boardsRes?.boards || []);
      const initialBoardId = boardId || (actualBoards.length > 0 ? (actualBoards[0]._id || actualBoards[0].id) : "");
      setSelectedBoardId(initialBoardId);
      
      if (taskId) {
        setSelectedTaskId(taskId);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load users or boards");
    } finally {
      setLoading(false);
    }
  }, [token, boardId, taskId]);

  useEffect(() => {
    if (isOpen && token) {
      fetchData();
    }
  }, [isOpen, token, fetchData]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setManualEmail("");
      setManualEmails([]);
      setUsers(prev => prev.map(u => ({ ...u, selected: false, role: "viewer" })));
    }
  }, [isOpen]);

  // Sync tasks/lists from props if available
  useEffect(() => {
    if (initialTasks && initialLists && boardId === selectedBoardId) {
      setTasks(initialTasks);
      setLists(initialLists);
    }
  }, [initialTasks, initialLists, boardId, selectedBoardId]);

  // Fetch tasks/lists when board selection changes (if props not available or different board)
  useEffect(() => {
    const fetchBoardContext = async () => {
      if (!selectedBoardId) {
        setTasks([]);
        setLists([]);
        return;
      }
      
      // If we have props for this specific board, skip fetch
      if (boardId === selectedBoardId && initialTasks) return;

      try {
        const res = await apiFetch(`/boards/${selectedBoardId}`, { token, auth: true });
        if (res.tasks) {
          const processedTasks = res.tasks.map((t: any) => ({
            ...t,
            listName: res.lists?.find((l: any) => (l._id || l.id) === (typeof t.listId === 'object' ? t.listId?._id : t.listId))?.title || "Tasks"
          }));
          setTasks(processedTasks);
        }
        if (res.lists) {
          setLists(res.lists);
        }
      } catch (err) {
        console.error("Error fetching board context:", err);
      }
    };
    fetchBoardContext();
  }, [selectedBoardId, token, boardId, initialTasks]);

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

  const handleManualEmailAdd = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (manualEmails.includes(email) || users.some(u => u.email.toLowerCase() === email)) {
      toast.error("User already in the list");
      return;
    }
    setManualEmails(prev => [...prev, email]);
    setManualEmail("");
    toast.success(`Added ${email}`);
  };

  const removeManualEmail = (email: string) => {
    setManualEmails(prev => prev.filter(e => e !== email));
  };

  const handleBulkInvite = async () => {
    const selectedUsers = users.filter(u => u.selected);

    if (selectedUsers.length === 0 && manualEmails.length === 0) {
      toast.error("Please select a user or enter an email");
      return;
    }

    const cleanBoardId = (selectedBoardId && selectedBoardId !== "undefined") ? selectedBoardId : undefined;
    const cleanWorkspaceId = (workspaceId && workspaceId !== "undefined") ? workspaceId : undefined;
    const cleanTaskId = (selectedTaskId && selectedTaskId !== "undefined") ? selectedTaskId : undefined;

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
        taskId: cleanTaskId,
        role: u.role,
      }));

      // Add manual emails
      manualEmails.forEach(email => {
        payloads.push({
          email,
          name: email.split('@')[0],
          boardId: cleanBoardId,
          workspaceId: cleanWorkspaceId,
          taskId: cleanTaskId,
          role: "viewer",
        });
      });

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
  const totalCount = selectedCount + manualEmails.length;

  if (!isOpen) return null;

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal modal--large modal--invite" onClick={e => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">Invite Collaborators</h2>
          <p className="modalSubtitle">Add people to your workspace, board, or specific tasks</p>
          <button onClick={onClose} className="modalClose">
            <X size={20} />
          </button>
        </div>

        <div className="inviteContent">
          {/* Left Panel: User Directory */}
          <div className="inviteLeft">
            <div className="inviteSearch">
              <div className="inviteSearch__wrapper">
                <Search className="icon" size={18} />
                <input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 opacity-50 space-y-4">
                  <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                  <p className="text-sm font-bold tracking-tight">Fetching team members...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 animate-fadeIn">
                  <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-full">
                    <UserPlus className="text-gray-400" size={32} />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-bold">No users found</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Try searching for something else or invite by email below.</p>
                  </div>
                </div>
              ) : (
                <table className="userSelectTable" style={{ minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th className="w-12 text-center">
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={filteredUsers.length > 0 && filteredUsers.every(u => u.selected)}
                          onChange={selectAllFiltered}
                        />
                      </th>
                      <th>TEAM MEMBER</th>
                      <th className="col-email">EMAIL</th>
                      <th className="w-40">ROLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr 
                        key={user._id || user.id} 
                        className={user.selected ? "tr--selected" : ""}
                        onClick={() => toggleUserSelection(user._id || user.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={user.selected}
                            onChange={() => toggleUserSelection(user._id || user.id)}
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="userSelectTable__avatar">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="userSelectTable__name">{user.username}</div>
                          </div>
                        </td>
                        <td className="col-email">
                          <div className="userSelectTable__email">{user.email}</div>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            disabled={!user.selected}
                            value={user.role}
                            onChange={e => updateUserRole(user._id || user.id, e.target.value as any)}
                            className="assignments__roleSelect"
                          >
                            <option value="viewer">VIEWER</option>
                            <option value="editor">EDITOR</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Panel: Configuration & Summary */}
          <div className="inviteRight">
            <div className="space-y-6">
              {/* Board selector — Hidden if already within a board context */}
              {!boardId && (
                <div className="mb-4">
                  <label className="sidebarSectionHeader">
                    <Globe size={14} />
                    Target Board
                  </label>
                  <select
                    value={selectedBoardId}
                    onChange={e => {
                      setSelectedBoardId(e.target.value);
                      setSelectedListId("");
                      setSelectedTaskId("");
                    }}
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
              )}

              {/* List selector — Only shown if a board is selected AND not within a task context */}
              {(selectedBoardId || boardId) && !taskId && lists.length > 0 && (
                <div className="mb-4">
                  <label className="sidebarSectionHeader">
                    <AlignLeft size={14} />
                    Target List (Filter)
                  </label>
                  <select
                    value={selectedListId}
                    onChange={e => {
                      setSelectedListId(e.target.value);
                      setSelectedTaskId("");
                    }}
                    className="formSelect"
                  >
                    <option value="">All Lists</option>
                    {lists.map(list => (
                      <option key={list._id || list.id} value={list._id || list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Task selector — Only shown if not within a task context */}
              {(selectedBoardId || boardId) && !taskId && tasks.length > 0 && (
                <div className="mb-4">
                  <label className="sidebarSectionHeader">
                    <CheckSquare size={14} />
                    Target Task (Optional)
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={e => setSelectedTaskId(e.target.value)}
                    className="formSelect"
                  >
                    <option value="">Select a task to assign...</option>
                    {(() => {
                      const filteredTasks = selectedListId 
                        ? tasks.filter(t => (t.listId?._id || t.listId) === selectedListId)
                        : tasks;

                      const tasksByList: { [key: string]: any[] } = {};
                      filteredTasks.forEach(t => {
                        const listName = t.listName || "Tasks";
                        if (!tasksByList[listName]) tasksByList[listName] = [];
                        tasksByList[listName].push(t);
                      });

                      return Object.entries(tasksByList).map(([listName, listTasks]) => (
                        <optgroup key={listName} label={listName}>
                          {listTasks.map(task => (
                            <option key={task._id || task.id} value={task._id || task.id}>
                              {task.title}
                            </option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                  </select>
                </div>
              )}

              <div className="inviteRight__grow">
                <h3 className="sidebarSectionHeader">
                  <CheckCircle size={14} />
                  Invite Summary
                </h3>
                <div className="inviteSummaryCard mt-3">
                  <div className="inviteSummaryCard__count">
                    {totalCount}
                  </div>
                  <div className="inviteSummaryCard__label">Total Recipients</div>

                  {totalCount > 0 && (
                    <div className="mt-1 opacity-50 text-[0.6rem] font-bold uppercase">
                      {selectedCount > 0 && <span>{selectedCount} from list</span>}
                      {selectedCount > 0 && manualEmails.length > 0 && <span className="mx-1">•</span>}
                      {manualEmails.length > 0 && <span>{manualEmails.length} via email</span>}
                    </div>
                  )}

                  {selectedTaskId && totalCount > 0 && (
                    <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-[10px] text-blue-600 dark:text-blue-400 font-medium border border-blue-100 dark:border-blue-800/30">
                      Will be assigned to: <br/>
                      <strong>{tasks.find(t => (t._id || t.id) === selectedTaskId)?.title || "Selected Task"}</strong>
                    </div>
                  )}
                </div>

                {manualEmails.length > 0 && (
                  <div className="mt-6">
                    <h3 className="sidebarSectionHeader">Manual Emails</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {manualEmails.map(email => (
                        <div key={email} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-bold">
                          <span className="truncate max-w-[120px]">{email}</span>
                          <button onClick={() => removeManualEmail(email)} className="text-gray-400 hover:text-red-500">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modalFooter modalFooter--invite">
          <div className="inviteRight__actions">
            <button
              onClick={handleBulkInvite}
              disabled={
                sending ||
                totalCount === 0 ||
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
                  Send {totalCount > 0 ? `${totalCount} ` : ""}Invite{totalCount !== 1 ? "s" : ""}
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
  );
}