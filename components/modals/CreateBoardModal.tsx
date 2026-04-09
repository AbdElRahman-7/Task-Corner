import React, { useState, useEffect } from "react";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

const CreateBoardModal = ({ isOpen, onClose, onCreate }: CreateBoardModalProps) => {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (isOpen) setTitle("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      onCreate(trimmedTitle);
      setTitle("");
      onClose();
    }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div 
        className="modal modal--small"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h2 className="modalTitle">New Workspace</h2>
          <p className="modalSubtitle">
            Organize your projects with a fresh board.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label htmlFor="board-title" className="formLabel">
              Board Title
            </label>
            <input
              id="board-title"
              autoFocus
              type="text"
              placeholder="e.g. Marketing Q2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="formInput"
            />
          </div>

          <div className="modalActions">
            <button
              type="button"
              onClick={onClose}
              className="btnSecondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="btnPrimary"
            >
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
