import React from 'react';
import { DroppableTab } from './DroppableTab';
import { Tab } from '../app/types';

interface MainHeaderProps {
    viewMode: 'list' | 'grid';
    onSetViewMode: (mode: 'list' | 'grid') => void;
    onLogout: () => void;
    activeTabId: number | null;
    onSetTabId: (id: number | null) => void;
    onMovePost: (postId: number, tabId: number | null) => void;
    tabs: Tab[];
    isCreatingTab: boolean;
    setIsCreatingTab: (isCreating: boolean) => void;
    newTabName: string;
    setNewTabName: (name: string) => void;
    handleCreateTab: (name: string) => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
    viewMode,
    onSetViewMode,
    onLogout,
    activeTabId,
    onSetTabId,
    onMovePost,
    tabs,
    isCreatingTab,
    setIsCreatingTab,
    newTabName,
    setNewTabName,
    handleCreateTab,
}) => {
    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-sm transition-all duration-300 flex flex-col pt-2">
            {/* Top Part: Title, Toggle, Logout */}
            <div className="max-w-4xl mx-auto px-4 py-2 flex justify-between items-center w-full">
                <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-tighter">Your Saved Posts</h1>

                {/* View Toggle */}
                <div className="flex bg-gray-200/50 p-1 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => onSetViewMode('list')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                            ? 'bg-white shadow-sm text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        title="List View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    </button>
                    <button
                        onClick={() => onSetViewMode('grid')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'grid'
                            ? 'bg-white shadow-sm text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        title="Grid View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </button>
                </div>

                <button
                    onClick={onLogout}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-red-100"
                >
                    Logout
                </button>
            </div>

            {/* Bottom Part: Tabs Bar */}
            <div className="overflow-x-auto no-scrollbar w-full">
                <div className="max-w-4xl mx-auto px-4 flex items-center gap-4 py-2 pb-4">
                    {/* Inbox Tab */}
                    <DroppableTab
                        tabId={null}
                        activeTabId={activeTabId}
                        title="Inbox"
                        onClick={() => onSetTabId(null)}
                        onDrop={onMovePost}
                    />

                    {/* User Tabs */}
                    {tabs.map(tab => (
                        <DroppableTab
                            key={tab.id}
                            tabId={tab.id}
                            activeTabId={activeTabId}
                            title={tab.title}
                            onClick={() => onSetTabId(tab.id)}
                            onDrop={onMovePost}
                        />
                    ))}

                    {/* Add Tab Button */}
                    {isCreatingTab ? (
                        <div className="flex items-center gap-2 bg-gray-100/80 rounded-full px-4 py-2 flex-shrink-0 animate-in fade-in slide-in-from-left-4 border-2 border-blue-100">
                            <input
                                autoFocus
                                type="text"
                                value={newTabName}
                                onChange={(e) => setNewTabName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateTab(newTabName);
                                    if (e.key === 'Escape') {
                                        setIsCreatingTab(false);
                                        setNewTabName('');
                                    }
                                }}
                                className="bg-transparent border-none focus:ring-0 text-lg font-medium w-32 px-1"
                                placeholder="New Tab"
                            />
                            <button onClick={() => { setIsCreatingTab(false); setNewTabName(''); }} className="text-red-400 hover:text-red-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreatingTab(true)}
                            className="px-6 py-3 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm border-2 border-transparent hover:border-blue-200 flex-shrink-0 font-bold"
                            title="Add Tab"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            New Tab
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
