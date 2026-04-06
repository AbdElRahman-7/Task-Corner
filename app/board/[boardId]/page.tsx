"use client";

import { use, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@store/index";
import { addCustomList } from "@store/boardSlice";
import Link from "next/link";


export default function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params);
  const [newListTitle, setNewListTitle] = useState("");
  const dispatch = useDispatch();
  const board = useSelector((state: RootState) => state.boards.boards[boardId]);
  const lists = useSelector((state: RootState) =>
    Object.values(state.boards.lists).filter(
      (list) => list.boardId === boardId,
    ),
  );

  if (!board) return <div>Board not found</div>;
  const handleAddCustomList = () => {
    if (!newListTitle.trim()) return;
    dispatch(addCustomList({ boardId, title: newListTitle.trim() }));
    setNewListTitle("");
  };
  return (
    <div className="p-6">
      <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to boards
      </Link>

      <h1 className="font-bold text-2xl mb-4">{board.title}</h1>

      <div className="flex gap-4 items-start">
        {lists.map(list => (
          <div key={list.id} className="bg-gray-100 p-4 rounded w-64 text-black">
            <h2 className="font-semibold mb-2">{list.title}</h2>
          </div>
        ))}

        <div className="w-64 p-4">
          <input
            type="text"
            placeholder="New list title"
            value={newListTitle}
            onChange={e => setNewListTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleAddCustomList();
            }}
            className="w-full p-2 text-white mb-2 border rounded"
          />
          <button
            onClick={handleAddCustomList}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add List
          </button>
        </div>
      </div>
    </div>
  );
}
