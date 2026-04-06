"use client";

import { useSelector, useDispatch } from "react-redux";
import Board from "@components/Board/Board";
import { RootState } from "@store/index";
import { addBoard } from "@store/boardSlice";

export default function Home() {
  const boards = useSelector((state: RootState) => state.boards.boards);
  const dispatch = useDispatch();

  const handleAddBoard = () => {
    const title = prompt("Enter board title");
    if (title) {
      const id = crypto.randomUUID();
      dispatch(addBoard({ id, title }));
    }
  };

  return (
    <div className="p-5">
      <button
        onClick={handleAddBoard}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Board
      </button>

      <div className="grid grid-cols-3 gap-4">
        {Object.values(boards).map((board) => (
          <Board key={board.id} board={board} />
        ))}
      </div>
    </div>
  );
}