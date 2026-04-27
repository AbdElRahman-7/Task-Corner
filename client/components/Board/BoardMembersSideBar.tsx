"use client";
import { X, UserMinus, Shield, ShieldCheck, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@store/index";
import { updateMemberRoleDB, removeMemberDB, cancelInviteDB } from "@store/boardSlice";
import { AVATAR_COLORS, getInitials } from "@components/users/userUtils";
import { toast } from "react-hot-toast";

interface BoardMembersSideBarProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BoardMembersSideBar({ boardId, isOpen, onClose }: BoardMembersSideBarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const board = useSelector((state: RootState) => state.boards.boards[boardId]);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const invites = useSelector((state: RootState) => (state.boards.invites?.[boardId]) || []);
  
  if (!board || !isOpen) return null;

  const ownerData: any = typeof board.owner === 'object' ? board.owner : { _id: board.owner, username: "Owner" };
  const isOwner = (ownerData?._id || ownerData?.id) === currentUser?._id;

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "viewer" ? "editor" : "viewer";
    try {
      await dispatch(updateMemberRoleDB({ boardId, userId, role: newRole })).unwrap();
      toast.success(`Role updated to ${newRole}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await dispatch(removeMemberDB({ boardId, userId })).unwrap();
      toast.success("Member removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!window.confirm("Are you sure you want to cancel this invitation?")) return;
    try {
      await dispatch(cancelInviteDB({ boardId, inviteId })).unwrap();
      toast.success("Invitation cancelled");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel invitation");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1150] animate-fadeIn" onClick={onClose} />
      
      <div className="memberSidebar">
        <div className="memberSidebar__header">
          <div className="memberSidebar__title">
            <h2>Board Members</h2>
            <span>{board.members.length + 1} Active Members</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="memberSidebar__content">
          {/* Owner Section */}
          <div className="memberSidebar__section">
            <div className="memberSidebar__sectionTitle">Workspace Owner</div>
            <div className="memberItem" style={{ borderLeft: '4px solid #7c3aed' }}>
               <div className="memberAvatar" style={{ background: '#7c3aed' }}>
                  {getInitials(isOwner ? currentUser?.username || "You" : ownerData?.username || "O")}
               </div>
               <div className="memberItem__info">
                  <div className="memberItem__name">
                    {isOwner ? "You (Owner)" : (ownerData?.username || "Owner")}
                  </div>
                  <div className="memberItem__role memberItem__role--owner">
                     <ShieldCheck size={10} />
                     <span>Owner</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="memberSidebar__section">
            <div className="memberSidebar__sectionTitle">Team Members</div>
            {board.members.map((member: any, index: number) => {
              const user = member.user;
              const userData = typeof user === 'string' 
                ? { username: 'User', email: '', _id: user } 
                : (user || { username: 'Unknown', email: '', _id: '' });
              
              const initials = getInitials(userData.username || "U");
              const charCode = userData.username?.charCodeAt(0) ?? 85;
              const color = AVATAR_COLORS[charCode % AVATAR_COLORS.length];
              const userId = userData._id || (userData as any).id;

              return (
                <div key={member._id || userId || `member-${index}`} className="memberItem">
                  <div className={`memberAvatar ${color.bg} ${color.text}`}>
                    {initials}
                  </div>
                  <div className="memberItem__info">
                    <div className="memberItem__name">{userData.username}</div>
                    <div className={`memberItem__role memberItem__role--${member.role}`}>
                       {member.role === 'editor' ? <ShieldCheck size={10} /> : <Shield size={10} />}
                       <span>{member.role}</span>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="memberItem__actions">
                      <button 
                         onClick={() => handleUpdateRole(userId, member.role)}
                         className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500"
                         title="Change Role"
                      >
                        <Shield size={16} />
                      </button>
                      <button 
                         onClick={() => handleRemoveMember(userId)}
                         className="p-2 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20"
                         title="Remove Member"
                      >
                         <UserMinus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {board.members.length === 0 && invites.length === 0 && (
              <div className="text-center py-8 opacity-50 italic text-sm">
                No team members yet.
              </div>
            )}
          </div>

          {/* Invites Section */}
          {invites.length > 0 && (
            <div className="memberSidebar__section">
              <div className="memberSidebar__sectionTitle">Pending Invitations</div>
              {invites.map((invite: any, index: number) => (
                <div key={invite._id || `invite-${index}`} className="memberItem" style={{ opacity: 0.7 }}>
                  <div className="memberAvatar bg-amber-100 text-amber-600">
                    {getInitials(invite.name || invite.email)}
                  </div>
                  <div className="memberItem__info">
                    <div className="memberItem__name">{invite.name || "Pending User"}</div>
                    <div className="memberItem__role memberItem__role--viewer" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                       <span>Pending {invite.role}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="memberItem__actions">
                      <button 
                         onClick={() => handleCancelInvite(invite._id)}
                         className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                         title="Cancel Invitation"
                      >
                         <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
