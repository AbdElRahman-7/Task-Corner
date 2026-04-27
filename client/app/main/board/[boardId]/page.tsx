"use client";
import { use, useState, useCallback, useEffect, useMemo } from "react";
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
import { addCustomList, moveTask, reorderLists, loadBoardData, moveTaskDB } from "@store/boardSlice";
import Link from "next/link";
import ListCard from "@components/cards/ListCard";
import TaskCard from "@components/cards/TaskCard";
import TaskModal from "@components/modals/TaskModal";
import { Task } from "@appTypes/index";
import { toast } from "react-hot-toast";
import InviteModal from "@components/modals/InviteModal";
import BoardMembersSideBar from "@components/Board/BoardMembersSideBar";
import { Users } from "lucide-react";
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
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"task" | "list" | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  useEffect(() => {
    if (boardId) {
      dispatch(loadBoardData(boardId));
    }
  }, [boardId, dispatch]);

  const isEditor = useMemo(() => {
    if (!board || !currentUser) return false;
    const ownerId = typeof board.owner === 'object' ? board.owner._id : board.owner;
    if (ownerId === currentUser._id) return true;

    return board.members?.some(m => {
      const mUserId = typeof m.user === 'object' ? m.user._id : m.user;
      return mUserId === currentUser._id && m.role === 'editor';
    });
  }, [board, currentUser]);

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
    if (!isEditor) {
      toast.error("You don't have permission to move items on this board");
      return;
    }
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
      dispatch(moveTaskDB({ taskId: activeTaskId, toListId: toListIdStr, newIndex }));
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
    if (!isEditor) {
      toast.error("You don't have permission to add lists");
      return;
    }
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
      <div className="boardPage min-h-screen flex flex-col">
        <div className="boardHeader flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-8 shrink-0">
          <div className="flex flex-col gap-2">
            <Link href="/" className="backLink inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors">
              <span className="text-sm">←</span>
              Back to Dashboard
            </Link>
            <h1 className="boardTitle text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{board.title}</h1>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsMembersOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all active:scale-95"
              title="Board Members"
            >
              <Users size={16} strokeWidth={2.5} />
              <span>Members</span>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md text-[10px]">
                {board.members.length + 1}
              </span>
            </button>

            {isEditor && (
              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                + Invite
              </button>
            )}
          </div>
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
                    canEdit={isEditor}
                  />
                </div>
              );
            })}
          </SortableContext>

          {isEditor && (
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
          )}
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
          boardId={boardId as string}
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />

        <BoardMembersSideBar
          boardId={boardId as string}
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
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
              onClick={() => { }}
              isOverlay
              canEdit={isEditor}
            />
          ) : activeId && activeType === "list" ? (
            <ListCard
              id={activeId}
              list={lists[activeId]}
              onTaskClick={() => { }}
              isOverlay
              canEdit={isEditor}
            />
          ) : null}

        </DragOverlay>
      </div>
    </DndContext>
  );
}
