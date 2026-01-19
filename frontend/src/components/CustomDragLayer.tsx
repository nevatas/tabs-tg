import React from 'react';
import { useDragLayer } from 'react-dnd';
import { Post } from '../app/types';

export const CustomDragLayer = () => {
    const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        currentOffset: monitor.getClientOffset(),
        isDragging: monitor.isDragging(),
    }));

    if (!isDragging || !currentOffset || !item.post) {
        return null;
    }

    const post = item.post as Post;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            <div
                className="opacity-80 transition-opacity" // Added transparency
                style={{
                    transform: `translate(${currentOffset.x}px, ${currentOffset.y}px) scale(0.5)`,
                    transformOrigin: 'top left',
                }}
            >
                <div className="w-80 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 pointer-events-none">
                    {post.media && post.media.length > 0 ? (
                        <div className="aspect-video relative">
                            {post.media[0].type === 'video' ? (
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                </div>
                            ) : (
                                <img src={`http://192.168.8.191:8000${post.media[0].url}`} alt="" className="w-full h-full object-cover" />
                            )}
                            {post.media.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-bold">
                                    +{post.media.length - 1}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-50/50">
                            <p className="text-xs text-gray-400 font-medium">Post Preview</p>
                        </div>
                    )}
                    <div className="p-3">
                        <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                            {post.content || 'No text content'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
