type BrandMarkProps = {
  className?: string;
  tone?: "dark" | "light";
};

export function BrandMark({
  className = "h-11 w-11",
  tone = "dark",
}: BrandMarkProps) {
  const stroke = tone === "dark" ? "#0A1628" : "#FFFFFF";
  const teal = tone === "dark" ? "#0B7B8A" : "rgba(11, 123, 138, 0.9)";
  const green = tone === "dark" ? "#10B981" : "rgba(16, 185, 129, 0.9)";
  const soft = tone === "dark" ? "#E6F4F6" : "rgba(255, 255, 255, 0.92)";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="6" y="6" width="52" height="52" rx="18" fill={soft} />
      <rect x="12" y="12" width="40" height="40" rx="15" fill={teal} />
      <circle cx="44" cy="20" r="8" fill={green} />
      <path d="M24 24v16M32 24v16M20 32h16" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M38 40h10" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <path d="M43 35v10" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
