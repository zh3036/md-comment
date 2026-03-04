export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-neutral-500">Page not found</p>
      </div>
    </div>
  );
}
