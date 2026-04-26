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
      console.log("Failed to fetch users for suggestions");
      console.error(error);
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
    <div className="backdrop z-[1100]" onClick={onClose}>
      <div 
        className="modal modal--medium w-[95%] sm:w-full"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '650px' }}
      >
        <div className="modalHeader p-6 md:p-8">
          <h2 className="modalTitle text-xl md:text-2xl">New Workspace</h2>
          <p className="modalSubtitle text-xs md:text-sm">
            Organize your projects and invite your team to collaborate in real-time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 md:px-8 pb-8">
          <div className="formGroup">
            <label htmlFor="board-title" className="formLabel text-[10px] uppercase font-black tracking-widest mb-3 block">
              Workspace Title
            </label>
            <input
              id="board-title"
              autoFocus
              type="text"
              placeholder="e.g. Marketing Launch Q2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="formInput text-sm p-4 rounded-xl"
              required
            />
          </div>

          <div className="divider my-8 border-t border-gray-100 dark:border-zinc-800" />

          <div className="membersSection">
            <div className="flex items-center justify-between mb-4">
              <label className="formLabel text-[10px] uppercase font-black tracking-widest">Team Members</label>
              <div className="text-[9px] font-black uppercase text-blue-500 tracking-tighter bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">
                {members.length} READY TO JOIN
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Search size={18} strokeWidth={2.5} />
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
                  className="formInput pl-12 pr-4 py-4 rounded-xl text-sm"
                />
                
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-2xl shadow-2xl mt-2 z-50 overflow-hidden animate-springIn ring-4 ring-black/5">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Quick Results
                    </div>
                    {filteredSuggestions.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-all border-b border-gray-50 dark:border-zinc-800 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">
                          {(u.username || 'U').substring(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black truncate text-gray-900 dark:text-gray-100">{u.username}</div>
                          <div className="text-[11px] font-medium text-gray-500 truncate">{u.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {!availableUsers.some(u => u.email.toLowerCase() === currentMember.email.toLowerCase()) && currentMember.email.trim() !== "" && (
                  <div className="flex-1 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={currentMember.name}
                      onChange={(e) => setCurrentMember({...currentMember, name: e.target.value})}
                      className="formInput p-4 rounded-xl text-sm"
                    />
                  </div>
                )}

                <select
                  value={currentMember.role}
                  onChange={(e) => setCurrentMember({...currentMember, role: e.target.value as "viewer" | "editor"})}
                  className="p-4 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-w-[140px]"
                >
                  <option value="viewer">VIEWER</option>
                  <option value="editor">EDITOR</option>
                </select>

                <button 
                  type="button" 
                  onClick={handleAddMember}
                  disabled={!currentMember.email.trim()}
                  className="btnPrimary py-4 px-8 rounded-xl font-black text-xs shadow-lg shadow-blue-500/20"
                >
                  ADD TO LIST
                </button>
              </div>
            </div>

            {members.length > 0 && (
              <div className="memberList mt-8 space-y-3">
                {members.map((m, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 transition-all gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                        {(m.name || m.email).substring(0,2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-black text-gray-900 dark:text-gray-100 truncate">{m.name || 'External User'}</span>
                        <span className="block text-[11px] font-medium text-gray-500 truncate">{m.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <select 
                        value={m.role}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[i].role = e.target.value as "viewer" | "editor";
                          setMembers(newMembers);
                        }}
                        className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-zinc-700 outline-none flex-1 sm:flex-none"
                      >
                        <option value="viewer">VIEWER</option>
                        <option value="editor">EDITOR</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMember(i)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove member"
                      >
                        <X size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modalActions mt-12 flex flex-col-reverse sm:flex-row gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-xs font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all uppercase tracking-widest"
            >
              DISCARD
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-[2] btnPrimary py-4 px-10 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/30"
            >
              CREATE WORKSPACE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
