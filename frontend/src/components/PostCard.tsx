import React, { useRef } from 'react';
import { Post, Tab } from '../app/types';
import { getApiBaseUrl, renderFormattedText } from '../app/utils';

interface PostCardProps {
    post: Post;
    activeMenuId: number | null;
    onToggleMenu: (id: number) => void;
    activeTabId: number | null;
    tabs: Tab[];
    onMovePost: (postId: number, tabId: number | null) => void;
    confirmDeleteId: number | null;
    setConfirmDeleteId: (id: number | null) => void;
    onDeletePost: (id: number) => void;
    openLightbox: (post: Post, index: number) => void;
    setRef: (el: HTMLDivElement | null) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
    post,
    activeMenuId,
    onToggleMenu,
    activeTabId,
    tabs,
    onMovePost,
    confirmDeleteId,
    setConfirmDeleteId,
    onDeletePost,
    openLightbox,
    setRef,
}) => {
    return (
        <div
            ref={setRef}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative text-gray-800 group/card"
        >
            <div className={`absolute top-2 right-2 z-10 ${activeMenuId === post.id ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'} transition-opacity`}>
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleMenu(post.id);
                            setConfirmDeleteId(null);
                        }}
                        className="bg-white/80 hover:bg-white backdrop-blur-sm p-1.5 rounded-full text-gray-500 hover:text-gray-800 shadow-sm transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === post.id && (
                        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-100 w-48 py-1 z-20 animate-in fade-in slide-in-from-top-1">

                            {/* Move To... */}
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Move to</div>
                            <button
                                onClick={() => onMovePost(post.id, null)}
                                disabled={activeTabId === null}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${activeTabId === null ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                Inbox {activeTabId === null && '✓'}
                            </button>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => onMovePost(post.id, tab.id)}
                                    disabled={activeTabId === tab.id}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${activeTabId === tab.id ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {tab.title} {activeTabId === tab.id && '✓'}
                                </button>
                            ))}

                            <div className="h-px bg-gray-100 my-1"></div>

                            {/* Delete */}
                            {!confirmDeleteId ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteId(post.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    Delete Post
                                </button>
                            ) : (
                                <div className="px-2 py-1">
                                    <p className="text-xs text-center text-gray-600 mb-2">Are you sure?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDeleteId(null);
                                            }}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 rounded-md"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeletePost(post.id);
                                            }}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded-md"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {post.media.length > 0 && (
                <div className={`grid gap-0 rounded-t-2xl overflow-hidden ${post.media.length === 1 ? 'grid-cols-1' :
                    post.media.length === 2 ? 'grid-cols-2' :
                        'grid-cols-3'
                    }`}>
                    {post.media.map((item, index) => (
                        item.type === 'photo' ? (
                            <div
                                key={index}
                                className={`relative cursor-pointer overflow-hidden group ${post.media.length > 1 ? 'aspect-square' : ''}`}
                                onClick={() => openLightbox(post, index)}
                            >
                                <img
                                    src={`${getApiBaseUrl()}${item.url}`}
                                    alt={`Attachment ${index + 1}`}
                                    className={`w-full ${post.media.length > 1 ? 'h-full object-cover' : 'h-auto'} group-hover:scale-105 transition-transform duration-200`}
                                />
                            </div>
                        ) : item.type === 'video' ? (
                            <div
                                key={index}
                                className={`relative cursor-pointer overflow-hidden group bg-black ${post.media.length > 1 ? 'aspect-square' : ''}`}
                                onClick={() => openLightbox(post, index)}
                            >
                                <video
                                    src={`${getApiBaseUrl()}${item.url}`}
                                    className={`w-full ${post.media.length > 1 ? 'h-full object-cover' : 'h-auto'} opacity-90 group-hover:opacity-100 transition-opacity duration-200`}
                                    muted
                                    playsInline
                                    key={item.url}
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 opacity-80 drop-shadow-lg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                                    </svg>
                                </div>
                            </div>
                        ) : null
                    ))}
                </div>
            )}

            {/* Link Preview Card */}
            {post.link_preview && (
                <a
                    href={post.link_preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-2 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors group/preview"
                >
                    {post.link_preview.image && (
                        <div className="relative aspect-video w-full overflow-hidden">
                            <img
                                src={post.link_preview.image}
                                alt={post.link_preview.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Optional: Play button overlay if it looks like a video */}
                        </div>
                    )}
                    <div className="p-3 border-l-4 border-l-transparent group-hover/preview:border-l-blue-500 transition-all">
                        <div className="text-xs font-semibold text-blue-600 mb-0.5">{post.link_preview.site_name}</div>
                        <div className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{post.link_preview.title}</div>
                        <div className="text-xs text-gray-600 line-clamp-2">{post.link_preview.description}</div>
                    </div>
                </a>
            )}

            <div className="p-4 md:p-6 pt-2">
                {post.content && <p className="whitespace-pre-wrap break-words">{renderFormattedText(post.content, post.entities)}</p>}
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleString()}
                    </span>
                    {post.source_url && (
                        <a
                            href={post.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            title="Open in Telegram"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-1.05-2.4-1.66-1.06-.7-.37-1.09.23-1.72.15-.16 2.8-2.57 2.85-2.78.01-.03.01-.13-.06-.18-.07-.05-.19-.03-.27-.01-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.35-.49.96-.75 3.78-1.65 6.31-2.74 7.58-3.27 3.61-1.51 4.36-1.77 4.85-1.78.11 0 .35.03.5.16.13.11.16.26.17.37.01.11.01.22 0 .24z" />
                            </svg>
                            Source
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};
