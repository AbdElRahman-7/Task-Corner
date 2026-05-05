"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { apiFetch } from "@utils/api";
import { X, Plus, Users, Trash2, Briefcase, Loader2, Info, UserMinus } from "lucide-react";

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
  const currentUser = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + 6,
        left: rect.left,
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
    if (email.toLowerCase() === currentUser?.email.toLowerCase()) {
      setMemberError("You are the owner and will be added automatically.");
      return;
    }
    setMembers([...members, { ...currentMember, email }]);
    setCurrentMember({ name: "", email: "", role: "viewer" });
    setShowSuggestions(false);
  };

  const handleSelectUser = (user: any) => {
    setMemberError("");
    setCurrentMember({ name: user.username, email: user.email, role: "viewer" });
    setShowSuggestions(false);
  };

  const filteredSuggestions = availableUsers.filter(u =>
    (u.username.toLowerCase().includes(currentMember.email.toLowerCase()) ||
      u.email.toLowerCase().includes(currentMember.email.toLowerCase())) &&
    !members.some(m => m.email.toLowerCase() === u.email.toLowerCase()) &&
    u.email.toLowerCase() !== currentUser?.email.toLowerCase()
  ).slice(0, 5);

  if (!isOpen) return null;

  const handleRemoveMember = (email: string) => {
    setMembers(members.filter((m) => m.email !== email));
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

  const suggestionPortal = isMounted && showSuggestions && filteredSuggestions.length > 0 && dropdownRect
    ? createPortal(
      <div
        className="suggestionMenu"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: dropdownRect.top,
          left: dropdownRect.left,
          width: dropdownRect.width,
          minWidth: dropdownRect.width < 280 ? "280px" : "auto",
          maxWidth: "calc(100vw - 32px)",
          zIndex: 9999,
        }}
      >
        <div className="suggestionMenu__header">Suggestions</div>
        {filteredSuggestions.map((u) => (
          <button
            key={u._id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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
    <>
      {suggestionPortal}
      <div className="backdrop" onClick={onClose}>
        <div
          className="modal modal--medium createBoardModal"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modalClose" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>

          <div className="modalHeader">
            <div className="modalHeader__icon">
              <Briefcase size={28} />
            </div>
            <div className="modalHeader__text">
              <h2 className="modalTitle">New Workspace</h2>
              <p className="modalSubtitle">
                Organize your projects and invite your team to collaborate.
              </p>
            </div>
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
                className="formInput"
                required
                disabled={isCreating}
              />
            </div>

            <div className="membersSection !mt-8">
              {/* Section header */}
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Users size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <label className="formLabel !pb-0 !text-[11px] !tracking-[0.15em] !font-black !opacity-90">
                    Collaborators
                  </label>
                </div>
                <div className="bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 text-[10px] font-black px-3.5 py-1.5 rounded-full border border-blue-600/10 dark:border-blue-400/10 uppercase tracking-wider shadow-sm">
                  {members.length} {members.length === 1 ? "Person" : "People"}
                </div>
              </div>

              {/* Input area */}
              <div className="flex flex-col gap-4 bg-gray-50/60 dark:bg-white/5 p-4 sm:p-5 rounded-[20px] border border-gray-100/80 dark:border-white/10 shadow-inner">

                {/* Email input */}
                <div className="assigneeInputWrapper">
                  <input
                    ref={inputRef}
                    type="email"
                    placeholder="Invite by name or email..."
                    value={currentMember.email}
                    onChange={(e) => {
                      setCurrentMember({ ...currentMember, email: e.target.value });
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMember();
                      }
                    }}
                    className={`formInput${memberError ? " border-red-500" : ""}`}
                    disabled={isCreating}
                  />
                </div>

                {/* Name input (only for unknown emails) + role select + add button */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  {!availableUsers.some(
                    u => u.email.toLowerCase() === currentMember.email.toLowerCase()
                  ) && currentMember.email.trim() !== "" && (
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={currentMember.name}
                      onChange={(e) =>
                        setCurrentMember({ ...currentMember, name: e.target.value })
                      }
                      className="formInput flex-1"
                      disabled={isCreating}
                    />
                  )}

                  {/* Role select — uses shared .roleSelect, full-height on mobile */}
                  <select
                    value={currentMember.role}
                    onChange={(e) =>
                      setCurrentMember({
                        ...currentMember,
                        role: e.target.value as "viewer" | "editor",
                      })
                    }
                    className="roleSelect"
                    disabled={isCreating}
                  >
                    <option value="viewer">VIEWER</option>
                    <option value="editor">EDITOR</option>
                  </select>

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!currentMember.email.trim() || isCreating}
                    className="btnPrimary flex items-center justify-center gap-2 px-5 shrink-0"
                  >
                    <Plus size={17} />
                    <span>Add</span>
                  </button>
                </div>

                {/* Inline error */}
                {memberError && (
                  <div className="text-red-500 text-xs font-medium flex items-center gap-1 animate-fadeIn">
                    <Info size={12} />
                    {memberError}
                  </div>
                )}
              </div>

              {/* Member list */}
              {members.length > 0 ? (
                <div className="memberList mt-4 space-y-2 max-h-[280px] overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
                  {members.map((m, i) => (
                    <div
                      key={m.email}
                      className="memberItem animate-fadeInUp"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {/* Avatar */}
                      <div className="memberItem__avatar">
                        {(m.name || m.email).substring(0, 2).toUpperCase()}
                      </div>

                      {/* Name + email */}
                      <div className="memberItem__info">
                        <div className="name">{m.name || "External User"}</div>
                        <div className="email">{m.email}</div>
                      </div>

                      {/* Role + remove — compact variant */}
                      <select
                        value={m.role}
                        onChange={(e) => {
                          const updated = [...members];
                          updated[i].role = e.target.value as "viewer" | "editor";
                          setMembers(updated);
                        }}
                        className="roleSelect roleSelect--compact"
                        disabled={isCreating}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.email)}
                        className="memberItem__removeBtn"
                        disabled={isCreating}
                        aria-label="Remove member"
                      >
                        <UserMinus size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 p-7 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-center">
                  <p className="text-gray-400 text-sm italic">
                    No members yet. Start by inviting someone!
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="modalActions !mt-8 pt-5 border-t border-gray-100 dark:border-white/5">
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
                className="btnPrimary"
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
    </>
  );
};

export default CreateBoardModal;