import { Link, useLocation } from "react-router-dom";
import { MessageCircle, User, Settings } from "lucide-react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border md:top-0 md:bottom-auto">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16 gap-8">
            <Link
              to="/"
              className={`flex flex-col items-center transition-all group ${
                isActive("/") 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <MessageCircle 
                className="h-6 w-6 group-hover:scale-110 transition-transform" 
                strokeWidth={isActive("/") ? 2.5 : 1.5} 
              />
              <span className="text-xs mt-1 font-semibold">Chat</span>
            </Link>
            <Link
              to="/profile"
              className={`flex flex-col items-center transition-all group ${
                isActive("/profile") 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <User 
                className="h-6 w-6 group-hover:scale-110 transition-transform" 
                strokeWidth={isActive("/profile") ? 2.5 : 1.5} 
              />
              <span className="text-xs mt-1 font-semibold">Profile</span>
            </Link>
            <Link
              to="/settings"
              className={`flex flex-col items-center transition-all group ${
                isActive("/settings") 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Settings 
                className="h-6 w-6 group-hover:scale-110 transition-transform" 
                strokeWidth={isActive("/settings") ? 2.5 : 1.5} 
              />
              <span className="text-xs mt-1 font-semibold">Settings</span>
            </Link>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 pb-20 pt-4 md:pb-4 md:pt-20">
        <div className="animate-in">{children}</div>
      </main>
    </div>
  );
};

export default Layout;