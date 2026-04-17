"use client";
import { use, useState, useCallback, useEffect } from "react";
import { 
  DndContext, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragStartEvent, 
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragOverEvent
} from "@dnd-kit/core";

import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@store/index";
import { addCustomList, moveTask, reorderLists, loadBoardData } from "@store/boardSlice";
import Link from "next/link";
import ListCard from "@components/cards/ListCard";
import TaskCard from "@components/cards/TaskCard";
import TaskModal from "@components/modals/TaskModal";
import InviteModal from "@components/modals/InviteModal";
import { Task } from "../../../types/index";
import { toast } from "react-hot-toast";
import type { AppDispatch } from "@store/index";

export default function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const { boardId } = use(params);
  const [newListTitle, setNewListTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const board = useSelector((state: RootState) => state.boards.boards[boardId]);
  const lists = useSelector((state: RootState) => state.boards.lists);
  const tasks = useSelector((state: RootState) => state.boards.tasks);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"task" | "list" | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    if (boardId) {
      dispatch(loadBoardData(boardId));
    }
  }, [boardId, dispatch]);

  const handleTaskClick = useCallback((task: Task, listId: string) => {
    setSelectedTask(task);
    setSelectedListId(listId);
  }, []);

  if (!board) {
    return (
      <div className="notFound">
        <h1>Board Not Found</h1>
        <Link href="/">Back to Dashboard</Link>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveType(event.active.data.current?.type);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === "task") {
      const activeTaskId = active.id as string;
      const fromListId = active.data.current?.listId;
      
      const toListId = over.data.current?.listId || 
        (overType === "list" ? over.id.toString().replace("list-drop-", "") : undefined);

      if (!fromListId || !toListId) return;
      const toListIdStr = toListId as string;
      let newIndex = -1;

      if (overType === "task") {
        const targetList = lists[toListIdStr];
        if (targetList) {
          newIndex = targetList.taskIds.indexOf(over.id as string);
        }
      }

      dispatch(moveTask({ taskId: activeTaskId, fromListId, toListId: toListIdStr, newIndex }));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveType(null);
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === "task") {
      const activeTaskId = active.id as string;
      const fromListId = active.data.current?.listId;
      
      const toListId = over.data.current?.listId || 
        (overType === "list" ? over.id.toString().replace("list-drop-", "") : undefined);

      if (!fromListId || !toListId) return;

      const toListIdStr = toListId as string;
      const toList = lists[toListIdStr];
      if (!toList) return;

      let newIndex = 0;
      if (overType === "task") {
        newIndex = toList.taskIds.indexOf(over.id as string);
      } else {
        newIndex = toList.taskIds.length;
      }
      dispatch(moveTask({ taskId: activeTaskId, fromListId, toListId: toListIdStr, newIndex }));
      toast.success("Task moved!");
      
    } else if (activeType === "list") {
      const activeId = active.id as string;
      const targetListId = over.data.current?.listId || (over.id as string);
      
      const oldIndex = board.listIds.indexOf(activeId);
      const newIndex = board.listIds.indexOf(targetListId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        dispatch(reorderLists({ boardId, oldIndex, newIndex }));
        toast.success("List reordered!");
      }
    }
  };

  const handleAddCustomList = () => {
    const title = newListTitle.trim();
    if (!title) return;
    dispatch(addCustomList({ boardId, title }));
    toast.success(`List "${title}" created!`);
    setNewListTitle("");
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}

      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="boardPage">
        <div className="boardHeader">
          <Link href="/" className="backLink">
            <span className="backLink__icon">&larr;</span>
            Back to Dashboard
          </Link>

          <h1 className="boardTitle">{board.title}</h1>
          <button 
            onClick={() => setIsInviteOpen(true)} 
            style={{ 
              marginLeft: 'auto', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            + Invite Member
          </button>
        </div>

        <div className="boardContent">
          <SortableContext
            items={board.listIds}
            strategy={horizontalListSortingStrategy}
          >
            {board.listIds.map((listId, index) => {
              const listData = lists[listId];
              if (!listData) return null;
              return (
                <div key={listId} style={{ "--i": index } as React.CSSProperties}>
                  <ListCard 
                    id={listId} 
                    list={listData} 
                    index={index}
                    onTaskClick={(task) => handleTaskClick(task, listId)} 
                  />
                </div>
              );
            })}
          </SortableContext>

          <div className="addListPanel" style={{ "--i": board.listIds.length } as React.CSSProperties}>
            <input
              type="text"
              placeholder="Add list..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustomList();
              }}
              className="addListPanel__input"
            />
            <button
              onClick={handleAddCustomList}
              className="addListPanel__button"
            >
              + Add List
            </button>
          </div>
        </div>

        {selectedTask && selectedListId && (
          <TaskModal 
            taskId={selectedTask.id} 
            listId={selectedListId}
            isOpen={!!selectedTask} 
            onClose={() => {
              setSelectedTask(null);
              setSelectedListId(null);
            }} 
          />
        )}

        <InviteModal 
          boardId={boardId} 
          isOpen={isInviteOpen} 
          onClose={() => setIsInviteOpen(false)} 
        />

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}>
          {activeId && activeType === "task" ? (
            <TaskCard 
              id={activeId} 
              task={tasks[activeId]} 
              listId=""
              onClick={() => {}} 
              isOverlay
            />
          ) : activeId && activeType === "list" ? (
            <ListCard 
              id={activeId} 
              list={lists[activeId]} 
              onTaskClick={() => {}} 
              isOverlay
            />
          ) : null}

        </DragOverlay>
      </div>
    </DndContext>
  );
}
