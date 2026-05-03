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
    <div className={`boardCard-wrapper group ${board.isArchived ? "boardCard-wrapper--archived" : ""}`}>
      <Link href={`/main/board/${board.id}`} className="boardCard">
        <div className="flex items-start justify-between">
          <h2 className="boardCard__title">{board.title}</h2>
          {board.isArchived && (
            <span className="boardCard__status">
              ARCHIVED
            </span>
          )}
        </div>

        <div className="boardCard__meta">
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
            
            <div className="avatarStack">
              {board.members?.slice(0, 5).map((member, i) => {
                const user = typeof member.user === 'object' && member.user !== null
                  ? member.user
                  : null;
                // If user isn't populated yet (raw string ID), skip rendering
                // rather than crashing — the backend fix makes this rare.
                if (!user) return null;
                const initials = user.username.substring(0, 2).toUpperCase();
                return (
                  <div 
                    key={user._id || (user as any).id || i} 
                    title={`${user.username} (${member.role})`}
                    className="avatarStack__item"
                  >
                    {initials}
                  </div>
                );
              })}
              {board.members && board.members.length > 5 && (
                <div className="avatarStack__more">
                  +{board.members.length - 5}
                </div>
              )}
            </div>
          </div>
          <div className="boardCard__arrow">
            →
          </div>
        </div>
      </Link>
      
      {/* Action Overlay */}
      <div className="boardCard__actions">
        {onArchive && (
          <button
            onClick={handleArchive}
            className={`boardActionBtn boardActionBtn--archive ${board.isArchived ? "active" : ""}`}
            title={board.isArchived ? "Restore Board" : "Archive Board"}
          >
            <Archive size={16} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="boardActionBtn boardActionBtn--delete"
            title="Delete Board"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Board;