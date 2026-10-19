export default function Loader({ message = "Loading..." }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8">
      <span className="loading loading-spinner loading-lg text-primary" />
      {message && <p className="text-sm font-medium opacity-70 animate-pulse">{message}</p>}
    </div>
  );
}
