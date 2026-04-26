"use client";
import Task from "@components/Task/Task";
import { Task as TaskType } from "@appTypes/index";

interface Props {
  tasks: TaskType[];
}

const List = ({ tasks }: Props) => {
  return (
    <>
      {tasks.map((task) => (
        <Task key={task.id} task={task} />
      ))}
    </>
  );
};

export default List;
