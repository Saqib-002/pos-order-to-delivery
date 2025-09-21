import React, { useState, useEffect } from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import { CreateGroupModal } from "./modals/CreateGroupModal";
import AddIcon from "../../assets/icons/add.svg?react";
import { getGroups } from "@/renderer/utils/menu";

export interface Group {
  id: string;
  name: string;
  color: string;
  items: Complement[];
}
interface Complement {
  id: string;
  name: string;
  price: number;
  priority: number;
}

export const GroupView: React.FC<{ token: string }> = ({ token }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  useEffect(() => {
    getGroups(token, setGroups);
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
    getGroups(token, setGroups);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons Section */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Main Action Button */}
        <button
          onClick={handleCreateGroup}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <AddIcon className="size-5" />
          CREATE GROUP
        </button>
      </div>
      
      <div className="">
        <h2 className="text-xl font-semibold text-gray-900">Groups</h2>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.length === 0 && (
          <div className="text-center col-span-full">
            <p className="text-lg text-gray-500">
              No groups found. Add new groups
            </p>
          </div>
        )}
        {groups.map((group) => (
          <UnifiedCard
            key={group.id}
            data={{ ...group, itemCount: group.items.length }}
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
