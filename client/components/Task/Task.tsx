import { Task as TaskType } from "@appTypes/index";

interface Props {
  task: TaskType;

}
const Task = ({task}: Props) => {
  return (
    <div className="bg-white p-2 rounded shadow cursor-pointer">
      <h4 className="">{task.title}</h4>
      <p className="text-sm text-gray-500">{task.description}</p>
    </div>
  );
};

export default Task