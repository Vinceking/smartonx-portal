export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 py-24">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-primary tracking-tight mb-4">{title}</h1>
        <p className="text-lg text-gray-600">
          This page is a placeholder and is currently under construction.
        </p>
      </div>
    </div>
  );
}
