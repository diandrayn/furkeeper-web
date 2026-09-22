export default function AuthCard({ children, className = '' }) {
  return (
    <div
      className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
