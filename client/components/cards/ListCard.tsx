import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSelector, useDispatch } from "react-redux";
import React, { useState, memo } from "react";
import TaskCard from "./TaskCard";
import { List, Task } from "../../types/index";
import { RootState } from "../../store/index";
import { addTaskDB } from "../../store/boardSlice";
import { toast } from "react-hot-toast";
import { selectOrderedTasksByList } from "../../store/selectors";

interface ListCardProps {
  id: string;
  list: List;
  index?: number;
  onTaskClick: (task: Task) => void;
  isOverlay?: boolean;
}

const ListCard = memo(({ id, list, index = 0, onTaskClick, isOverlay }: ListCardProps) => {
  
  const tasks = useSelector((state: RootState) => state.boards.tasks);
  const selectTasksForThisList = React.useMemo(() => selectOrderedTasksByList(id), [id]);
  const listFilteredTasks = useSelector(selectTasksForThisList);
  const dispatch = useDispatch();

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const statusType = list.title.toLowerCase().replace(/\s+/g, '-');
  const isDone = statusType === 'done';
  const isProgress = statusType === 'in-progress' || statusType === 'doing';
  const isTodo = statusType === 'todo' || statusType === 'backlog';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, data: { type: "list", listId: id }, disabled: isOverlay });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `list-drop-${id}`,
    data: { type: "list", listId: id },
  });

  const dragStyle = {
    transform: isOverlay ? undefined : CSS.Transform.toString(transform),
    transition: isOverlay ? undefined : transition,
    "--i": index,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  } as React.CSSProperties;

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    dispatch(addTaskDB({ listId: id, title, order: listFilteredTasks.length }) as any);
    toast.success(`Task "${title}" added!`);
    setNewTaskTitle("");
  };

  return (
    <div 
      ref={setNodeRef} 
      style={dragStyle} 
      className={`listCard listCard--${statusType} ${isDragging && !isOverlay ? "listCard--dragging" : ""} ${isOverlay ? "listCard--overlay" : ""}`}
    >
      <div className="listCard__header" {...attributes} {...listeners}>
        <span className="listCard__title">{list.title}</span>
        <span className="listCard__count">{listFilteredTasks.length}</span>
      </div>

      <div ref={setDropRef} className="listCard__tasks">
        {listFilteredTasks.length > 0 ? (
          <SortableContext
            items={listFilteredTasks}
            strategy={verticalListSortingStrategy}
          >
            {listFilteredTasks.map((taskId, tIndex) => (
              <div key={taskId} style={{ "--i": tIndex } as any}>
                <TaskCard
                  id={taskId}
                  task={tasks[taskId]}
                  listId={id}
                  onClick={onTaskClick}
                />
              </div>
            ))}
          </SortableContext>
        ) : (
          <div className="listCard__empty">
            <div className="listCard__emptyIcon">✨</div>
            <p className="listCard__emptyText">Ready for new tasks!</p>
          </div>
        )}
      </div>

      {!isOverlay && (
        <div className="listCard__footer">
          <input
            type="text"
            placeholder="New task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTask();
            }}
            className="formInput listCard__quickInput"
          />
          <button onClick={handleAddTask} className="listCard__addBtn">
            + Add Task
          </button>
        </div>
      )}
    </div>
  );
});

export default ListCard;
