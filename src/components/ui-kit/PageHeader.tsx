export function PageHeader({
  index,
  title,
  intro,
}: {
  index: string;
  title: string;
  intro: string;
}) {
  return (
    <header className="rise-in max-w-[720px]">
      <p className="micro-label text-accent">{index}</p>
      <h1 className="display-md mt-4">{title}</h1>
      <p className="mt-6 max-w-[600px] text-[17px] leading-relaxed text-muted-foreground">{intro}</p>
    </header>
  );
}
