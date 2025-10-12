export const AccessDenied: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-7V6a3 3 0 00-6 0v3m0 0a2 2 0 002 2h6a2 2 0 002-2v-3m0 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v3z"
                />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
            </h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>
    </div>
);
