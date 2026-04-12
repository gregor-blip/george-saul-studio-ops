interface PageStubProps {
  title: string;
  subtitle: string;
}

export function PageStub({ title, subtitle }: PageStubProps) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">{subtitle}</p>
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-sm text-muted-foreground">
        Coming soon
      </div>
    </div>
  );
}
