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
import { moveTask, reorderLists, loadBoardData, moveTaskDB, addListDB } from "@store/boardSlice";
import Link from "next/link";
import ListCard from "@components/cards/ListCard";
import TaskCard from "@components/cards/TaskCard";
import TaskModal from "@components/modals/TaskModal";
import { Task } from "@appTypes/index";
import { toast } from "react-hot-toast";
import InviteModal from "@components/modals/InviteModal";
import BoardMembersSideBar from "@components/Board/BoardMembersSideBar";
import { Users, UserPlus } from "lucide-react";
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
  const [inviteTaskId, setInviteTaskId] = useState<string | undefined>(undefined);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (boardId) {
      setIsLoading(true);
      dispatch(loadBoardData(boardId)).finally(() => {
        setIsLoading(false);
      });
    }
  }, [boardId, dispatch]);

  const isEditor = useMemo(() => {
    if (!board || !currentUser) return false;
    const ownerId = typeof board.owner === 'object' && board.owner !== null ? (board.owner as { _id: string })._id : board.owner;
    if (ownerId === currentUser._id) return true;

    return board.members?.some(m => {
      const mUserId = typeof m.user === 'object' && m.user !== null ? (m.user as { _id: string })._id : m.user;
      return mUserId === currentUser._id && m.role === 'editor';
    });
  }, [board, currentUser]);

  const handleTaskClick = useCallback((task: Task, listId: string) => {
    setSelectedTask(task);
    setSelectedListId(listId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
    dispatch(addListDB({ boardId: boardId as string, title }));
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
        <div className="boardHeader">
          <div className="boardHeader__title">
            <Link href="/" className="backLink">
              <span className="icon">←</span>
              Back to Dashboard
            </Link>
            <h1 className="boardTitle">{board.title}</h1>
          </div>

          <div className="boardActions">
            <button
              onClick={() => setIsMembersOpen(true)}
              className="boardBtn boardBtn--secondary"
              title="Board Members"
            >
              <Users size={16} strokeWidth={2.5} />
              <span>Members</span>
              <span className="badge">
                {board.members.length + 1}
              </span>
            </button>
            {isEditor && (
              <button
                onClick={() => {
                  setInviteTaskId(undefined);
                  setIsInviteOpen(true);
                }}
                className="boardBtn boardBtn--primary"
              >
                <UserPlus size={16} />
                <span>Invite</span>
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
            onInvite={() => {
              setInviteTaskId(selectedTask.id);
              setIsInviteOpen(true);
            }}
          />
        )}

        <InviteModal
          boardId={boardId as string}
          taskId={inviteTaskId}
          isOpen={isInviteOpen}
          initialTasks={Object.values(tasks).filter(t => board.listIds.includes(t.listId as any))}
          initialLists={Object.values(lists).filter(l => l.boardId === boardId)}
          onClose={() => {
            setIsInviteOpen(false);
            setInviteTaskId(undefined);
          }}
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
