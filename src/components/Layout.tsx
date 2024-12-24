import { Link, useLocation } from "react-router-dom";
import { MessageCircle, User, Settings, Plus, Users } from "lucide-react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  
  const chatRoomId = location.pathname.startsWith('/chat/') 
    ? location.pathname.split('/chat/')[1]
    : localStorage.getItem('activeRoomId');

  const state = chatRoomId ? { from: `/chat/${chatRoomId}` } : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16">
            <h1 className="text-2xl font-bold text-primary">StudiBudi</h1>
          </div>
        </div>
      </header>

      {/* Floating Navigation Bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="glass dark:glass-dark rounded-full px-4 py-3 shadow-lg">
          <div className="flex items-center justify-center gap-6">
            <Link
              to="/join-rooms"
              state={state}
              className={`transition-all group ${
                isActive("/join-rooms") 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Users 
                className="h-6 w-6 group-hover:scale-110 transition-transform" 
                strokeWidth={isActive("/join-rooms") ? 2.5 : 1.5} 
              />
            </Link>
            <Link
              to="/create-room"
              state={state}
              className={`transition-all group ${
                isActive("/create-room") 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Plus 
                className="h-6 w-6 group-hover:scale-110 transition-transform" 
                strokeWidth={isActive("/create-room") ? 2.5 : 1.5} 
              />
            </Link>
            {chatRoomId && (
              <Link
                to={`/chat/${chatRoomId}`}
                className={`transition-all group ${
                  location.pathname === `/chat/${chatRoomId}`
                    ? "text-primary scale-110"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <MessageCircle 
                  className="h-6 w-6 group-hover:scale-110 transition-transform" 
                  strokeWidth={location.pathname === `/chat/${chatRoomId}` ? 2.5 : 1.5} 
                />
              </Link>
            )}
            <Link
              to="/profile"
              state={state}
              className={`transition-all group ${
                isActive("/profile") 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <User 
                className="h-6 w-6 group-hover:scale-110 transition-transform" 
                strokeWidth={isActive("/profile") ? 2.5 : 1.5} 
              />
            </Link>
            <Link
              to="/settings"
              state={state}
              className={`transition-all group ${
                isActive("/settings") 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Settings 
                className="h-6 w-6 group-hover:scale-110 transition-transform" 
                strokeWidth={isActive("/settings") ? 2.5 : 1.5} 
              />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-32 pt-24">
        <div className="animate-in">{children}</div>
      </main>
    </div>
  );
};

export default Layout;