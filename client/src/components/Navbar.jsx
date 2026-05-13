import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { LogOut, PlusCircle, BarChart, Home, User as UserIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <BarChart className="h-5 w-5" />
            </div>
            PollPulse
          </Link>
          
          <div className="hidden md:flex items-center gap-2">
            <Link to="/">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-2 ${isActive('/') ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/create">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-2 ${isActive('/create') ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <PlusCircle className="h-4 w-4" />
                Create Poll
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-zinc-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-indigo-400">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-none">{user.name}</span>
              <span className="text-[10px] text-zinc-500">{user.email}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout} 
            className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
