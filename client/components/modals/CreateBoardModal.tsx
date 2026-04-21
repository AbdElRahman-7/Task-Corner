import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { apiFetch } from "@utils/api";
import { User, Search, X, ChevronDown } from "lucide-react";

interface MemberInput {
  name: string;
  email: string;
  role: "viewer" | "editor";
}

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, members: MemberInput[]) => void;
  initialTitle?: string;
}

const CreateBoardModal = ({ isOpen, onClose, onCreate, initialTitle = "" }: CreateBoardModalProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [members, setMembers] = useState<MemberInput[]>([]);
  const [currentMember, setCurrentMember] = useState<MemberInput>({
    name: "",
    email: "",
    role: "viewer"
  });

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setMembers([]);
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
      console.error("Failed to fetch users for suggestions");
    }
  };

  const handleAddMember = () => {
    if (currentMember.email.trim()) {
      setMembers([...members, { ...currentMember }]);
      setCurrentMember({ name: "", email: "", role: "viewer" });
      setShowSuggestions(false);
    }
  };

  const handleSelectUser = (user: any) => {
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

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      onCreate(trimmedTitle, members);
      onClose();
    }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div 
        className="modal modal--medium"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="modalHeader">
          <h2 className="modalTitle">New Workspace</h2>
          <p className="modalSubtitle">
            Organize your projects and invite your team.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label htmlFor="board-title" className="formLabel">
              Board Title
            </label>
            <input
              id="board-title"
              autoFocus
              type="text"
              placeholder="e.g. Marketing Q2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="formInput"
              required
            />
          </div>

          <div className="divider my-6 border-t border-gray-100 dark:border-zinc-800" />

          <div className="membersSection mt-8">
            <div className="flex items-center justify-between mb-4">
              <label className="formLabel">Collaborators</label>
              <div className="text-[10px] font-black uppercase text-blue-500 tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">
                {members.length} STAGED
              </div>
            </div>
            
            <div className="memberInputRow">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={16} strokeWidth={2.5} />
                </span>
                <input
                  type="email"
                  placeholder="Invite by name or email..."
                  value={currentMember.email}
                  onChange={(e) => {
                    setCurrentMember({...currentMember, email: e.target.value});
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="formInput pl-10 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown size={16} />
                </span>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-2xl mt-2 z-50 overflow-hidden animate-springIn">
                    <div className="px-3 py-2 bg-gray-50 dark:bg-white/5 text-[10px] font-bold uppercase text-gray-400">
                      Suggested Results
                    </div>
                    {filteredSuggestions.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {(u.username || 'U').substring(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate text-gray-900 dark:text-gray-100">{u.username}</div>
                          <div className="text-[11px] opacity-60 truncate">{u.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!availableUsers.some(u => u.email.toLowerCase() === currentMember.email.toLowerCase()) && currentMember.email.trim() !== "" && (
                <div className="animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Full Name (optional)"
                    value={currentMember.name}
                    onChange={(e) => setCurrentMember({...currentMember, name: e.target.value})}
                    className="formInput h-full"
                  />
                </div>
              )}

              <select
                value={currentMember.role}
                onChange={(e) => setCurrentMember({...currentMember, role: e.target.value as "viewer" | "editor"})}
                className="formInput h-full"
              >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>

                <button 
                  type="button" 
                  onClick={handleAddMember}
                  disabled={!currentMember.email.trim()}
                  className="btnPrimary"
                  style={{ padding: '0 1.5rem', minWidth: 'auto' }}
                >
                  ADD
                </button>
              </div>

            {members.length > 0 && (
              <div className="memberList mt-6">
                {members.map((m, i) => (
                  <div key={i} className="memberItem group">
                    <div className="memberItem__avatar">
                      {(m.name || m.email).substring(0,2).toUpperCase()}
                    </div>
                    <div className="memberItem__info">
                      <span className="name truncate">{m.name || 'External User'}</span>
                      <span className="email truncate">{m.email}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <select 
                        value={m.role}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[i].role = e.target.value as "viewer" | "editor";
                          setMembers(newMembers);
                        }}
                        className="roleSelect"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMember(i)}
                        className="memberRemoveBtn"
                        title="Remove member"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modalActions">
            <button
              type="button"
              onClick={onClose}
              className="btnSecondary"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="btnPrimary"
            >
              CREATE BOARD
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
