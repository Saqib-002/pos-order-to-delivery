import { Worker } from "@/types/workers";
import { EditIcon, DocumentIcon, DeleteIcon } from "@/renderer/public/Svg";
interface Props {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
  onDelete: (id: string) => void;
  onSalary: (worker: Worker) => void;
}

export const WorkerTable = ({ workers, onEdit, onDelete, onSalary }: Props) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              Name
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              ID Number
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              Phone
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
              Bank Info
            </th>
            <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {workers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                No workers found
              </td>
            </tr>
          ) : (
            workers.map((worker) => (
              <tr
                key={worker.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {worker.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {worker.idNumber || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {worker.phoneNumber || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {worker.bankName || "-"}
                    </span>
                    <span className="text-xs">
                      {worker.bankAccountNumber || "-"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => onSalary(worker)}
                    className="p-2 hover:bg-blue-100 rounded-full text-blue-600"
                    title="Salary History"
                  >
                    <DocumentIcon className="size-5" />
                  </button>
                  <button
                    onClick={() => onEdit(worker)}
                    className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
                    title="Edit"
                  >
                    <EditIcon className="size-5" />
                  </button>
                  <button
                    onClick={() => onDelete(worker.id)}
                    className="p-2 hover:bg-red-100 rounded-full text-red-600"
                    title="Delete"
                  >
                    <DeleteIcon className="size-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
