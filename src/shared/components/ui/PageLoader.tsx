type PageLoaderProps = {
  message?: string;
  spinnerClassName?: string;
  containerClassName?: string;
  messageClassName?: string;
};

export function PageLoader({
  message = "Loading...",
  spinnerClassName = "h-12 w-12 border-b-2 border-indigo-600",
  containerClassName = "min-h-screen flex items-center justify-center bg-gray-50",
  messageClassName = "mt-4 text-gray-600",
}: PageLoaderProps) {
  return (
    <div className={containerClassName}>
      <div className="flex flex-col items-center">
        <div className={`animate-spin rounded-full ${spinnerClassName}`}></div>
        <p className={messageClassName}>{message}</p>
      </div>
    </div>
  );
}
