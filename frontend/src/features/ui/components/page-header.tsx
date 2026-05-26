type PageHeaderProps = {
  title: string;
  description: string;
  /** Short uppercase tag shown above the title (e.g. "Doctor workspace"). */
  badge?: string;
};

/**
 * Page header shared by every role workspace. A teal accent rule + a clean
 * text block — no card chrome — sits directly on the page background. The
 * brand is already carried in the side rail, so it does not repeat here.
 */
export function PageHeader({ title, description, badge }: PageHeaderProps) {
  return (
    <header className="relative pl-5 sm:pl-6">
      <span
        aria-hidden
        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[linear-gradient(180deg,rgba(20,184,166,0.95),rgba(56,189,248,0.65))]"
      />
      {badge ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(178,238,231,0.92)]">
          {badge}
        </p>
      ) : null}
      <h1 className="mt-1.5 text-2xl font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[1.7rem]">
        {title}
      </h1>
      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-white/74">
        {description}
      </p>
    </header>
  );
}
