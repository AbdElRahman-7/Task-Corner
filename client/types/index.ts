export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
}

export type AssignmentRole = "viewer" | "commenter" | "editor";

export type EditorSubPermission = "allActions" | "reorder" | "moveTask";

export interface TaskAssignmentPermissions {
  allActions?: boolean;
  reorder?: boolean;
  moveTask?: boolean;
}

export interface TaskAssignment {
  user: string | { _id: string; username: string; email: string };
  role: AssignmentRole;
  permissions?: TaskAssignmentPermissions;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  /**
   * Legacy single assignee (free text). Kept for backward compatibility.
   * Prefer `assignments`.
   */
  assignee?: string;
  assignments?: TaskAssignment[];
  labels: string[];
  checklist: { id: string; text: string; done: boolean }[];
  progress: number;
  status: "todo" | "in progress" | "done" | string;
  autoDone?: boolean;
  listId: string; 

  createdAt: number;
}
export interface List {
  id: string;
  title: string;
  taskIds: string[];
  boardId: string;
}
export interface BoardMember {
  user: string | { _id: string; username: string; email: string };
  role: "viewer" | "editor";
}

export interface Board {
  id: string;
  _id?: string; // MongoDB ID as alternative
  title: string;
  listIds: string[];
  members: BoardMember[];
  owner?: string; // Owner User ID
  isArchived?: boolean;
}
export interface Label {
  id: string;
  title: string;
  color: string;
  listId?: string; 
}
export interface BoardsState {
  boards: { [id: string]: Board };
  lists: { [id: string]: List };
  tasks: { [id: string]: Task };
  labels: { [id: string]: Label };
  invites: { [boardId: string]: any[] };
  selectedBoardId?: string;
  filters: {
    search: string;
    priority: string[];
    labelIds: string[];
    status: "all" | string;
    due: "all" | "today" | "overdue";
  };
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

export interface UserRow {
  _id: string;
  username: string;
  email: string;
  role?: "user" | "admin";
  status?: "active" | "disabled";
  createdAt: string;
  boardsCount: number;
  taskStats: TaskStats;
}

export interface EditForm {
  username: string;
  email: string;
}
export interface BoardRole {
  boardId: string;
  boardName: string;
  role: "viewer" | "editor";
}
