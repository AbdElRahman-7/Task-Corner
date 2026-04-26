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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[1200] transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 bg-white dark:bg-zinc-900 shadow-2xl z-[1201] flex flex-col border-l border-gray-200 dark:border-zinc-800 animate-slideInRight">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl hidden sm:block">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Board Members</h2>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{board.members.length + 1} ACTIVE MEMBERS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-90">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Owner first */}
          <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/20 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-violet-600/20">
                {getInitials(isOwner ? currentUser?.username || "You" : ownerData?.username || "O")}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                  {isOwner ? "You (Owner)" : (ownerData?.username || "Owner")}
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-violet-600 text-white uppercase tracking-tighter">
                   WORKSPACE OWNER
                </span>
             </div>
          </div>

          <div className="flex items-center gap-2 py-2">
             <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800" />
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Members</span>
             <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800" />
          </div>

          {board.members.map((member: any, index: number) => {
            const user = member.user;
            const userData = typeof user === 'string' 
              ? { username: 'User', email: '', _id: user } 
              : (user || { username: 'Unknown', email: '', _id: '' });
            
            const initials = getInitials(userData.username || "U");
            const charCode = userData.username?.charCodeAt(0) ?? 85; // 'U'
            const color = AVATAR_COLORS[charCode % AVATAR_COLORS.length];
            const userId = userData._id || (userData as any).id;

            return (
              <div key={member._id || userId || `member-${index}`} className="group p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-gray-100 dark:hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${color.bg} ${color.text}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userData.username}</p>
                    <div className="flex items-center gap-2">
                       <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                         member.role === 'editor' 
                         ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                         : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                       }`}>
                         {member.role === 'editor' ? <ShieldCheck className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                         {member.role}
                       </span>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => handleUpdateRole(userId, member.role)}
                         className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 transition-all active:scale-90"
                         title="Change Role"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handleRemoveMember(userId)}
                         className="p-2 rounded-xl hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 transition-all active:scale-90"
                         title="Remove Member"
                      >
                         <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {board.members.length === 0 && invites.length === 0 && (
             <div className="text-center py-12 px-6">
                <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <User className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 font-medium italic">Collaborate by inviting your team members to this board.</p>
             </div>
          )}

          {invites.length > 0 && (
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-2 py-2">
                 <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800" />
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Waiting for Join</span>
                 <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800" />
              </div>
              
              {invites.map((invite: any, index: number) => {
                const initials = getInitials(invite.name || invite.email);
                return (
                  <div key={invite._id || `invite-${index}`} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/5 border border-amber-100/50 dark:border-amber-900/10 flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-black">
                       {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{invite.name || "Pending User"}</p>
                      <p className="text-[10px] text-gray-500 font-medium truncate">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white uppercase tracking-tighter">
                           PENDING {invite.role}
                        </span>
                      </div>
                    </div>

                    {isOwner && (
                      <button 
                         onClick={() => handleCancelInvite(invite._id)}
                         className="p-2 rounded-xl hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 transition-all md:opacity-0 md:group-hover:opacity-100 active:scale-90"
                         title="Cancel Invitation"
                      >
                         <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
