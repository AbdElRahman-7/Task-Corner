"use client";

import Link from "next/link";
import { type Board as BoardType } from "../../types/index";

interface BoardProps {
  board: BoardType;
}

const Board = ({ board }: BoardProps) => {
  return (
    <Link href={`/board/${board.id}`} className="boardCard">
      <div>
        <h2 className="boardCard__title">{board.title}</h2>
      </div>

      <div className="boardCard__meta">
        <span className="boardCard__count">
          {board.listIds?.length || 0} columns
        </span>
        <div className="boardCard__arrow">→</div>
      </div>
    </Link>
  );
};

export default Board;