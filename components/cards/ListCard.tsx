import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import TaskCard from "./TaskCard";
import { List, Task } from "../../types/index";
import { RootState } from "../../store/index";
import { addTask } from "../../store/boardSlice";

interface ListCardProps {
  id: string;
  list: List;
  onTaskClick: (task: Task) => void;
}
const ListCard = ({ id, list, onTaskClick }: ListCardProps) => {
  const tasks = useSelector((state: RootState) => state.boards.tasks);
  const dispatch = useDispatch();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, data: { type: "list" } });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `list-drop-${id}`,
    data: { type: "list", listId: id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    minWidth: "260px",
    maxWidth: "300px",
    background: "#f1f2f4",
    borderRadius: "10px",
    padding: "12px",
    flexShrink: 0,
  };

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    dispatch(addTask({ listId: id, title }));
    setNewTaskTitle("");
  };

  return (
    <div ref={setNodeRef} style={style}>
      <h3
        style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 600, color: "#333", cursor: "grab" }}
        {...attributes}
        {...listeners}
      >
        {list.title}
      </h3>

      <div ref={setDropRef} style={{ minHeight: "40px" }}>
        <SortableContext
          items={list.taskIds}
          strategy={verticalListSortingStrategy}
        >
          {list.taskIds.map((taskId) => (
            <TaskCard key={taskId} id={taskId} task={tasks[taskId]} listId={id} onClick={onTaskClick} />
          ))}
        </SortableContext>
      </div>

      <div style={{ marginTop: "8px" }}>
        <input
          type="text"
          placeholder="New task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "13px",
            boxSizing: "border-box",
            color: "#333",
          }}
        />
        <button
          onClick={handleAddTask}
          style={{
            width: "100%",
            marginTop: "4px",
            padding: "6px",
            background: "#0079bf",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          + Add Task
        </button>
      </div>
    </div>
  );
};

export default ListCard;
