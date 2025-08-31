import React, { useState, useEffect } from 'react';
import { Bus, Search, User, LogOut } from 'lucide-react';
import { Button } from './components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';
import { Drawer, DrawerContent, DrawerTrigger } from './components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { useIsMobile } from './components/ui/use-mobile';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

import Map from './components/Map';
import AuthModal from './components/AuthModal';
import SearchPanel from './components/SearchPanel';
import BusDetailsPanel from './components/BusDetailsPanel';
import StopDetailsPanel from './components/StopDetailsPanel';

// Import API types and services
import { 
  BusLocation, 
  Stop, 
  Route, 
  User as APIUser, 
  userAPI, 
  handleAPIError 
} from './services/api';

// Import debug utilities in development
import './utils/debug';

// Types now imported from API service
type User = APIUser;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [activePanel, setActivePanel] = useState<'search' | 'bus' | 'stop'>('search');
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const isMobile = useIsMobile();

  // Check for existing authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('busTracker_token');
    const storedUser = localStorage.getItem('busTracker_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setUserFavorites([...parsedUser.preferences.favoriteRoutes]);
        toast.success(`Welcome back, ${parsedUser.name}!`);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('busTracker_token');
        localStorage.removeItem('busTracker_user');
      }
    }
  }, []);

  const handleAuth = (authToken: string, authUser: User) => {
    setToken(authToken);
    setUser(authUser);
    setIsAuthenticated(true);
    setUserFavorites([...authUser.preferences.favoriteRoutes]);
    toast.success(`Welcome, ${authUser.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('busTracker_token');
    localStorage.removeItem('busTracker_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setUserFavorites([]);
    setSelectedBus(null);
    setSelectedStop(null);
    setActivePanel('search');
    toast.success('Logged out successfully');
  };

  const handleBusSelect = (bus: BusLocation) => {
    setSelectedBus(bus);
    setSelectedStop(null);
    setActivePanel('bus');
    if (isMobile) {
      setIsDrawerOpen(true);
    }
  };

  const handleStopSelect = (stop: Stop) => {
    setSelectedStop(stop);
    setSelectedBus(null);
    setActivePanel('stop');
    if (isMobile) {
      setIsDrawerOpen(true);
    }
  };

  const handleRouteSelect = (route: Route) => {
    toast.info(`Selected route ${route.number}: ${route.name}`);
    setActivePanel('search');
  };

  const handleGetDirections = (stop: Stop) => {
    toast.info(`Getting directions to ${stop.name}...`);
  };

  const handleToggleFavorite = async (id: string, type: 'route' | 'stop') => {
    const isCurrentlyFavorite = userFavorites.includes(id);
    
    try {
      if (isCurrentlyFavorite) {
        await userAPI.removeFavorite(id);
        setUserFavorites(prev => prev.filter(fav => fav !== id));
        toast.success('Removed from favorites');
      } else {
        await userAPI.addFavorite(id, type);
        setUserFavorites(prev => [...prev, id]);
        toast.success('Added to favorites');
      }
      
      // Update local user state
      if (user) {
        const updatedUser = {
          ...user,
          preferences: {
            ...user.preferences,
            favoriteRoutes: isCurrentlyFavorite 
              ? userFavorites.filter(fav => fav !== id)
              : [...userFavorites, id]
          }
        };
        setUser(updatedUser);
      }
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(`Failed to update favorites: ${errorMessage}`);
      console.error('Favorite toggle error:', error);
    }
  };

  const closePanels = () => {
    setSelectedBus(null);
    setSelectedStop(null);
    setActivePanel('search');
  };

  const renderSidePanel = () => {
    switch (activePanel) {
      case 'bus':
        return (
          <BusDetailsPanel 
            bus={selectedBus} 
            onClose={closePanels} 
          />
        );
      case 'stop':
        return (
          <StopDetailsPanel 
            stop={selectedStop} 
            onClose={closePanels}
            onGetDirections={handleGetDirections}
            isFavorite={selectedStop ? userFavorites.includes(selectedStop.id) : false}
            onToggleFavorite={() => selectedStop && handleToggleFavorite(selectedStop.id, 'stop')}
          />
        );
      case 'search':
      default:
        return (
          <SearchPanel
            onRouteSelect={handleRouteSelect}
            onStopSelect={handleStopSelect}
            userFavorites={userFavorites}
            onToggleFavorite={handleToggleFavorite}
          />
        );
    }
  };

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        <Toaster />
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white z-10">
          <div className="flex items-center gap-2">
            <Bus className="w-6 h-6 text-primary" />
            <span className="font-semibold">Bus Tracker</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[80vh]">
                {renderSidePanel()}
              </DrawerContent>
            </Drawer>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    {user?.name}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                size="sm" 
                onClick={() => setShowAuthModal(true)}
              >
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Map */}
        <div className="flex-1">
          <Map
            selectedBus={selectedBus}
            onBusSelect={handleBusSelect}
            onStopSelect={handleStopSelect}
          />
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen flex flex-col">
      <Toaster />
      
      {/* Desktop Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white z-10">
        <div className="flex items-center gap-2">
          <Bus className="w-6 h-6 text-primary" />
          <span className="text-xl font-semibold">Bus Tracker</span>
          <span className="text-sm text-muted-foreground">Real-time transit information</span>
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {user?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setShowAuthModal(true)}>
              <User className="w-4 h-4 mr-2" />
              Login / Sign Up
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Main Content */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            {renderSidePanel()}
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={70}>
            <Map
              selectedBus={selectedBus}
              onBusSelect={handleBusSelect}
              onStopSelect={handleStopSelect}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
      />
    </div>
  );
}