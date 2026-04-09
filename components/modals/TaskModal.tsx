import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Task } from "../../types/index";
import { updateTask, deleteTask } from "../../store/boardSlice";
import { RootState } from "../../store/index";
import { 
  X, 
  AlignLeft, 
  CheckSquare, 
  Tag, 
  AlertCircle, 
  Trash2, 
  Type,
  Plus,
  Save,
  User,
  Clock,
} from "lucide-react";

import CustomSelect from "../Filters/CustomSelect";
import { addLabel, deleteLabel } from "../../store/boardSlice";
import { toast } from "react-hot-toast";

interface TaskModalProps {
  taskId: string;
  listId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TaskModal = ({ taskId, listId, isOpen, onClose }: TaskModalProps) => {
  const dispatch = useDispatch();
  
  const tasks = useSelector((state: RootState) => state.boards.tasks);
  const task = tasks[taskId];
  const lists = useSelector((state: RootState) => state.boards.lists);
  const allLabels = useSelector((state: RootState) => state.boards.labels);
  const listTitle = lists[listId]?.title || "Unknown List";
  
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newLabelTitle, setNewLabelTitle] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSaveChanges = () => {
    toast.success("Changes saved successfully!");
    handleClose();
  };


  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleClose]);

  if (!isOpen || !task) return null;

  const handleUpdate = (updates: Partial<Task>) => {
    dispatch(updateTask({ taskId: task.id, updates, listId }));
  };

  const handleToggleCheckItem = (itemId: string) => {
    const newChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    handleUpdate({ checklist: newChecklist });
  };

  const handleAddCheckItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const newItem = {
      id: crypto.randomUUID(),
      text: newCheckItem.trim(),
      done: false,
    };
    handleUpdate({ checklist: [...task.checklist, newItem] });
    setNewCheckItem("");
  };

  const handleDeleteCheckItem = (itemId: string) => {
    const newChecklist = task.checklist.filter((item) => item.id !== itemId);
    handleUpdate({ checklist: newChecklist });
  };

  const handleToggleLabel = (labelId: string) => {
    const newLabels = task.labels.includes(labelId)
      ? task.labels.filter(id => id !== labelId)
      : [...task.labels, labelId];
    handleUpdate({ labels: newLabels });
  };

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelTitle.trim()) return;
    const labelId = crypto.randomUUID();
    dispatch(addLabel({ id: labelId, title: newLabelTitle.trim(), color: newLabelColor }));
    setNewLabelTitle("");
    toast.success(`Label "${newLabelTitle}" created!`);
  };

  const globalDeleteLabel = (labelId: string) => {
    if (window.confirm("Delete this label globally?")) {
      dispatch(deleteLabel(labelId));
      toast.success("Label deleted");
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      dispatch(deleteTask({ listId, taskId: task.id }));
      onClose();
    }
  };

  const progress = task.checklist.length > 0
    ? (task.checklist.filter(i => i.done).length / task.checklist.length) * 100
    : 0;

  return (
    <div className="backdrop" onClick={handleClose}>
      <div className="modal modal--task" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modalClose" onClick={handleClose} aria-label="Close Modal">
          <X size={24} />
        </button>

        <div className="modalHeader">
          <div className="modalTitleRow">
            <Type className="modalHeaderIcon" size={28} />
            <input
              type="text"
              value={task.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="modalTitleInput"
              placeholder="Task Title"
            />
          </div>
          <p className="modalSubtitle">
            in list <span className="modalSubtitleList">{listTitle}</span>
          </p>
        </div>

        <div className="taskContent">
          <div className="mainSection">
            <div className="formGroup">
              <div className="sectionHeader">
                <AlignLeft size={18} />
                <label className="formLabel">Description</label>
              </div>
              <textarea
                value={task.description}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                placeholder="Add a more detailed description..."
                className="formTextarea"
              />
            </div>

            <div className="formGroup">
              <div className="sectionHeader">
                <CheckSquare size={18} />
                <label className="formLabel">Checklist</label>
              </div>
              
              <div className="progressContainer">
                <div className="progressHeader">
                  <span className="progressLabel">{Math.round(progress)}% Complete</span>
                  <label className="autoDoneToggle">
                    <input 
                      type="checkbox" 
                      checked={task.autoDone} 
                      onChange={(e) => handleUpdate({ autoDone: e.target.checked })}
                      className="autoDoneCheckbox"
                    />
                    <span>Auto-complete when finished</span>
                  </label>
                </div>
                <div className="progressTrack">
                  <div className="progressBar" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="checklistItems">
                {task.checklist.map((item) => (
                  <div key={item.id} className="checkItem">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleCheckItem(item.id)}
                      className="checkbox"
                    />
                    <span 
                      className={`checkLabel ${item.done ? 'checkLabel--done' : ''}`}
                      onClick={() => handleToggleCheckItem(item.id)}
                    >
                      {item.text}
                    </span>
                    <button 
                      className="checkItem__delete" 
                      onClick={() => handleDeleteCheckItem(item.id)}
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddCheckItem} className="addCheckItemForm">
                <Plus size={16} className="addCheckIcon" />
                <input
                  type="text"
                  placeholder="Add an item..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  className="addCheckInput"
                />
              </form>
            </div>
          </div>

          <div className="sidebar">
            <div className="sidebarSection">
              <div className="sidebarSectionHeader">
                <Tag size={14} />
                <span>Labels</span>
              </div>
              <div className="labelGrid">
                {Object.values(allLabels).map((label) => (
                  <div key={label.id} className="labelItem">
                    <button
                      className={`labelToggle ${task.labels.includes(label.id) ? 'labelToggle--active' : ''}`}
                      style={{ backgroundColor: label.color }}
                      onClick={() => handleToggleLabel(label.id)}
                      title={label.title}
                    >
                      {label.title}
                    </button>
                    <button 
                      className="labelDeleteBtn" 
                      onClick={(e) => { e.stopPropagation(); globalDeleteLabel(label.id); }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateLabel} className="addLabelForm">
                <input
                  type="text"
                  placeholder="New label..."
                  value={newLabelTitle}
                  onChange={(e) => setNewLabelTitle(e.target.value)}
                  className="addLabelInput"
                />
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="addLabelColor"
                />
                <button type="submit" className="addLabelBtn">
                  <Plus size={14} />
                </button>
              </form>
            </div>

            <div className="sidebarSection">
              <div className="sidebarSectionHeader">
                <AlertCircle size={14} />
                <span>Priority</span>
              </div>
              <CustomSelect
                options={[
                  { value: "low", label: "Low", color: "#10b981" },
                  { value: "medium", label: "Medium", color: "#f59e0b" },
                  { value: "high", label: "High", color: "#ef4444" },
                ]}
                value={task.priority}
                onChange={(val) => handleUpdate({ priority: val as Task["priority"] })}
              />
            </div>

            <div className="sidebarSection">
              <div className="sidebarSectionHeader">
                <User size={14} />
                <span>Assignee</span>
              </div>
              <div className="assigneeInputWrapper">
                <input
                  type="text"
                  placeholder="Add assignee..."
                  value={task.assignee || ""}
                  onChange={(e) => handleUpdate({ assignee: e.target.value })}
                  className="formInput"
                />
              </div>
            </div>

            <div className="sidebarSection">
              <div className="sidebarSectionHeader">
                <Clock size={14} />
                <span>Deadline</span>
              </div>
              <input
                type="datetime-local"
                value={task.dueDate ? task.dueDate.substring(0, 16) : ""}
                onChange={(e) => handleUpdate({ dueDate: e.target.value })}
                className="formInput"
              />
            </div>

            <div className="sidebarSection taskModalSidebarActions">
              <button 
                onClick={handleSaveChanges} 
                className="btnSave"
              >
                <Save size={18} />
                Save Changes
              </button>


              <button onClick={handleDelete} className="btnDanger btnDanger--full">
                <Trash2 size={16} />
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
