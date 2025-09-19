import React, { useState, useEffect } from "react";
import { UnifiedCard } from "../ui/UnifiedCard";
import { CreateGroupModal } from "./CreateGroupModal";

interface Group {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  color: string;
}

export const GroupView: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setGroups([
      { id: "1", name: "Rice Or Potatoes", itemCount: 3, color: "blue" },
      { id: "2", name: "Add Option", itemCount: 5, color: "green" },
      {
        id: "3",
        name: "Add Option (Hamburger)",
        itemCount: 2,
        color: "purple",
      },
      {
        id: "4",
        name: "Add Option (Flafel Product)",
        itemCount: 4,
        color: "orange",
      },
      { id: "5", name: "Option To Choose In Box", itemCount: 6, color: "pink" },
      { id: "6", name: "Remove Option", itemCount: 3, color: "red" },
      {
        id: "7",
        name: "Remove Option (Hamburger)",
        itemCount: 2,
        color: "indigo",
      },
      {
        id: "8",
        name: "Remove Option On Plates",
        itemCount: 4,
        color: "yellow",
      },
      {
        id: "9",
        name: "Remove Option Large Plate",
        itemCount: 3,
        color: "gray",
      },
      { id: "10", name: "Remove Sauce Option", itemCount: 2, color: "teal" },
    ]);
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
    // Refresh data
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
        {groups.map((group) => (
          <UnifiedCard
            key={group.id}
            data={group}
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
        onSuccess={handleGroupSuccess}
        editingGroup={editingGroup}
      />
    </div>
  );
};
