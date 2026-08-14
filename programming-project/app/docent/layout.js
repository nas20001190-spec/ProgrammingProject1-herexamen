import DocentSidebar from "./component/sidebar";
import AuthGuard from './component/AuthGuard';

export default function DocentLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-100">
        <div className="sticky top-0 h-screen">
          <DocentSidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
