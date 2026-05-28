interface PagePlaceholderProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
}

export function PagePlaceholder({
  title,
  description,
  icon,
}: PagePlaceholderProps) {
  return (
    <div className="flex h-full items-center justify-center px-4 py-16">
      <div className="text-center animate-spring-scale">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-foreground/40"
          style={{
            background: "var(--glass-card-bg)",
            backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
            WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
            border: "1px solid var(--glass-card-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {icon}
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-foreground/55">{description}</p>
        )}
        <span className="mt-6 inline-block rounded-full px-3 py-1 text-xs text-foreground/35"
          style={{
            background: "var(--glass-pill-bg)",
            border: "1px solid var(--glass-pill-border)",
          }}
        >
          即将上线
        </span>
      </div>
    </div>
  );
}
