"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@store/index";
import { fetchBoards, addBoardDB, deleteBoardDB, updateBoardDB } from "@store/boardSlice";
import Board from "@components/Board/Board";
import CreateBoardModal from "@components/modals/CreateBoardModal";
import InviteModal from "@components/modals/InviteModal";
import { toast } from "react-hot-toast";
import type { AppDispatch } from "@store/index";
export default function Home() {
  const boards = useSelector((state: RootState) => state.boards.boards);
  const search = useSelector((state: RootState) => state.boards.filters.search);
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) {
      router.push("/main/auth/login");
    } else if (mounted && token) {
      dispatch(fetchBoards());
    }
  }, [token, router, dispatch, mounted]);

  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  if (!mounted || !token) return null; // Avoid flicker and hydration mismatch

  const handleCreateBoard = async (title: string, members?: { name: string; email: string; role: "viewer" | "editor" }[]) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    try {
      await dispatch(addBoardDB({ title: trimmedTitle, members })).unwrap();
      toast.success(`Board "${trimmedTitle}" created!`);
      setNewBoardTitle("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create board");
    }
  };

  const handleDeleteBoard = async (id: string) => {
    const boardTitle = boards[id]?.title || "this board";
    if (!window.confirm(`Are you sure you want to delete "${boardTitle}"? This will permanently delete all lists and tasks within it.`)) return;

    try {
      await dispatch(deleteBoardDB(id)).unwrap();
      toast.success("Board deleted successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete board");
    }
  };

  const handleArchiveBoard = async (id: string) => {
    const board = boards[id];
    if (!board) return;
    const newStatus = !board.isArchived;

    try {
      await dispatch(updateBoardDB({ id, updates: { isArchived: newStatus } })).unwrap();
      toast.success(newStatus ? "Board archived" : "Board restored");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update board");
    }
  };

  const handleHeaderFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const filteredActiveBoards = Object.values(boards).filter(board => {
    const matchesSearch = board.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && !board.isArchived;
  });

  const filteredArchivedBoards = Object.values(boards).filter(board => {
    const matchesSearch = board.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && board.isArchived;
  });

  const archivedCount = Object.values(boards).filter(b => b.isArchived).length;
  const activeCount = Object.values(boards).filter(b => !b.isArchived).length;

  return (
    <div className="homeContainer pb-20">
      {/* Header Section */}
      <div className="homeHeader animate-fadeInUp">
        <div className="homeHeader__content">
          <span className="homeHeader__badge">WORKSPACE</span>
          <h1 className="homeHeader__title">Your Workspaces</h1>
          <p className="homeHeader__subtitle">
            Manage and organize all your project boards in one place.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsInviteOpen(true)}
              className="inviteBtn"
              style={{
                marginTop: '1rem',
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)',
                transition: 'transform 0.2s'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>+</span> 
              Invite Members
            </button>
          </div>
        </div>

        <form onSubmit={handleHeaderFormSubmit} className="homeHeader__form">
          <input
            type="text"
            placeholder="Your board idea..."
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            className="homeHeader__input"
          />
          <button
            type="submit"
            className="homeHeader__submit"
          >
            Create Board
          </button>
        </form>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-8 mb-8 border-b border-gray-200 dark:border-zinc-800 px-2">
        <button 
          onClick={() => setActiveTab("active")}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === "active" 
            ? "text-blue-600 border-blue-600" 
            : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Active Boards ({activeCount})
        </button>
        <button 
          onClick={() => setActiveTab("archived")}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === "archived" 
            ? "text-amber-600 border-amber-600" 
            : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Archived ({archivedCount})
        </button>
      </div>

      {/* Grid Content */}
      <div className="animate-fadeIn">
        {activeTab === "active" ? (
          <div className="boardGrid">
            {filteredActiveBoards.length > 0 ? (
              filteredActiveBoards.map((board, index) => (
                <div key={board.id} className="animate-springIn" style={{ "--i": index } as React.CSSProperties}>
                  <Board 
                    board={board} 
                    onDelete={handleDeleteBoard} 
                    onArchive={handleArchiveBoard}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-gray-400 italic">No active boards found.</p>
              </div>
            )}

            <div className="animate-springIn" style={{ "--i": filteredActiveBoards.length } as React.CSSProperties}>
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
        ) : (
          <div className="boardGrid">
            {filteredArchivedBoards.length > 0 ? (
              filteredArchivedBoards.map((board, index) => (
                <div key={board.id} className="animate-springIn" style={{ "--i": index } as React.CSSProperties}>
                  <Board 
                    board={board} 
                    onDelete={handleDeleteBoard} 
                    onArchive={handleArchiveBoard}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-400 italic">
                Your archive is empty.
              </div>
            )}
          </div>
        )}
      </div>

      <CreateBoardModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewBoardTitle("");
        }}
        onCreate={handleCreateBoard}
        initialTitle={newBoardTitle}
      />

      <InviteModal
        workspaceId="default-workspace"
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  );
}