import Link from 'next/link';

interface Crumb { label: string; href?: string; }

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-sm py-3">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
          {item.href
            ? <Link href={item.href} className="text-muted hover:text-primary transition-colors duration-150">{item.label}</Link>
            : <span className="text-dark-2 font-medium">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
