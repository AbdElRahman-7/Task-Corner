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
      <Link href={`/main/board/${board.id}`} className="boardCard">
        <div>
          <h2 className="boardCard__title">{board.title}</h2>
          {board.isArchived && <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">Archived</span>}
        </div>

        <div className="boardCard__meta">
          <div className="flex flex-col gap-2">
            <span className="boardCard__count">
              {board.listIds?.length || 0} columns
            </span>
            <div className="flex -space-x-2 overflow-hidden">
              {board.members?.slice(0, 4).map((member, i) => {
                const user = typeof member.user === 'object' ? member.user : null;
                if (!user) return null;
                return (
                  <div 
                    key={user._id || (user as any).id} 
                    title={`${user.username} (${member.role})`}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold uppercase"
                  >
                    {user.username.substring(0, 2)}
                  </div>
                );
              })}
              {board.members && board.members.length > 4 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white bg-gray-100 text-[10px] font-bold text-gray-500 dark:ring-zinc-900 dark:bg-zinc-800">
                  +{board.members.length - 4}
                </div>
              )}
            </div>
          </div>
          <div className="boardCard__arrow">→</div>
        </div>
      </Link>
      
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
        {onArchive && (
          <button
            onClick={handleArchive}
            className={`p-1.5 rounded-lg transition-all ${board.isArchived ? "bg-amber-50 text-amber-500 hover:bg-amber-500" : "bg-blue-50 text-blue-500 hover:bg-blue-500"} hover:text-white`}
            title={board.isArchived ? "Restore Board" : "Archive Board"}
          >
            <Archive className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-red-50 text-red-500 transition-all hover:bg-red-500 hover:text-white"
            title="Delete Board"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Board;