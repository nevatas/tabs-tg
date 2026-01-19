import React from 'react';
import { Entity } from './types';

// Dynamic API Base URL
export const getApiBaseUrl = () => {
    // Use environment variable if available (set in Railway)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    // Fallback for local development
    if (typeof window === 'undefined') return 'http://localhost:8000';
    return `http://${window.location.hostname}:8000`;
};

// Helper for empty image
export const getEmptyImage = () => {
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    return img;
};

// Helper function to convert URLs to clickable links
export function linkifyText(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    {part}
                </a>
            );
        }
        return part;
    });
}

// Helper function to render text with Telegram entities (formatting)
export function renderFormattedText(text: string | null, entities: Entity[] | string | null) {
    if (!text) return null;

    let parsedEntities: Entity[] = [];
    if (typeof entities === 'string') {
        try {
            parsedEntities = JSON.parse(entities);
        } catch (e) {
            console.error('Failed to parse entities:', e);
            return linkifyText(text);
        }
    } else if (Array.isArray(entities)) {
        parsedEntities = entities;
    }

    if (!parsedEntities || parsedEntities.length === 0) return linkifyText(text);

    try {
        // Sort entities by offset in reverse to apply from end to start
        const sortedEntities = [...parsedEntities].sort((a, b) => b.offset - a.offset);

        let lastIndex = text.length;
        const parts: Array<{ text: string, entity?: any }> = [];
        for (const entity of sortedEntities) {
            const start = entity.offset;
            const end = entity.offset + entity.length;

            // Add text after this entity
            if (lastIndex > end) {
                parts.unshift({ text: text.substring(end, lastIndex) });
            }

            // Add entity part
            parts.unshift({ text: text.substring(start, end), entity });
            lastIndex = start;
        }

        // Add remaining text before first entity
        if (lastIndex > 0) {
            parts.unshift({ text: text.substring(0, lastIndex) });
        }

        // Render parts with formatting
        return parts.map((part, index) => {
            if (!part.entity) {
                return <span key={index}>{linkifyText(part.text)}</span>;
            }

            const entity = part.entity;
            const content = part.text;

            switch (entity.type) {
                case 'bold':
                    return <strong key={index}>{content}</strong>;
                case 'italic':
                    return <em key={index}>{content}</em>;
                case 'underline':
                    return <u key={index}>{content}</u>;
                case 'strikethrough':
                    return <s key={index}>{content}</s>;
                case 'code':
                    return <code key={index} className="bg-gray-100 px-1 rounded">{content}</code>;
                case 'pre':
                    return <pre key={index} className="bg-gray-100 p-2 rounded overflow-x-auto">{content}</pre>;
                case 'text_link':
                    return (
                        <a
                            key={index}
                            href={entity.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            {content}
                        </a>
                    );
                case 'url':
                    return (
                        <a
                            key={index}
                            href={content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            {content}
                        </a>
                    );
                default:
                    return <span key={index}>{content}</span>;
            }
        });
    } catch (e) {
        console.error('Failed to parse entities:', e);
        return linkifyText(text);
    }
}
