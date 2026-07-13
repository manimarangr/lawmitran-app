export default function AdminPageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div>
        <h1 className="text-xl font-extrabold text-navy">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </header>
  );
}
