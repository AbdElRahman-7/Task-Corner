"use client";
import Link from "next/link";
import List from "@components/List/List";
import { type Board as BoardType } from "../../types/index";

interface BoardProps {
  board: BoardType;
}

const Board = ({ board }: BoardProps) => {
  return (
    <Link href={`/board/${board.id}`} className="block">
      <div className="border p-4 rounded bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
        <h2 className="text-lg font-bold mb-4">{board.title}</h2>
      </div>
    </Link>
  );
};

export default Board;