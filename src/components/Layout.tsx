import { Link, useLocation } from "react-router-dom";
import { MessageSquare, User, Settings } from "lucide-react";

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
              className={`flex flex-col items-center transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Chat</span>
            </Link>
            <Link
              to="/profile"
              className={`flex flex-col items-center transition-colors hover:text-primary ${
                isActive("/profile") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Link>
            <Link
              to="/settings"
              className={`flex flex-col items-center transition-colors hover:text-primary ${
                isActive("/settings") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Settings</span>
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