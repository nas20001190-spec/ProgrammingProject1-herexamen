import Sidebar from "./component/sidebar";
import AuthGuard from "./component/AuthGuard";

export default function StudentLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
    </AuthGuard>
  );
}