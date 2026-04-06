import { Task as TaskType } from "../../types/index";

interface Props {
  task: TaskType;

}
const Task = () => {
  return (
    <div className="bg-white p-2 rounded shadow cursor-pointer">
      <h4 className="">Task</h4>
      <p className="text-sm text-gray-500">Description</p>
    </div>
  );
};

export default Task