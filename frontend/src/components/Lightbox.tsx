import React, { useEffect } from 'react';
import { Post } from '../app/types';
import { getApiBaseUrl, renderFormattedText } from '../app/utils';

interface LightboxProps {
    selectedPost: Post | null;
    selectedMediaIndex: number;
    closeLightbox: () => void;
    handlePrev: () => void;
    handleNext: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
    selectedPost,
    selectedMediaIndex,
    closeLightbox,
    handlePrev,
    handleNext,
}) => {
    if (!selectedPost) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeLightbox}>
            <button
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                onClick={closeLightbox}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="relative w-full max-w-5xl h-[80vh] flex flex-col md:flex-row gap-4" onClick={e => e.stopPropagation()}>
                {/* Media Container */}
                <div className="flex-1 flex items-center justify-center relative bg-black/50 rounded-lg overflow-hidden">
                    {selectedPost.media[selectedMediaIndex]?.type === 'photo' ? (
                        <img
                            src={`${getApiBaseUrl()}${selectedPost.media[selectedMediaIndex].url}`}
                            alt="Lightbox media"
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <video
                            src={`${getApiBaseUrl()}${selectedPost.media[selectedMediaIndex].url}`}
                            className="max-w-full max-h-full"
                            controls
                            autoPlay
                        />
                    )}

                    {/* Navigation Buttons */}
                    {selectedPost.media.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all disabled:opacity-0"
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                disabled={selectedMediaIndex === 0}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all disabled:opacity-0"
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                disabled={selectedMediaIndex === selectedPost.media.length - 1}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </>
                    )}

                    {/* Counter */}
                    {selectedPost.media.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {selectedMediaIndex + 1} / {selectedPost.media.length}
                        </div>
                    )}
                </div>

                {/* Info Panel */}
                <div className="w-full md:w-80 bg-white rounded-lg p-6 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-sm text-gray-500">{new Date(selectedPost.created_at).toLocaleString()}</span>
                        {selectedPost.source_url && (
                            <a href={selectedPost.source_url} target="_blank" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-1.05-2.4-1.66-1.06-.7-.37-1.09.23-1.72.15-.16 2.8-2.57 2.85-2.78.01-.03.01-.13-.06-.18-.07-.05-.19-.03-.27-.01-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.35-.49.96-.75 3.78-1.65 6.31-2.74 7.58-3.27 3.61-1.51 4.36-1.77 4.85-1.78.11 0 .35.03.5.16.13.11.16.26.17.37.01.11.01.22 0 .24z" />
                                </svg>
                                Source
                            </a>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {selectedPost.content && <p className="whitespace-pre-wrap">{renderFormattedText(selectedPost.content, selectedPost.entities)}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
