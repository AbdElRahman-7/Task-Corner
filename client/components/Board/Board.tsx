"use client";

import Link from "next/link";
import { type Board as BoardType } from "@appTypes/index";
import { Trash2, Archive } from "lucide-react";

interface BoardProps {
  board: BoardType;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

const Board = ({ board, onDelete, onArchive }: BoardProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete(board.id);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onArchive) onArchive(board.id);
  };

  return (
    <div className={`boardCard-wrapper group relative ${board.isArchived ? "opacity-60 grayscale-[0.5]" : ""}`}>
      <Link href={`/main/board/${board.id}`} className="boardCard transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="boardCard__title text-lg md:text-xl font-black">{board.title}</h2>
          {board.isArchived && (
            <span className="text-[9px] uppercase font-black tracking-tighter text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
              ARCHIVED
            </span>
          )}
        </div>

        <div className="boardCard__meta mt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                {board.listIds?.length || 0} STACKS
              </span>
              <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                {board.members?.length || 0} MEMBERS
              </span>
            </div>
            
            <div className="flex -space-x-2.5 overflow-hidden p-0.5">
              {board.members?.slice(0, 5).map((member, i) => {
                const user = typeof member.user === 'object' ? member.user : null;
                if (!user) return null;
                return (
                  <div 
                    key={user._id || (user as any).id} 
                    title={`${user.username} (${member.role})`}
                    className="inline-block h-8 w-8 rounded-full ring-4 ring-white dark:ring-zinc-900 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] text-white font-black uppercase shadow-sm"
                  >
                    {user.username.substring(0, 2)}
                  </div>
                );
              })}
              {board.members && board.members.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white bg-gray-100 text-[10px] font-black text-gray-500 dark:ring-zinc-900 dark:bg-zinc-800">
                  +{board.members.length - 5}
                </div>
              )}
            </div>
          </div>
          <div className="boardCard__arrow bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 h-10 w-10 rounded-xl flex items-center justify-center font-black transition-all  group-hover:text-white group-hover:scale-110">
            →
          </div>
        </div>
      </Link>
      
      {/* Action Overlay - Always visible on mobile, hover on desktop */}
      <div className="absolute top-4 right-4 flex gap-2 transition-all z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <div className="flex items-center gap-1.5 p-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-zinc-800/50">
          {onArchive && (
            <button
              onClick={handleArchive}
              className={`p-2 rounded-xl transition-all active:scale-90 ${board.isArchived ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white"}`}
              title={board.isArchived ? "Restore Board" : "Archive Board"}
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl bg-red-50 text-red-500 transition-all hover:bg-red-500 hover:text-white active:scale-90"
              title="Delete Board"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;