"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { apiFetch } from "@utils/api";
import { Search, X, Plus } from "lucide-react";

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
      console.error("Failed to fetch users for suggestions", error);
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
      >
        <button className="modalClose" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <h2 className="modalTitle">New Workspace</h2>
          <p className="modalSubtitle">
            Organize your projects and invite your team to collaborate in real-time.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
            />
          </div>

          <div className="divider" />

          <div className="membersSection">
            <div className="flex justify-between items-center mb-4">
              <label className="formLabel">Team Members</label>
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-1 rounded">
                {members.length} ADDED
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="relative">
                <div className="assigneeInputWrapper">
                  <input
                    type="email"
                    placeholder="Invite by name or email..."
                    value={currentMember.email}
                    onChange={(e) => {
                      setCurrentMember({...currentMember, email: e.target.value});
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="formInput"
                  />
                </div>
                
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="suggestionMenu">
                    <div className="suggestionMenu__header">Quick Results</div>
                    {filteredSuggestions.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className="suggestionMenu__item"
                      >
                        <div className="avatar">
                          {(u.username || 'U').substring(0,2).toUpperCase()}
                        </div>
                        <div className="info">
                          <span className="name">{u.username}</span>
                          <span className="email">{u.email}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {!availableUsers.some(u => u.email.toLowerCase() === currentMember.email.toLowerCase()) && currentMember.email.trim() !== "" && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={currentMember.name}
                    onChange={(e) => setCurrentMember({...currentMember, name: e.target.value})}
                    className="formInput flex-1"
                  />
                )}

                <select
                  value={currentMember.role}
                  onChange={(e) => setCurrentMember({...currentMember, role: e.target.value as "viewer" | "editor"})}
                  className="assignments__roleSelect h-12"
                >
                  <option value="viewer">VIEWER</option>
                  <option value="editor">EDITOR</option>
                </select>

                <button 
                  type="button" 
                  onClick={handleAddMember}
                  disabled={!currentMember.email.trim()}
                  className="assignments__addBtn h-12"
                >
                  <Plus size={16} />
                  Add to List
                </button>
              </div>
            </div>

            {members.length > 0 && (
              <div className="memberList">
                {members.map((m, i) => (
                  <div key={i} className="memberItem">
                    <div className="memberItem__avatar">
                      {(m.name || m.email).substring(0,2).toUpperCase()}
                    </div>
                    <div className="memberItem__info">
                      <div className="name">{m.name || 'External User'}</div>
                      <div className="email">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
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
                        className="assignments__removeBtn"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modalActions mt-8">
            <button
              type="button"
              onClick={onClose}
              className="btnSecondary"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="btnPrimary"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
