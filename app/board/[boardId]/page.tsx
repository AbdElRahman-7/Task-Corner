"use client";

import { use, useState } from "react";
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@store/index";
import { addCustomList, moveTask, reorderLists } from "@store/boardSlice";
import Link from "next/link";
import ListCard from "@components/cards/ListCard";
import TaskModal from "@components/modals/TaskModal";
import { Task } from "../../../types/index";

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
  const dispatch = useDispatch();
  const board = useSelector((state: RootState) => state.boards.boards[boardId]);
  const lists = useSelector((state: RootState) => state.boards.lists);

  if (!board) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Board not found</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          &larr; Back to boards
        </Link>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    console.log(`Dragging ${activeType} ${active.id} over ${overType} ${over.id}`);

    if (activeType === "task") {
      const activeTaskId = active.id as string;
      const fromListId = active.data.current?.listId;
      
      let toListId = over.data.current?.listId || (overType === "list" ? over.id : undefined);

      if (!fromListId || !toListId) {
        console.warn("Could not determine source or target list", { fromListId, toListId });
        return;
      }

      const toListIdStr = toListId as string;
      const toList = lists[toListIdStr];
      if (!toList) {
        console.error("Target list not found", toListIdStr);
        return;
      }

      let newIndex = 0;
      if (overType === "task") {
        newIndex = toList.taskIds.indexOf(over.id as string);
      } else {
        newIndex = toList.taskIds.length;
      }

      console.log(`Moving task ${activeTaskId} from ${fromListId} to ${toListIdStr} at index ${newIndex}`);
      dispatch(moveTask({ taskId: activeTaskId, fromListId, toListId: toListIdStr, newIndex }));
    } else if (activeType === "list") {
      const oldIndex = board.listIds.indexOf(active.id as string);
      const newIndex = board.listIds.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`Reordering list ${active.id} from index ${oldIndex} to ${newIndex}`);
        dispatch(reorderLists({ boardId, oldIndex, newIndex }));
      }
    }
  };
  const handleAddCustomList = () => {
    if (!newListTitle.trim()) return;
    dispatch(addCustomList({ boardId, title: newListTitle.trim() }));
    setNewListTitle("");
  };

  const handleTaskClick = (task: Task, listId: string) => {
    setSelectedTask(task);
    setSelectedListId(listId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="p-6">
        <Link
          href="/"
          className="text-blue-500 hover:underline mb-4 inline-block"
        >
          &larr; Back to boards
        </Link>

        <h1 className="font-bold text-2xl mb-4">{board.title}</h1>

        <div className="flex gap-4 items-start">
          <SortableContext
            items={board.listIds}
            strategy={horizontalListSortingStrategy}
          >
            {board.listIds.map((listId) => {
              const listData = lists[listId];
              if (!listData) return null;
              return (
                <ListCard 
                  key={listId} 
                  id={listId} 
                  list={listData} 
                  onTaskClick={(task) => handleTaskClick(task, listId)} 
                />
              );
            })}
          </SortableContext>

          <div className="w-64 p-4 shrink-0 bg-gray-100 rounded text-black">
            <input
              type="text"
              placeholder="New list title"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustomList();
              }}
              className="w-full p-2 text-black mb-2 border rounded"
            />
            <button
              onClick={handleAddCustomList}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Add List
            </button>
          </div>
        </div>

        {selectedTask && selectedListId && (
          <TaskModal 
            task={selectedTask} 
            listId={selectedListId}
            isOpen={!!selectedTask} 
            onClose={() => {
              setSelectedTask(null);
              setSelectedListId(null);
            }} 
          />
        )}
      </div>
    </DndContext>
  );
}

