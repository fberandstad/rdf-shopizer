import { LogOut, User } from 'lucide-react';

export default function UserMenu({ user, onLogout }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="w-8 h-8 rounded-full bg-randstad-blue text-white flex items-center justify-center">
          <User size={16} />
        </span>
        <div className="leading-tight">
          <div className="font-medium text-gray-900">{user?.name || user?.email}</div>
          <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
        </div>
      </div>
      <button onClick={onLogout} className="btn btn-ghost flex items-center gap-1" title="Log out">
        <LogOut size={16} />
      </button>
    </div>
  );
}
