import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { toast } from 'react-toastify';

export const UserManagement: React.FC<{ token: string|null }> = ({ token }) => {
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', email: '', role: 'staff' });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await (window as any).electronAPI.getUsers(token);
        setUsers(users);
      } catch (error) {
        toast.error('Failed to fetch users');
      }
    };
    fetchUsers();
  }, [token]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await (window as any).electronAPI.registerUser(newUser);
      setUsers([...users, user]);
      setNewUser({ username: '', password: '', name: '', email: '', role: 'staff' });
      toast.success('User added successfully');
    } catch (error) {
      toast.error('Failed to add user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const updatedUser = await (window as any).electronAPI.updateUser(token, editingUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setEditingUser(null);
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await (window as any).electronAPI.deleteUser(token, userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      
      {/* Add User Form */}
      <form onSubmit={handleAddUser} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New User</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            className="border rounded-md p-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="border rounded-md p-2"
          />
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="border rounded-md p-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="border rounded-md p-2"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
            className="border rounded-md p-2"
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="kitchen">Kitchen</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        <button type="submit" className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md">
          Add User
        </button>
      </form>

      {/* User List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Users</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4">{user.username}</td>
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setEditingUser(user as User)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => user.id &&handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="border rounded-md p-2"
                />
                <input
                  type="password"
                  placeholder="New Password (optional)"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="border rounded-md p-2"
                />
                <input
                  type="text"
                  placeholder="Name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="border rounded-md p-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="border rounded-md p-2"
                />
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="border rounded-md p-2"
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-indigo-600 text-white py-2 px-4 rounded-md">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};