import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, FileText, Settings, LogOut, Home } from 'lucide-react';

const Navbar = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) return null;

  const isAdmin = userRole === 'ADMIN_PSY';
  const isPsy = userRole === 'PSY' || userRole === 'ADMIN_PSY';
  const isParent = userRole === 'PARENT';

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="mr-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">Psychobrio Connect</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4 ml-auto">
          {isPsy && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Accueil</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/patients" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Patients</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/assessments" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Bilans</span>
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Administration</span>
                  </Link>
                </Button>
              )}
            </>
          )}
          
          {isParent && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parent-portal" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Mes comptes-rendus</span>
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userRole?.replace('_', ' ')}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;