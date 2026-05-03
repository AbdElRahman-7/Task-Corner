"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { apiFetch } from "@utils/api";
import { X, Plus, Users, Trash2, Briefcase, Loader2, Info } from "lucide-react";

interface MemberInput {
  name: string;
  email: string;
  role: "viewer" | "editor";
}

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, members: MemberInput[]) => Promise<void> | void;
  initialTitle?: string;
}

const CreateBoardModal = ({ isOpen, onClose, onCreate, initialTitle = "" }: CreateBoardModalProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [members, setMembers] = useState<MemberInput[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [currentMember, setCurrentMember] = useState<MemberInput>({
    name: "",
    email: "",
    role: "viewer"
  });

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ref to the email input — used to position the portal dropdown
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // Recompute dropdown position using viewport coords (fixed positioning — no scroll offsets)
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + 6,   // px from top of viewport
        left: rect.left,        // px from left of viewport
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
    }
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [showSuggestions, updateDropdownPosition]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setMembers([]);
      setMemberError("");
      setIsCreating(false);
      setCurrentMember({ name: "", email: "", role: "viewer" });
      fetchUsers();
    }
  }, [isOpen, initialTitle]);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch("/admin/users", { token, auth: true });
      if (res.success) {
        setAvailableUsers(res.users);
      }
    } catch (error) {
      console.error("Failed to fetch users for suggestions", error);
    }
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleAddMember = () => {
    setMemberError("");
    const email = currentMember.email.trim();
    
    if (!email) return;

    if (!validateEmail(email)) {
      setMemberError("Please enter a valid email address.");
      return;
    }

    if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
      setMemberError("This member is already in your list.");
      return;
    }

    setMembers([...members, { ...currentMember, email }]);
    setCurrentMember({ name: "", email: "", role: "viewer" });
    setShowSuggestions(false);
  };

  const handleSelectUser = (user: any) => {
    setMemberError("");
    setCurrentMember({
      name: user.username,
      email: user.email,
      role: "viewer"
    });
    setShowSuggestions(false);
  };

  const filteredSuggestions = availableUsers.filter(u => 
    (u.username.toLowerCase().includes(currentMember.email.toLowerCase()) || 
     u.email.toLowerCase().includes(currentMember.email.toLowerCase())) &&
    !members.some(m => m.email.toLowerCase() === u.email.toLowerCase())
  ).slice(0, 5);

  if (!isOpen) return null;

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle && !isCreating) {
      setIsCreating(true);
      try {
        await onCreate(trimmedTitle, members);
        onClose();
      } catch (error) {
        console.error("Failed to create board:", error);
      } finally {
        setIsCreating(false);
      }
    }
  };

  // Portal dropdown — position:fixed so it's viewport-relative and never expands document width
  const suggestionPortal = isMounted && showSuggestions && filteredSuggestions.length > 0 && dropdownRect
    ? createPortal(
        <div
          className="suggestionMenu"
          style={{
            position: "fixed",
            top: dropdownRect.top,
            left: dropdownRect.left,
            width: dropdownRect.width,
            zIndex: 9999,
          }}
        >
          <div className="suggestionMenu__header">Suggestions</div>
          {filteredSuggestions.map((u) => (
            <button
              key={u._id}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // keep focus on input
              onClick={() => handleSelectUser(u)}
              className="suggestionMenu__item"
            >
              <div className="avatar">
                {(u.username || "U").substring(0, 2).toUpperCase()}
              </div>
              <div className="info">
                <span className="name">{u.username}</span>
                <span className="email">{u.email}</span>
              </div>
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="backdrop" onClick={onClose}>
      {suggestionPortal}
      <div 
        className="modal modal--medium createBoardModal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modalClose" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600/10 p-2 rounded-xl text-blue-600">
              <Briefcase size={24} />
            </div>
            <h2 className="modalTitle !mb-0">New Workspace</h2>
          </div>
          <p className="modalSubtitle">
            Organize your projects and invite your team to collaborate in real-time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="formGroup">
            <label htmlFor="board-title" className="formLabel">
              Workspace Title
            </label>
            <input
              id="board-title"
              autoFocus
              type="text"
              placeholder="e.g. Marketing Launch Q2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="formInput text-lg font-semibold"
              required
              disabled={isCreating}
            />
          </div>

          <div className="membersSection">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <label className="formLabel !pb-0 !text-sm">Collaborators</label>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                {members.length} {members.length === 1 ? 'Person' : 'People'}
              </div>
            </div>
            
            <div className="flex flex-col gap-4 bg-gray-50/50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="assigneeInputWrapper">
                <input
                  ref={inputRef}
                  type="email"
                  placeholder="Invite by name or email..."
                  value={currentMember.email}
                  onChange={(e) => {
                    setCurrentMember({...currentMember, email: e.target.value});
                    setShowSuggestions(true);
                    setMemberError("");
                  }}
                  onFocus={() => {
                    setShowSuggestions(true);
                    updateDropdownPosition();
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  className={`formInput ${memberError ? 'border-red-500' : ''}`}
                  disabled={isCreating}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {!availableUsers.some(u => u.email.toLowerCase() === currentMember.email.toLowerCase()) && currentMember.email.trim() !== "" && (
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={currentMember.name}
                      onChange={(e) => setCurrentMember({...currentMember, name: e.target.value})}
                      className="formInput w-full"
                      disabled={isCreating}
                    />
                  </div>
                )}

                <div className="relative min-w-[140px] flex-1 sm:flex-initial">
                  <select
                    value={currentMember.role}
                    onChange={(e) => setCurrentMember({...currentMember, role: e.target.value as "viewer" | "editor"})}
                    className="formSelect !mt-0 h-[48px] w-full"
                    disabled={isCreating}
                  >
                    <option value="viewer">VIEWER</option>
                    <option value="editor">EDITOR</option>
                  </select>
                </div>

                <button 
                  type="button" 
                  onClick={handleAddMember}
                  disabled={!currentMember.email.trim() || isCreating}
                  className="btnPrimary !min-w-0 px-6 h-[48px] flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  <span>Add</span>
                </button>
              </div>

              {memberError && (
                <div className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1 animate-fadeIn">
                  <Info size={12} />
                  {memberError}
                </div>
              )}
            </div>

            {members.length > 0 ? (
              <div className="memberList mt-6 max-h-[240px] overflow-y-auto overscroll-contain pr-2 custom-scrollbar">
                {members.map((m, i) => (
                  <div key={i} className="memberItem group animate-fadeInUp" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="memberItem__avatar">
                      {(m.name || m.email).substring(0,2).toUpperCase()}
                    </div>
                    <div className="memberItem__info">
                      <div className="name">{m.name || 'External User'}</div>
                      <div className="email text-xs opacity-60">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        value={m.role}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[i].role = e.target.value as "viewer" | "editor";
                          setMembers(newMembers);
                        }}
                        className="roleSelect !bg-transparent hover:!bg-blue-600/10 transition-colors mr-1"
                        disabled={isCreating}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMember(i)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        disabled={isCreating}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 p-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-center">
                <p className="text-gray-400 text-sm italic">No members added yet. Start by inviting someone!</p>
              </div>
            )}
          </div>

          <div className="modalActions">
            <button
              type="button"
              onClick={onClose}
              className="btnSecondary"
              disabled={isCreating}
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isCreating}
              className="btnPrimary !px-10 relative overflow-hidden"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                <span>Create Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;

