import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ItemTypes } from '../app/constants';

interface DroppableTabProps {
    tabId: number | null;
    activeTabId: number | null;
    title: string;
    onClick: () => void;
    onDrop: (postId: number, tabId: number | null) => void;
}

export const DroppableTab: React.FC<DroppableTabProps> = ({ tabId, activeTabId, title, onClick, onDrop }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.POST,
        drop: (item: { id: number, type: string }) => onDrop(item.id, tabId),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }), [tabId, onDrop]);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TAB,
        item: { id: tabId, type: ItemTypes.TAB, title },
        canDrag: tabId !== null, // Inbox (null) is not draggable
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [tabId, title]);

    return (
        <div
            ref={(node) => { drag(drop(node)); }}
            className={`relative ${isDragging ? 'opacity-50' : 'opacity-100'} rounded-full`}
        >
            <button
                onClick={onClick}
                className={`px-8 py-3 rounded-full text-lg font-bold transition-all whitespace-nowrap flex-shrink-0 relative z-10
          ${activeTabId === tabId
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : isOver
                            ? 'bg-blue-100 text-blue-700 ring-4 ring-blue-400'
                            : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200'
                    }`}
            >
                {title}
            </button>
            {isOver && (
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md scale-125 animate-pulse" />
            )}
        </div>
    );
};
