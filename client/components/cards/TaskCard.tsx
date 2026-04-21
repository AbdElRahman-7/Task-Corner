import React, { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@appTypes/index";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { 
  Clock,
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

  const checklist = task.checklist || [];
  const completedItems = checklist.filter((item) => item.done).length;
  const totalItems = checklist.length;

  const labels = task.labels || [];
  const assignments = task.assignments ?? [];
  const assignedLabels = assignments
    .map((a) => (typeof a.user === "string" ? a.user : a.user?.username || a.user?.email || a.user?._id))
    .filter(Boolean) as string[];
  const legacyAssignee = task.assignee ? [task.assignee] : [];
  const displayAssignees = assignedLabels.length > 0 ? assignedLabels : legacyAssignee;
  const maxAvatars = 3;

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={`taskCard taskCard--${task.priority} ${task.status === "done" || task.progress === 100 ? "taskCard--done" : ""} ${isDragging && !isOverlay ? "taskCard--dragging" : ""} ${isOverlay ? "taskCard--overlay" : ""}`}
    >
      {labels.length > 0 && (
        <div className="taskCard__labels">
          {labels.map((labelId) => {
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

        {displayAssignees.length > 0 && (
          <div
            className="taskCard__assignee"
            title={
              assignments.length > 0
                ? `Assigned: ${displayAssignees.join(", ")}`
                : `Assignee: ${displayAssignees.join(", ")}`
            }
          >
            <div className="taskCard__assigneeStack">
              {displayAssignees.slice(0, maxAvatars).map((name, idx) => (
                <div key={`${name}-${idx}`} className="taskCard__avatar">
                  {name.charAt(0).toUpperCase()}
                </div>
              ))}
              {displayAssignees.length > maxAvatars && (
                <div className="taskCard__avatar taskCard__avatar--more">
                  +{displayAssignees.length - maxAvatars}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = "TaskCard";
export default TaskCard;