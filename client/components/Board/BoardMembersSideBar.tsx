"use client";
import { X, UserMinus, Shield, ShieldCheck, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@store/index";
import { updateMemberRoleDB, removeMemberDB, cancelInviteDB } from "@store/boardSlice";
import { AVATAR_COLORS, getInitials } from "../users/userUtils";
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
      <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-zinc-900 shadow-2xl z-[1201] flex flex-col border-l border-gray-200 dark:border-zinc-800 animate-slideInRight">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Board Members</h2>
              <p className="text-xs text-gray-500">{board.members.length + 1} members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Owner first */}
          <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/20 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold">
                {getInitials(isOwner ? currentUser?.username || "You" : ownerData?.username || "O")}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {isOwner ? "You (Owner)" : (ownerData?.username || "Owner")}
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600 text-white uppercase tracking-wider">
                   Owner
                </span>
             </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-zinc-800 my-4" />

          {board.members.map((member: any) => {
            const user = member.user;
            const userData = typeof user === 'string' 
              ? { username: 'User', email: '', _id: user } 
              : (user || { username: 'Unknown', email: '', _id: '' });
            
            const initials = getInitials(userData.username || "U");
            const charCode = userData.username?.charCodeAt(0) ?? 85; // 'U'
            const color = AVATAR_COLORS[charCode % AVATAR_COLORS.length];
            const userId = userData._id || (userData as any).id;

            return (
              <div key={userId} className="group p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${color.bg} ${color.text}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userData.username}</p>
                    <div className="flex items-center gap-2">
                       <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                         member.role === 'editor' 
                         ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                         : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                       }`}>
                         {member.role === 'editor' ? <ShieldCheck className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                         {member.role}
                       </span>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => handleUpdateRole(userId, member.role)}
                         className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 transition-colors"
                         title="Change Role"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handleRemoveMember(userId)}
                         className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
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
             <div className="text-center py-10">
                <p className="text-sm text-gray-400 italic">No other members yet</p>
             </div>
          )}

          {invites.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="h-px bg-gray-100 dark:bg-zinc-800 my-4" />
              <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-2 px-3 tracking-widest">Pending Invites</h3>
              {invites.map((invite: any) => {
                const initials = getInitials(invite.name || invite.email);
                return (
                  <div key={invite._id} className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex items-center gap-3 opacity-80">
                    <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-100 font-bold">
                       {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{invite.name || "Pending User"}</p>
                      <p className="text-[10px] text-gray-500 truncate">{invite.email}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-700 dark:bg-amber-800/50 dark:text-amber-200 uppercase tracking-wider mt-1">
                         Pending {invite.role}
                      </span>
                    </div>

                    {isOwner && (
                      <button 
                         onClick={() => handleCancelInvite(invite._id)}
                         className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
