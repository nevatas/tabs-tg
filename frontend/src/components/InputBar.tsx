import React, { RefObject } from 'react';

interface InputBarProps {
    inputText: string;
    setInputText: (text: string) => void;
    selectedFiles: File[];
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
    previewUrls: string[];
    isSending: boolean;
    onSend: () => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    dropWrapperRef: RefObject<HTMLDivElement | null>;
    isWrapperOver: boolean;
    linkPreview: { title: string; description: string; image: string; site_name: string; url: string } | null;
    onRemovePreview: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
    inputText,
    setInputText,
    selectedFiles,
    onFileSelect,
    onRemoveFile,
    previewUrls,
    isSending,
    onSend,
    fileInputRef,
    textareaRef,
    dropWrapperRef,
    isWrapperOver,
    linkPreview,
    onRemovePreview
}) => {
    return (
        <div
            ref={dropWrapperRef}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-40 transition-transform duration-200 ${isWrapperOver ? 'scale-105' : 'scale-100'}`}
        >
            <div className={`bg-white p-2 rounded-2xl shadow-xl border ${isWrapperOver ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-200'} flex flex-col gap-2 text-gray-900 transition-all duration-300`}>

                {/* Link Preview Area */}
                {linkPreview && (
                    <div className="-mx-2 -mt-2 mb-2 p-2 bg-gray-50 rounded-t-2xl border-l-4 border-blue-500 relative flex gap-3">
                        {linkPreview.image && (
                            <div className="shrink-0">
                                <img
                                    src={linkPreview.image}
                                    alt="Preview"
                                    className="w-12 h-12 object-cover rounded-md"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="font-semibold text-blue-500 text-sm truncate">{linkPreview.site_name || 'Link Preview'}</div>
                            <div className="font-medium text-gray-900 text-sm truncate">{linkPreview.title}</div>
                            <div className="text-gray-500 text-xs truncate">{linkPreview.description}</div>
                        </div>
                        <button
                            onClick={onRemovePreview}
                            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 rounded-full p-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                )}

                {/* Attachment Preview Area */}
                {selectedFiles.length > 0 && (
                    <div className="px-2 pt-2 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="relative group shrink-0">
                                {file.type.startsWith('image/') || file.type.startsWith('video/') ? (
                                    <div className="relative inline-block">
                                        {/* Thumbnail */}
                                        {previewUrls[index] ? (
                                            file.type.startsWith('image/') ? (
                                                <img
                                                    src={previewUrls[index]}
                                                    alt="Preview"
                                                    className="h-16 w-16 object-cover rounded-xl border border-gray-200"
                                                />
                                            ) : (
                                                <video
                                                    src={previewUrls[index]}
                                                    className="h-16 w-16 object-cover rounded-xl border border-gray-200"
                                                    muted
                                                />
                                            )
                                        ) : (
                                            <div className="h-16 w-16 bg-gray-100 rounded-xl animate-pulse border border-gray-200" />
                                        )}
                                    </div>
                                ) : (
                                    /* File Card */
                                    <div className="relative inline-flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 pr-10 h-16 w-48">
                                        <div className="bg-blue-100 p-2 rounded-lg text-blue-500 shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-medium text-gray-900 truncate" title={file.name}>{file.name}</span>
                                            <span className="text-[10px] text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Remove Button (Global for item) */}
                                <button
                                    onClick={() => onRemoveFile(index)}
                                    className="absolute -top-2 -right-2 bg-white text-gray-500 rounded-full p-1 border border-gray-200 shadow-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors z-10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2 w-full">
                    {/* Attachment Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-xl hover:bg-gray-100 transition-colors ${selectedFiles.length > 0 ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Attach Media"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileSelect}
                        className="hidden"
                        multiple
                    /* Accept all files */
                    />

                    {/* Text Input */}
                    <div className="flex-1 py-2">
                        <textarea
                            ref={textareaRef}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSend();
                                }
                            }}
                            placeholder="Message..."
                            rows={1}
                            className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none resize-none overflow-y-auto text-base"
                            style={{ minHeight: '24px', maxHeight: '128px' }}
                        />
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={onSend}
                        disabled={(!inputText.trim() && selectedFiles.length === 0) || isSending}
                        className={`p-3 rounded-full transition-all ${(!inputText.trim() && selectedFiles.length === 0)
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md hover:shadow-lg transform active:scale-95'
                            }`}
                    >
                        {isSending ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
