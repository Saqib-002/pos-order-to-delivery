import React, { useState, useEffect } from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import { CreateGroupModal } from "./CreateGroupModal";
import { toast } from "react-toastify";

interface Group {
  id: string;
  name: string;
  items:Complement[]
}
interface Complement {
  id: string;
  name: string;
  price: number;
  priority: number;
}

export const GroupView: React.FC<{token:string}> = ({token}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const getGroups=async()=>{
    (window as any).electronAPI.getGroups(token).then((res:any)=>{
      if(!res.status){
        toast.error("Unable to get groups");
        return;
      }
      setGroups(res.data);
    })
  }
  useEffect(() => {
    getGroups();
  }, []);

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setIsCreateGroupOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsCreateGroupOpen(true);
  };

  const handleGroupSuccess = () => {
    setIsCreateGroupOpen(false);
    setEditingGroup(null);
    getGroups();
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Main Action Button */}
          <button
            onClick={handleCreateGroup}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            CREATE GROUP
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.length === 0 && (
          <div className="text-center">
            <p className="text-lg text-gray-500">
              No groups found. Add new groups
            </p>
          </div>
        )}
        {groups.map((group) => (
          <UnifiedCard
            key={group.id}
            data={{...group,itemCount:group.items.length}}
            type="group"
            onEdit={() => handleEditGroup(group)}
          />
        ))}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => {
          setIsCreateGroupOpen(false);
          setEditingGroup(null);
        }}
        token={token}
        onSuccess={handleGroupSuccess}
        editingGroup={editingGroup}
      />
    </div>
  );
};
