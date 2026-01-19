import React, { useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ItemTypes } from '../app/constants';
import { Post } from '../app/types';

// Duplicate helper for now
const getEmptyImage = () => {
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    return img;
};

interface PostGridItemProps {
    post: Post;
    index: number;
    onSwap: (dragId: number, dropId: number) => void;
    onClick: (postId: number) => void;
}

export const PostGridItem: React.FC<PostGridItemProps> = ({ post, index, onSwap, onClick }) => {
    const ref = useRef<HTMLDivElement>(null);

    const [{ isOver }, drop] = useDrop({
        accept: ItemTypes.POST,
        drop: (item: { id: number }) => {
            if (item.id !== post.id) {
                onSwap(item.id, post.id);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    });

    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: ItemTypes.POST,
        item: { id: post.id, type: ItemTypes.POST, post, index },
        collect: (monitor) => ({
            isDragging: monitor.getItem()?.id === post.id,
        }),
    }), [post.id, post, index]);

    // Disable default browser preview in favor of CustomDragLayer
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    drag(drop(ref));

    return (
        <div
            ref={ref}
            className={`relative cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform 
        ${isDragging ? 'opacity-50' : 'opacity-100'} 
        ${isOver ? 'ring-2 ring-blue-500 scale-105 z-10' : ''}
        rounded-xl
      `}
        >
            <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer aspect-square flex flex-col group h-full"
                onClick={() => onClick(post.id)}
            >
                {/* Media Thumbnail */}
                {post.media.length > 0 ? (
                    <div className="relative h-3/5 bg-gray-50 overflow-hidden shrink-0">
                        {post.media[0].type === 'photo' ? (
                            <img
                                src={`http://localhost:8000${post.media[0].url}`}
                                alt="Thumbnail"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <video
                                src={`http://localhost:8000${post.media[0].url}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                muted
                            />
                        )}
                        {post.media.length > 1 && (
                            <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm">
                                +{post.media.length - 1}
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Text Content */}
                <div className="p-3 flex-grow flex flex-col justify-start overflow-hidden min-h-0">
                    <p
                        className="text-sm text-gray-700 leading-snug overflow-hidden break-words"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: post.media.length > 0 ? 4 : 10,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {post.content || "Empty post"}
                    </p>
                    <div className="mt-auto pt-3 shrink-0">
                        <span className="text-[10px] text-gray-400 block">
                            {new Date(post.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
