import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-xl py-4">
        <Outlet />
      </div>
    </div>
  );
}