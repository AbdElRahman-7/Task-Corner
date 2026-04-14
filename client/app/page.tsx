"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@store/index";
import { fetchBoards, addBoardDB } from "@store/boardSlice";
import Board from "@components/Board/Board";
import CreateBoardModal from "@components/modals/CreateBoardModal";
import { toast } from "react-hot-toast";

export default function Home() {
  const boards = useSelector((state: RootState) => state.boards.boards);
  const search = useSelector((state: RootState) => state.boards.filters.search);
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) {
      router.push("/login");
    } else if (mounted && token) {
      dispatch(fetchBoards());
    }
  }, [token, router, dispatch, mounted]);

  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!mounted || !token) return null; // Avoid flicker and hydration mismatch

  const handleCreateBoard = (title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    dispatch(addBoardDB(trimmedTitle));
    toast.success(`Board "${trimmedTitle}" created!`);
    setNewBoardTitle("");
  };

  const handleHeaderFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleCreateBoard(newBoardTitle);
  };
  const filteredBoards = Object.values(boards).filter(board =>
  board.title.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="homeContainer">
      <div className="homeHeader animate-fadeInUp">
        <div className="homeHeader__content">
          <span className="homeHeader__badge">WORKSPACE</span>
          <h1 className="homeHeader__title">Your Workspaces</h1>
          <p className="homeHeader__subtitle">
            Manage and organize all your project boards in one place.
          </p>
        </div>

        <form onSubmit={handleHeaderFormSubmit} className="homeHeader__form">
          <input
            type="text"
            placeholder="New board title..."
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            className="homeHeader__input"
          />
          <button
            type="submit"
            disabled={!newBoardTitle.trim()}
            className="homeHeader__submit"
          >
            Create Board
          </button>
        </form>
      </div>

      <div className="boardGrid">
        {filteredBoards.map((board, index) => (
          <div key={board.id} className="animate-springIn" style={{ "--i": index } as React.CSSProperties}>
            <Board board={board} />
          </div>
        ))}

        <div className="animate-springIn" style={{ "--i": Object.values(boards).length } as React.CSSProperties}>
          <button
            id="add-board-tile"
            onClick={() => setIsModalOpen(true)}
            className="addBoardBtn"
          >
            <div className="addBoardBtn__icon">+</div>
            <span className="addBoardBtn__text">New Workspace</span>
          </button>
        </div>
      </div>

      <CreateBoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateBoard}
      />
    </div>
  );
}