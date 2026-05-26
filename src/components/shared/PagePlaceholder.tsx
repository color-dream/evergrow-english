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
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground shadow-xs">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        <span className="mt-6 inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          即将上线
        </span>
      </div>
    </div>
  );
}
