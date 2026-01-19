import React from 'react';

interface LoginScreenProps {
    onLogin: () => void;
    isLoggingIn: boolean;
    loginLink: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoggingIn, loginLink }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 font-[family-name:var(--font-geist-sans)]">
            <h1 className="text-4xl font-bold mb-8">Welcome to Tabs-TG</h1>
            <div className="p-8 border border-gray-200 rounded-lg shadow-lg bg-white max-w-sm w-full text-center">
                <p className="mb-6 text-gray-600">Please log in securely via Telegram to view your private feed.</p>

                {!isLoggingIn ? (
                    <button
                        onClick={onLogin}
                        className="w-full bg-[#0088cc] text-white font-bold py-3 px-4 rounded-md hover:bg-[#0077b5] transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-1.05-2.4-1.66-1.06-.7-.37-1.09.23-1.72.15-.16 2.8-2.57 2.85-2.78.01-.03.01-.13-.06-.18-.07-.05-.19-.03-.27-.01-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.35-.49.96-.75 3.78-1.65 6.31-2.74 7.58-3.27 3.61-1.51 4.36-1.77 4.85-1.78.11 0 .35.03.5.16.13.11.16.26.17.37.01.11.01.22 0 .24z" />
                        </svg>
                        Login with Telegram
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0088cc]"></div>
                        <p className="text-sm text-gray-500">Waiting for confirmation...</p>
                        <p className="text-xs text-gray-400">Please click the "Start" button in the Telegram bot.</p>
                        {loginLink && (
                            <a href={loginLink} target="_blank" className="text-xs text-[#0088cc] underline mt-2" rel="noreferrer">
                                Click here if Telegram didn't open
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
