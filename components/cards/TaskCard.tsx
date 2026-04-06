import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, Label } from '../../types/index'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/index'

interface TaskCardProps {
  id: string;
  task?: Task;
  listId: string;
  onClick: (task: Task) => void;
}

const TaskCard = ({ id, task, listId, onClick }: TaskCardProps) => {
  const allLabels = useSelector((state: RootState) => state.boards.labels);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, data: { type: 'task', listId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: '8px 12px',
    margin: '4px 0',
    background: '#fff',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    cursor: 'pointer',
    color: '#333',
    position: 'relative' as const,
  };

  if (!task) return null;

  const priorityColors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const completedItems = task.checklist.filter(i => i.done).length;
  const totalItems = task.checklist.length;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={() => onClick(task)}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
        {task.labels.map(labelId => (
          <span 
            key={labelId}
            style={{ 
              height: '8px', 
              width: '40px', 
              borderRadius: '4px', 
              backgroundColor: allLabels[labelId]?.color || '#ddd' 
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: priorityColors[task.priority] 
        }} title={`Priority: ${task.priority}`} />
        <h4 style={{ margin: 0, fontSize: '14px', flex: 1 }}>{task.title}</h4>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', fontSize: '11px', color: '#6b778c' }}>
        {task.dueDate && (
          <span style={{ color: isOverdue ? '#ef4444' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
            📅 {task.dueDate}
          </span>
        )}
        
        {totalItems > 0 && (
          <span style={{ 
            backgroundColor: task.progress === 100 ? '#5ba03a' : 'transparent',
            color: task.progress === 100 ? 'white' : 'inherit',
            padding: '2px 4px',
            borderRadius: '3px'
          }}>
            Checklist {completedItems}/{totalItems}
          </span>
        )}

        {task.assignee && <span title={`Assignee: ${task.assignee}`}>👤</span>}
      </div>
    </div>
  )
}

export default TaskCard