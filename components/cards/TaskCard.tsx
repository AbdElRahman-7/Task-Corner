import React, { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../../types/index";
import { useSelector } from "react-redux";
import { RootState } from "../../store/index";
import { 
  User,
  Clock,
  AlertCircle,
  CheckSquare,
  List
} from "lucide-react";


interface TaskCardProps {
  id: string;
  task?: Task;
  listId: string;
  onClick: (task: Task) => void;
  isOverlay?: boolean;
}

const TaskCard = memo(({ id, task, listId, onClick, isOverlay }: TaskCardProps) => {
  const allLabels = useSelector((state: RootState) => state.boards.labels);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, data: { type: "task", listId }, disabled: isOverlay });

  const dragStyle = {
    transform: isOverlay ? undefined : CSS.Transform.toString(transform),
    transition: isOverlay ? undefined : transition,
    opacity: isDragging && !isOverlay ? 0.35 : 1,
  };

  if (!task) return null;

  const completedItems = task.checklist.filter((item) => item.done).length;
  const totalItems = task.checklist.length;

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={`taskCard taskCard--${task.priority} ${task.status === "done" || task.progress === 100 ? "taskCard--done" : ""} ${isDragging && !isOverlay ? "taskCard--dragging" : ""} ${isOverlay ? "taskCard--overlay" : ""}`}
    >
      {task.labels.length > 0 && (
        <div className="taskCard__labels">
          {task.labels.map((labelId) => {
            const label = allLabels[labelId];
            if (!label) return null;
            return (
              <div
                key={labelId}
                className="taskCard__label"
                style={{ backgroundColor: label.color }}
                title={label.title}
              />
            );
          })}
        </div>
      )}

      <div className={`taskCard__title ${task.status === "done" || task.progress === 100 ? "taskCard__title--done" : ""}`}>
        {task.title}
      </div>

      <div className="taskCard__meta">
        {task.priority && (
          <span className={`taskCard__priority taskCard__priority--${task.priority}`}>
            <span className="taskCard__priorityDot" />
            {task.priority}
          </span>
        )}

        {totalItems > 0 && (
          <span className={`taskCard__progress ${task.progress === 100 ? "taskCard__progress--done" : ""}`}>
            {task.progress === 100 ? <CheckSquare size={12} /> : <List size={12} />}
            {completedItems}/{totalItems}
          </span>
        )}

      </div>

      <div className="taskCard__footer">
        {task.dueDate && (
          <div className="taskCard__dueDate">
            <Clock size={12} />
            <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            {task.dueDate.includes('T') && (
              <span className="taskCard__time">{new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        )}

        {task.assignee && (
          <div className="taskCard__assignee" title={`Assignee: ${task.assignee}`}>
            <div className="taskCard__avatar">
              {task.assignee.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default TaskCard;