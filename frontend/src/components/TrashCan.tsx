import React from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import { ItemTypes } from '../app/constants';

interface TrashCanProps {
    onDeletePost: (id: number) => void;
    onDeleteTab: (id: number) => void;
}

export const TrashCan: React.FC<TrashCanProps> = ({ onDeletePost, onDeleteTab }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: [ItemTypes.POST, ItemTypes.TAB],
        drop: (item: { id: number, type: string }) => {
            if (item.type === ItemTypes.POST) {
                onDeletePost(item.id);
            } else if (item.type === ItemTypes.TAB) {
                onDeleteTab(item.id);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }), [onDeletePost, onDeleteTab]);

    const { isDragging } = useDragLayer((monitor) => ({
        isDragging: monitor.isDragging(),
    }));

    // Always render but hide to prevent unmounting race conditions on drop
    return (
        <div
            ref={drop as unknown as React.RefObject<HTMLDivElement>}
            className={`fixed bottom-8 right-8 p-6 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center
        ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}
        ${isOver
                    ? 'bg-red-500 text-white scale-110 shadow-red-500/50 cursor-copy'
                    : 'bg-white/80 backdrop-blur-md text-gray-400 border-2 border-dashed border-gray-300 hover:border-red-400 hover:text-red-400'
                }
      `}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        </div>
    );
};
