import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Task, Label } from "../../types/index";
import { updateTask, addLabel } from "../../store/boardSlice";
import { RootState } from "../../store/index";

interface TaskModalProps {
  task: Task;
  listId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TaskModal = ({ task, listId, isOpen, onClose }: TaskModalProps) => {
  const dispatch = useDispatch();
  const allLabels = useSelector((state: RootState) => state.boards.labels);
  
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [autoDone, setAutoDone] = useState(task.autoDone || false);
  const [checklist, setChecklist] = useState(task.checklist);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels);

  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setDueDate(task.dueDate || "");
      setAssignee(task.assignee || "");
      setAutoDone(task.autoDone || false);
      setChecklist(task.checklist);
      setSelectedLabels(task.labels);
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert("Task title cannot be empty!");
      return;
    }

    dispatch(updateTask({
      taskId: task.id,
      listId,
      updates: {
        title: trimmedTitle,
        description,
        priority,
        dueDate,
        assignee,
        autoDone,
        checklist,
        labels: selectedLabels,
      }
    }));
    onClose();
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    const newItem = { id: crypto.randomUUID(), text: newCheckItem, done: false };
    const newChecklist = [...checklist, newItem];
    setChecklist(newChecklist);
    setNewCheckItem("");
    
    dispatch(updateTask({
      taskId: task.id,
      listId,
      updates: { checklist: newChecklist }
    }));
  };

  const toggleCheckItem = (id: string) => {
    const newChecklist = checklist.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    );
    setChecklist(newChecklist);
    
    dispatch(updateTask({
      taskId: task.id,
      listId,
      updates: { checklist: newChecklist }
    }));
  };

  const removeCheckItem = (id: string) => {
    const newChecklist = checklist.filter(item => item.id !== id);
    setChecklist(newChecklist);
    
    // Immediate save for checklist items
    dispatch(updateTask({
      taskId: task.id,
      listId,
      updates: { checklist: newChecklist }
    }));
  };

  const toggleLabel = (labelId: string) => {
    if (selectedLabels.includes(labelId)) {
      setSelectedLabels(selectedLabels.filter(id => id !== labelId));
    } else {
      setSelectedLabels([...selectedLabels, labelId]);
    }
  };

  const handleCreateLabel = () => {
    const nameInput = prompt("Label name:");
    if (!nameInput || !nameInput.trim()) {
      alert("Label name cannot be empty!");
      return;
    }
    
    const colorInput = prompt("Color (hex or name):", "#3b82f6");
    if (!colorInput || !colorInput.trim()) {
      alert("Label color cannot be empty!");
      return;
    }

    const title = nameInput.trim();
    const color = colorInput.trim();
    
    const id = crypto.randomUUID();
    dispatch(addLabel({ id, title, color }));
    setSelectedLabels([...selectedLabels, id]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <input 
            className="modal-title-input"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <label>Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
            />
          </div>

          <div className="modal-grid">
            <div className="modal-section">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="modal-section">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="modal-section">
              <label>Assignee</label>
              <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name" />
            </div>

            <div className="modal-section">
              <label className="checkbox-label">
                <input type="checkbox" checked={autoDone} onChange={(e) => setAutoDone(e.target.checked)} />
                Auto-mark Done when checklist ends
              </label>
            </div>
          </div>

          <div className="modal-section">
            <label>Labels</label>
            <div className="labels-list">
              {Object.values(allLabels).map(label => (
                <span 
                  key={label.id} 
                  className={`label-item ${selectedLabels.includes(label.id) ? 'selected' : ''}`}
                  style={{ backgroundColor: label.color }}
                  onClick={() => toggleLabel(label.id)}
                >
                  {label.title}
                </span>
              ))}
              <button className="add-label-btn" onClick={handleCreateLabel}>+ New Label</button>
            </div>
          </div>

          <div className="modal-section">
            {(() => {
              const total = checklist.length;
              const done = checklist.filter(i => i.done).length;
              const currentProgress = total === 0 ? 0 : Math.round((done / total) * 100);
              
              return (
                <>
                  <label>Checklist ({currentProgress}%)</label>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${currentProgress}%`,
                        backgroundColor: currentProgress === 100 ? '#5ba03a' : '#5ba03a' 
                      }} 
                    ></div>
                  </div>
                </>
              );
            })()}
            <div className="checklist-items">
              {checklist.map(item => (
                <div key={item.id} className="checklist-item">
                  <input 
                    type="checkbox" 
                    checked={item.done} 
                    onChange={() => toggleCheckItem(item.id)} 
                    style={{ cursor: 'pointer' }}
                  />
                  <span 
                    className={item.done ? 'done' : ''} 
                    onClick={() => toggleCheckItem(item.id)}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    {item.text}
                  </span>
                  <button className="delete-item-btn" onClick={() => removeCheckItem(item.id)}>&times;</button>
                </div>
              ))}
            </div>
            <div className="add-check-item">
              <input 
                value={newCheckItem} 
                onChange={(e) => setNewCheckItem(e.target.value)} 
                placeholder="Add an item"
                onKeyDown={(e) => e.key === 'Enter' && addCheckItem()}
                className="add-item-input"
              />
              <button 
                onClick={addCheckItem}
                className="add-item-btn"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="save-btn" onClick={handleSave}>Save Changes</button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: #f4f5f7;
          width: 600px;
          max-height: 90vh;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          color: #172b4d;
          overflow: hidden;
        }
        .modal-header {
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-title-input {
          font-size: 20px;
          font-weight: 600;
          border: none;
          background: transparent;
          width: 100%;
          padding: 4px;
          border-radius: 4px;
        }
        .modal-title-input:focus {
          background: white;
          outline: 2px solid #3b82f6;
        }
        .close-btn {
          font-size: 24px;
          background: none;
          border: none;
          cursor: pointer;
          color: #6b778c;
        }
        .modal-body {
          padding: 0 24px 24px;
          overflow-y: auto;
          flex: 1;
        }
        .modal-section {
          margin-bottom: 24px;
        }
        .modal-section label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        textarea {
          width: 100%;
          min-height: 80px;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
          resize: vertical;
        }
        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        select, input[type="date"], input[type="text"] {
          width: 100%;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        .checkbox-label {
          display: flex !important;
          align-items: center;
          gap: 8px;
          font-weight: normal !important;
          cursor: pointer;
          margin-top: 24px;
        }
        .labels-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .label-item {
          padding: 4px 12px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .label-item.selected {
          opacity: 1;
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3b82f6;
        }
        .add-label-btn {
          padding: 4px 12px;
          border-radius: 4px;
          background: #091e420f;
          border: none;
          cursor: pointer;
          font-size: 12px;
        }
        .progress-bar-bg {
          background: #091e420f;
          height: 8px;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        .progress-bar-fill {
          background: #5ba03a;
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .checklist-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .checklist-item .done {
          text-decoration: line-through;
          color: #6b778c;
        }
        .delete-item-btn {
          margin-left: auto;
          color: #ef4444;
          background: none;
          border: none;
          cursor: pointer;
        }
        .add-check-item {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .add-check-item input {
          flex: 1;
          padding: 6px;
        }
        .modal-footer {
          padding: 16px 24px;
          background: #f4f5f7;
          border-top: 1px solid #ddd;
          display: flex;
          justify-content: flex-end;
        }
        .save-btn {
          background: #0079bf;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }
        .save-btn:hover {
          background: #026aa7;
        }
      `}</style>
    </div>
  );
};

export default TaskModal;
