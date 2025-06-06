import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  PlusCircle, 
  FileText, 
  Star, 
  Archive, 
  Trash2, 
  Settings, 
  CheckCircle, 
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import type { LocalNote, AppState } from '@shared/schema';

interface SidebarProps {
  notes: LocalNote[];
  appState: AppState;
  onCreateNote: () => void;
  onFilterChange: (filter: 'all' | 'favorites' | 'archived' | 'trash') => void;
  onTagSelect: (tag: string | null) => void;
  onManualSync: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  activeFilter: string;
  tags: { tag: string; count: number; color: string }[];
}

export function Sidebar({
  notes,
  appState,
  onCreateNote,
  onFilterChange,
  onTagSelect,
  onManualSync,
  onOpenSettings,
  onToggleSidebar,
  activeFilter,
  tags
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allNotesCount = notes.filter(n => !n.isDeleted && !n.isArchived).length;
  const favoriteCount = notes.filter(n => !n.isDeleted && n.isFavorite).length;
  const archivedCount = notes.filter(n => !n.isDeleted && n.isArchived).length;
  const trashCount = notes.filter(n => n.isDeleted).length;

  const getSyncIcon = () => {
    switch (appState.syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case 'offline':
        return <RefreshCw className="h-4 w-4 text-slate-400" />;
      case 'error':
        return <RefreshCw className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getSyncStatusText = () => {
    switch (appState.syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return 'Synced';
      case 'offline':
        return 'Offline';
      case 'error':
        return 'Sync Error';
      default:
        return 'Unknown';
    }
  };

  const getSyncStatusColor = () => {
    switch (appState.syncStatus) {
      case 'syncing':
        return 'text-blue-600';
      case 'synced':
        return 'text-green-600';
      case 'offline':
        return 'text-slate-500';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className={`${appState.sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-60'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">NoteMaster</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            {appState.sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Sync Status */}
        <div className="mt-3 flex items-center text-sm">
          <div className={`flex items-center ${getSyncStatusColor()}`}>
            {getSyncIcon()}
            <span className="ml-2">{getSyncStatusText()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onManualSync}
            className="ml-auto h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
            disabled={appState.syncStatus === 'syncing'}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* New Note Button */}
      <div className="p-4 border-b border-slate-200">
        <Button 
          onClick={onCreateNote}
          className="w-full bg-primary text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-4">
          <div className="space-y-2">
            <Button
              variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onFilterChange('all')}
            >
              <FileText className="h-4 w-4 mr-3 text-primary" />
              <span>All Notes</span>
              <Badge variant="secondary" className="ml-auto">
                {allNotesCount}
              </Badge>
            </Button>
            
            <Button
              variant={activeFilter === 'favorites' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onFilterChange('favorites')}
            >
              <Star className="h-4 w-4 mr-3" />
              <span>Favorites</span>
              <Badge variant="secondary" className="ml-auto">
                {favoriteCount}
              </Badge>
            </Button>
            
            <Button
              variant={activeFilter === 'archived' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onFilterChange('archived')}
            >
              <Archive className="h-4 w-4 mr-3" />
              <span>Archive</span>
              <Badge variant="secondary" className="ml-auto">
                {archivedCount}
              </Badge>
            </Button>
            
            <Button
              variant={activeFilter === 'trash' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onFilterChange('trash')}
            >
              <Trash2 className="h-4 w-4 mr-3" />
              <span>Trash</span>
              <Badge variant="secondary" className="ml-auto">
                {trashCount}
              </Badge>
            </Button>
          </div>

          {/* Tags Section */}
          {tags.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  Tags
                </h3>
              </div>
              <div className="space-y-1">
                {tags.map(({ tag, count, color }) => (
                  <Button
                    key={tag}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm h-7"
                    onClick={() => onTagSelect(tag)}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 bg-${color}-500`} />
                    <span className="truncate">{tag}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* Settings */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4 mr-3" />
          <span>Settings</span>
        </Button>
      </div>
    </div>
  );
}
