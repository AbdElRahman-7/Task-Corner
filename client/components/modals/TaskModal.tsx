import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Task, TaskAssignment, AssignmentRole, TaskAssignmentPermissions } from "@appTypes/index";
import { updateTask, deleteTask } from "@store/boardSlice";
import { RootState } from "@store/index";
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

import CustomSelect from "@components/Filters/CustomSelect";
import { addLabel, deleteLabel } from "@store/boardSlice";
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
  const [newAssigneeUserId, setNewAssigneeUserId] = useState<string>("");
  const [newAssigneeRole, setNewAssigneeRole] = useState<AssignmentRole>("viewer");

  const boardId = lists[listId]?.boardId;
  const board = useSelector((state: RootState) => state.boards.boards[boardId || ""]);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isEditor = board?.owner === currentUser?._id || board?.members?.some(m => (typeof m.user === 'string' ? m.user : m.user?._id) === currentUser?._id && m.role === 'editor');

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
    if (!isEditor) return;
    dispatch(updateTask({ taskId: task.id, updates, listId }));
  };

  const getUserId = (u: string | { _id: string; username: string; email: string } | undefined) =>
    typeof u === "string" ? u : u?._id;
  const getUserLabel = (u: string | { _id: string; username: string; email: string } | undefined) =>
    typeof u === "string" ? u : u?.username || u?.email || "Unknown";

  const boardUsers = (() => {
    const members = board?.members ?? [];
    return members
      .map((m: any) => ({
        id: getUserId(m.user) || "",
        label: getUserLabel(m.user),
        email: typeof m.user === "string" ? "" : m.user?.email,
      }))
      .filter((u: any) => Boolean(u.id));
  })();

  const assignments: TaskAssignment[] = task.assignments ?? [];

  const updateAssignments = (next: TaskAssignment[]) => {
    handleUpdate({ assignments: next });
  };

  const handleAddAssignment = () => {
    if (!newAssigneeUserId) return;
    const exists = assignments.some((a) => getUserId(a.user) === newAssigneeUserId);
    if (exists) return;
    const next: TaskAssignment[] = [
      ...assignments,
      { user: newAssigneeUserId, role: newAssigneeRole, permissions: {} },
    ];
    updateAssignments(next);
    setNewAssigneeUserId("");
    setNewAssigneeRole("viewer");
  };

  const handleRemoveAssignment = (userId: string) => {
    updateAssignments(assignments.filter((a) => getUserId(a.user) !== userId));
  };

  const handleSetAssignmentRole = (userId: string, role: AssignmentRole) => {
    const next = assignments.map((a) => {
      if (getUserId(a.user) !== userId) return a;
      const nextPermissions: TaskAssignmentPermissions | undefined =
        role === "editor" ? (a.permissions ?? {}) : undefined;
      return { ...a, role, permissions: nextPermissions };
    });
    updateAssignments(next);
  };

  const handleToggleEditorPermission = (userId: string, key: keyof TaskAssignmentPermissions) => {
    const next = assignments.map((a) => {
      if (getUserId(a.user) !== userId) return a;
      if (a.role !== "editor") return a;
      const permissions = { ...(a.permissions ?? {}) };
      permissions[key] = !permissions[key];
      return { ...a, permissions };
    });
    updateAssignments(next);
  };

  const handleToggleCheckItem = (itemId: string) => {
    const newChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    handleUpdate({ checklist: newChecklist });
  };

  const handleAddCheckItem = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const newItem = {
      id: crypto.randomUUID(),
      text: newCheckItem.trim(),
      done: false,
    };
    handleUpdate({ checklist: [...checklist, newItem] });
    setNewCheckItem("");
  };

  const handleDeleteCheckItem = (itemId: string) => {
    const newChecklist = checklist.filter((item) => item.id !== itemId);
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

  const checklist = task.checklist ?? [];
  const progress = checklist.length > 0
    ? (checklist.filter((i) => i.done).length / checklist.length) * 100
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
              disabled={!isEditor}
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
                disabled={!isEditor}
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
                      disabled={!isEditor}
                    />
                    <span>Auto-complete when finished</span>
                  </label>
                </div>
                <div className="progressTrack">
                  <div className="progressBar" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="checklistItems">
                {checklist.map((item) => (
                  <div key={item.id} className="checkItem">
                     <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleCheckItem(item.id)}
                      className="checkbox"
                      disabled={!isEditor}
                    />
                    <span
                      className={`checkLabel ${item.done ? 'checkLabel--done' : ''}`}
                      onClick={() => handleToggleCheckItem(item.id)}
                    >
                      {item.text}
                    </span>
                     {isEditor && (
                      <button
                        className="checkItem__delete"
                        onClick={() => handleDeleteCheckItem(item.id)}
                        title="Delete item"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

                {isEditor && (
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
              )}
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
                     {isEditor && (
                      <button
                        className="labelDeleteBtn"
                        onClick={(e) => { e.stopPropagation(); globalDeleteLabel(label.id); }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

                {isEditor && (
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
              )}
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
                <span>Assignments</span>
              </div>

              <div className="assignments">
                <div className="assignments__addRow">
                  <select
                    className="formInput"
                    value={newAssigneeUserId}
                    onChange={(e) => setNewAssigneeUserId(e.target.value)}
                    disabled={!isEditor}
                  >
                    <option value="">Select user…</option>
                    {boardUsers.map((u) => (
                      <option key={u.id} value={u.id} disabled={assignments.some((a) => getUserId(a.user) === u.id)}>
                        {u.label}{u.email ? ` (${u.email})` : ""}
                      </option>
                    ))}
                  </select>

                  <select
                    className="formInput"
                    value={newAssigneeRole}
                    onChange={(e) => setNewAssigneeRole(e.target.value as AssignmentRole)}
                    disabled={!isEditor || !newAssigneeUserId}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="commenter">Commenter</option>
                    <option value="editor">Editor</option>
                  </select>

                  {isEditor && (
                    <button type="button" className="assignments__addBtn" onClick={handleAddAssignment} disabled={!newAssigneeUserId}>
                      <Plus size={14} />
                      Add
                    </button>
                  )}
                </div>

                {assignments.length === 0 ? (
                  <div className="assignments__empty">No one assigned yet.</div>
                ) : (
                  <div className="assignments__list">
                    {assignments.map((a) => {
                      const userId = getUserId(a.user) || "";
                      const label = getUserLabel(a.user);
                      const perms = a.permissions ?? {};
                      return (
                        <div key={userId} className="assignments__item">
                          <div className="assignments__itemTop">
                            <div className="assignments__user">
                              <div className="assignments__avatar">{label.charAt(0).toUpperCase()}</div>
                              <div className="assignments__userText">
                                <div className="assignments__name">{label}</div>
                                <div className="assignments__role">
                                  <select
                                    className="assignments__roleSelect"
                                    value={a.role}
                                    onChange={(e) => handleSetAssignmentRole(userId, e.target.value as AssignmentRole)}
                                    disabled={!isEditor}
                                  >
                                    <option value="viewer">Viewer</option>
                                    <option value="commenter">Commenter</option>
                                    <option value="editor">Editor</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {isEditor && (
                              <button
                                type="button"
                                className="assignments__removeBtn"
                                onClick={() => handleRemoveAssignment(userId)}
                                aria-label="Remove assignment"
                                title="Remove"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          {a.role === "editor" && (
                            <div className="assignments__permissions">
                              <label className="assignments__perm">
                                <input
                                  type="checkbox"
                                  checked={Boolean(perms.allActions)}
                                  onChange={() => handleToggleEditorPermission(userId, "allActions")}
                                  disabled={!isEditor}
                                />
                                <span>All Actions</span>
                              </label>
                              <label className="assignments__perm">
                                <input
                                  type="checkbox"
                                  checked={Boolean(perms.reorder)}
                                  onChange={() => handleToggleEditorPermission(userId, "reorder")}
                                  disabled={!isEditor}
                                />
                                <span>Reorder</span>
                              </label>
                              <label className="assignments__perm">
                                <input
                                  type="checkbox"
                                  checked={Boolean(perms.moveTask)}
                                  onChange={() => handleToggleEditorPermission(userId, "moveTask")}
                                  disabled={!isEditor}
                                />
                                <span>Move Task</span>
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                disabled={!isEditor}
              />
            </div>

             <div className="sidebarSection taskModalSidebarActions">
              {isEditor && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
