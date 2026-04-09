
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assignee?: string;
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
export interface Board {
  id: string;
  title: string;
  listIds: string[];
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
  selectedBoardId?: string;
  filters: {
    search: string;
    priority: string[];
    labelIds: string[];
    status: "all" | string;
    due: "all" | "today" | "overdue";
  };
}
