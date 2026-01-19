'use client';

import { Suspense } from 'react'; // Added import

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // Added for URL state
import { DndProvider, useDrag, useDrop, useDragLayer } from 'react-dnd';
import { HTML5Backend, NativeTypes } from 'react-dnd-html5-backend';
import { LoginScreen } from '../components/LoginScreen';
import { InputBar } from '../components/InputBar';
import { MainHeader } from '../components/MainHeader';
import { PostCard } from '../components/PostCard';
import { PostGridItem } from '../components/PostGridItem';
import { Lightbox } from '../components/Lightbox';
import { CustomDragLayer } from '../components/CustomDragLayer';
import { TrashCan } from '../components/TrashCan';
import { getApiBaseUrl, getEmptyImage, linkifyText, renderFormattedText } from './utils';
import { MediaItem, Entity, Post, Tab, LinkPreview } from './types';

const ItemTypes = {
  POST: 'post',
  TAB: 'tab',
};

// --- DnD Components ---





// --- Custom Drag Layer for Scaling ---


// --- Trash Can Component ---

function TabbedApp() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginLink, setLoginLink] = useState<string | null>(null);
  const [loginToken, setLoginToken] = useState<string | null>(null);

  // App State
  const [posts, setPosts] = useState<Post[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);

  // URL State Management
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL or defaults
  const tabParam = searchParams.get('tab');
  const viewParam = searchParams.get('view');

  const [activeTabId, setActiveTabId] = useState<number | null>(() => {
    if (tabParam === 'inbox' || !tabParam) return null;
    return isNaN(parseInt(tabParam)) ? null : parseInt(tabParam);
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (viewParam === 'grid' || viewParam === 'list') ? viewParam : 'list';
  });

  // Sync URL when state changes
  const updateUrlState = useCallback((newTabId: number | null, newViewMode: 'list' | 'grid') => {
    const params = new URLSearchParams(searchParams.toString());

    if (newTabId === null) {
      params.set('tab', 'inbox');
    } else {
      params.set('tab', newTabId.toString());
    }

    params.set('view', newViewMode);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);


  // Wrappers to update both state and URL
  const handleSetTabId = (id: number | null) => {
    setActiveTabId(id);
    updateUrlState(id, viewMode);
  };

  const handleSetViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    updateUrlState(activeTabId, mode);
  };

  // Sync state if URL changes externally (e.g. back button)
  useEffect(() => {
    const tParam = searchParams.get('tab');
    const vParam = searchParams.get('view');

    const newTabId = (tParam === 'inbox' || !tParam) ? null : parseInt(tParam);
    const newViewMode = (vParam === 'grid' || vParam === 'list') ? vParam : 'list';

    if (newTabId !== activeTabId) setActiveTabId(isNaN(newTabId as number) ? null : newTabId);
    if (newViewMode !== viewMode) setViewMode(newViewMode);
  }, [searchParams]);


  const [isCreatingTab, setIsCreatingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Refs for scrolling
  const postRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const handleGridItemClick = (postId: number) => {
    handleSetViewMode('list');
    // Give it a tick to render list before scrolling
    setTimeout(() => {
      postRefs.current[postId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Lightbox State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0);

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // 1. Initial Auth Check
  useEffect(() => {
    const storedUserId = localStorage.getItem('tabs_user_id');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // 2. Login Flow
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/init`, { method: 'POST' });
      const data = await res.json();
      setLoginLink(data.bot_url);
      setLoginToken(data.token);

      // Open Telegram Bot
      window.open(data.bot_url, '_blank');
    } catch (error) {
      console.error('Login init failed:', error);
      setIsLoggingIn(false);
    }
  };

  // 3. Poll for Auth Status
  useEffect(() => {
    if (!loginToken || isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        console.log(`Polling status for ${loginToken}...`);
        const res = await fetch(`${getApiBaseUrl()}/auth/status?token=${loginToken}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'authenticated') {
            localStorage.setItem('tabs_user_id', data.user_id);
            setUserId(data.user_id);
            setIsAuthenticated(true);
            setLoginToken(null); // Stop polling
            setIsLoggingIn(false);
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [loginToken, isAuthenticated]);

  // 3. Data Fetching
  const fetchTabs = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/tabs`, {
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTabs(data);
      }
    } catch (error) {
      console.error('Failed to fetch tabs:', error);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      // Append tab_id query param if activeTabId is set (or strictly absent for Inbox if we follow logic)
      // My API logic: tab_id=None -> Inbox. tab_id=ID -> Tab.
      // So URL should be /posts?tab_id=123. If Inbox, /posts (or /posts?tab_id=null but simple fetch usually ignores null params or we skip it)
      let url = `${getApiBaseUrl()}/posts`;
      if (activeTabId !== null) {
        url += `?tab_id=${activeTabId}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, activeTabId]);

  // Initial Fetch
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchTabs();
      fetchPosts();
    }
  }, [isAuthenticated, userId, fetchPosts, fetchTabs]);

  // 5. Actions
  const handleLogout = () => {
    localStorage.removeItem('tabs_user_id');
    setIsAuthenticated(false);
    setUserId(null);
  };

  const handleCreateTab = async (title: string) => {
    if (!userId || !title.trim()) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/tabs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({ title: title.trim() })
      });
      if (res.ok) {
        const newTab = await res.json();
        setTabs([...tabs, newTab]);
        setNewTabName('');
        setIsCreatingTab(false);
      }
    } catch (error) {
      console.error('Failed to create tab:', error);
    }
  };

  const handleMovePost = async (postId: number, targetTabId: number | null) => {
    if (!userId) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/posts/${postId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({ tab_id: targetTabId })
      });
      if (res.ok) {
        // Remove locally from current view if filtering
        setPosts(posts.filter(p => p.id !== postId));
        setActiveMenuId(null);
      }
    } catch (error) {
      console.error('Failed to move post:', error);
    }
  };

  const openLightbox = (post: Post, index: number) => {
    setSelectedPost(post);
    setSelectedMediaIndex(index);
  };

  // Lightbox Navigation Controls
  const handlePrev = useCallback(() => {
    if (!selectedPost) return;
    setSelectedMediaIndex((prev) => (prev > 0 ? prev - 1 : selectedPost.media.length - 1));
  }, [selectedPost]);

  const handleNext = useCallback(() => {
    if (!selectedPost) return;
    setSelectedMediaIndex((prev) => (prev < selectedPost.media.length - 1 ? prev + 1 : 0));
  }, [selectedPost]);

  const closeLightbox = useCallback(() => {
    setSelectedPost(null);
    setSelectedMediaIndex(0);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedPost) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost, handlePrev, handleNext, closeLightbox]);


  // --- Drag and Drop Logic ---

  const handleSwapPosts = useCallback(async (id1: number, id2: number) => {
    const idx1 = posts.findIndex(p => p.id === id1);
    const idx2 = posts.findIndex(p => p.id === id2);
    if (idx1 === -1 || idx2 === -1) return;

    // Calculate NEW state
    const newPosts = [...posts];
    const temp = newPosts[idx1];
    newPosts[idx1] = newPosts[idx2];
    newPosts[idx2] = temp;

    // Update UI immediately
    setPosts(newPosts);

    // Persist to Backend
    if (userId) {
      const postIds = newPosts.map(p => p.id);
      try {
        await fetch(`${getApiBaseUrl()}/posts/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}`
          },
          body: JSON.stringify({ post_ids: postIds })
        });
      } catch (e) {
        console.error("Failed to save order", e);
      }
    }
  }, [posts, userId]);

  const deletePost = useCallback(async (postId: number) => {
    if (!userId) return;

    // 1. Optimistic Update: Remove immediately from UI
    const previousPosts = [...posts];
    setPosts(current => current.filter(p => p.id !== postId));
    setActiveMenuId(null);
    setConfirmDeleteId(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      });

      if (!res.ok) {
        if (res.status === 404) {
          // Post already deleted on server, consider it a success
          return;
        }
        throw new Error(`Server returned ${res.status}`);
      }
      // Success: Do nothing (state is already correct)

    } catch (error) {
      console.error('Failed to delete post:', error);
      // Revert on failure
      setPosts(previousPosts);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Failed to delete (User: ${userId}): ${msg}`);
    }
  }, [posts, userId]);

  const deleteTab = useCallback(async (tabId: number) => {
    if (!userId) return;

    // Optimistic: Remove tab
    const previousTabs = [...tabs];
    setTabs(current => current.filter(t => t.id !== tabId));
    if (activeTabId === tabId) setActiveTabId(null); // Switch to Inbox

    try {
      const res = await fetch(`${getApiBaseUrl()}/tabs/${tabId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);

      // Optimistic: Move posts in local state to Inbox
      setPosts(current => current.map(p => p.tab_id === tabId ? { ...p, tab_id: null } : p));

    } catch (e) {
      console.error(e);
      alert('Failed to delete tab');
      setTabs(previousTabs);
    }
  }, [tabs, userId, activeTabId]);



  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
      setConfirmDeleteId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // --- Post Creation Logic ---
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Added ref
  const [isSending, setIsSending] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`; // Max height ~32px * 4 lines
    }
  }, [inputText]);

  // Link Preview Logic
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [dismissedPreviewUrl, setDismissedPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const match = inputText.match(/(https?:\/\/[^\s]+)/);
    const url = match ? match[0] : null;

    if (!url) {
      if (linkPreview) setLinkPreview(null);
      return;
    }

    if (url === dismissedPreviewUrl) return;
    if (linkPreview && linkPreview.url === url) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/utils/link-preview?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if ((data.title && data.title !== "") || (data.image && data.image !== "")) {
            setLinkPreview(data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch link preview", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputText, dismissedPreviewUrl, linkPreview]);


  // Preview URLs for attachments
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newUrls);

    // Cleanup
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);


  const handleCreatePost = async () => {
    if ((!inputText.trim() && selectedFiles.length === 0) || !userId || isSending) return;
    setIsSending(true);

    try {
      const formData = new FormData();
      if (inputText.trim()) formData.append('content', inputText.trim());
      if (linkPreview) formData.append('link_preview', JSON.stringify(linkPreview));

      // Append each file with the same key 'media'
      selectedFiles.forEach(file => {
        formData.append('media', file);
      });

      const res = await fetch(`${getApiBaseUrl()}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userId}`
          // Content-Type is auto-set by browser for FormData
        },
        body: formData
      });

      if (res.ok) {
        const newPost = await res.json();
        // Prepend to posts (handle potentially grouped response later, assuming backend returns formatted object)
        setPosts([newPost, ...posts]);

        // Reset Input
        setInputText('');
        setSelectedFiles([]);
        setLinkPreview(null);
        setDismissedPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Failed to create post", error);
      alert("Failed to send post");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };


  // Catch-all drop target to prevent native browser snap-back animation
  // (Assuming Layout handles global drops, we use this for local drop prevention)
  // ... (previous logic)

  // Drag and Drop for Input Bar
  const [{ isWrapperOver }, dropWrapper] = useDrop(() => ({
    accept: [ItemTypes.POST, NativeTypes.FILE], // Accept both internal items and native files
    collect: (monitor) => ({
      isWrapperOver: monitor.isOver(),
    }),
    drop: (item: any, monitor) => {
      if (monitor.getItemType() === NativeTypes.FILE) {
        const files = (monitor.getItem() as any).files;
        if (files && files.length > 0) {
          setSelectedFiles(prev => [...prev, ...files]);
        }
        return { handled: true };
      }
      return undefined;
    }
  }));


  // Catch-all drop target to prevent native browser snap-back animation
  // When dropping on "nothing", browser thinks it's a cancel and animates back.
  // By catching it here, we tell the browser it was "handled", so it finishes instantly.
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.POST,
    drop: (_item, monitor) => {
      // If a child (like a Tab) already handled it, do nothing.
      if (monitor.didDrop()) {
        return;
      }
      // Otherwise, we "handle" it effectively by doing nothing but returning.
      // This counts as a successful drop to the browser.
      return { handled: true };
    },
  }));

  // RENDER: Login Screen
  if (!isLoading && !isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isLoggingIn={isLoggingIn}
        loginLink={loginLink}
      />
    );
  }



  // RENDER: Feed
  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      className="min-h-screen font-[family-name:var(--font-geist-sans)]"
    >
      {/* Unified Sticky Header */}
      <MainHeader
        viewMode={viewMode}
        onSetViewMode={handleSetViewMode}
        onLogout={handleLogout}
        activeTabId={activeTabId}
        onSetTabId={handleSetTabId}
        onMovePost={handleMovePost}
        tabs={tabs}
        isCreatingTab={isCreatingTab}
        setIsCreatingTab={setIsCreatingTab}
        newTabName={newTabName}
        setNewTabName={setNewTabName}
        handleCreateTab={handleCreateTab}
      />

      <main className={`mx-auto p-4 md:p-8 ${viewMode === 'list' ? 'max-w-xl' : 'max-w-4xl'}`}>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No posts yet. Start saving from Telegram!</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                activeMenuId={activeMenuId}
                onToggleMenu={(id) => setActiveMenuId(activeMenuId === id ? null : id)}
                activeTabId={activeTabId}
                tabs={tabs}
                onMovePost={handleMovePost}
                confirmDeleteId={confirmDeleteId}
                setConfirmDeleteId={setConfirmDeleteId}
                onDeletePost={deletePost}
                openLightbox={openLightbox}
                setRef={el => { postRefs.current[post.id] = el }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {posts.map((post, index) => (
              <PostGridItem
                key={post.id}
                post={post}
                index={index}
                onSwap={handleSwapPosts}
                onClick={handleGridItemClick}
              />
            ))}
          </div>
        )}
      </main >

      {/* Lightbox Overlay */}
      <Lightbox
        selectedPost={selectedPost}
        selectedMediaIndex={selectedMediaIndex}
        closeLightbox={closeLightbox}
        handlePrev={handlePrev}
        handleNext={handleNext}
      />
      <CustomDragLayer />
      <TrashCan onDeletePost={deletePost} onDeleteTab={deleteTab} />

      {/* Floating Input Bar */}
      <InputBar
        inputText={inputText}
        setInputText={setInputText}
        selectedFiles={selectedFiles}
        onFileSelect={handleFileSelect}
        onRemoveFile={(index) => {
          const newFiles = [...selectedFiles];
          newFiles.splice(index, 1);
          setSelectedFiles(newFiles);
          if (newFiles.length === 0 && fileInputRef.current) fileInputRef.current.value = '';
        }}
        linkPreview={linkPreview}
        onRemovePreview={() => {
          if (linkPreview) setDismissedPreviewUrl(linkPreview.url);
          setLinkPreview(null);
        }}
        previewUrls={previewUrls}
        isSending={isSending}
        onSend={handleCreatePost}
        fileInputRef={fileInputRef}
        textareaRef={textareaRef}
        dropWrapperRef={dropWrapper as unknown as React.RefObject<HTMLDivElement>}
        isWrapperOver={isWrapperOver}
      />

    </div >
  );
}

export default function Home() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        <TabbedApp />
      </Suspense>
    </DndProvider>
  );
}
