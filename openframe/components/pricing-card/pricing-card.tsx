"use client";

type PricingCardProps = {
  planName: string;
  price: number;
  highlighted: boolean;
  features: string[];
  accentColor: string;
  ctaLabel: string;
  ctaVariant: "primary" | "secondary" | "ghost";
  badgeText: string;
};

export default function PricingCard({
  planName = "Pro",
  price = 29,
  highlighted = false,
  features = [],
  accentColor = "#6366f1",
  ctaLabel = "Get Started",
  ctaVariant = "primary",
  badgeText = "",
}: PricingCardProps) {
  const borderStyle = highlighted
    ? `2px solid ${accentColor}`
    : "1px solid rgba(0,0,0,0.1)";

  const ctaClasses: Record<string, string> = {
    primary: `background: ${accentColor}; color: white; border: none;`,
    secondary: `background: transparent; color: ${accentColor}; border: 2px solid ${accentColor};`,
    ghost: `background: transparent; color: ${accentColor}; border: none;`,
  };

  return (
    <div
      style={{
        border: borderStyle,
        borderRadius: 16,
        padding: "32px 28px",
        maxWidth: 360,
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        background: "white",
      }}
    >
      {highlighted && badgeText && (
        <span
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: accentColor,
            color: "white",
            padding: "4px 16px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {badgeText}
        </span>
      )}

      <h3
        style={{
          margin: "0 0 4px 0",
          fontSize: 18,
          fontWeight: 600,
          color: "#18181b",
        }}
      >
        {planName}
      </h3>

      <div style={{ margin: "8px 0 20px", display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 42, fontWeight: 700, color: "#18181b", lineHeight: 1 }}>
          ${price}
        </span>
        <span style={{ fontSize: 14, color: "#71717a" }}>/mo</span>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0" }}>
        {features.map((f, i) => (
          <li
            key={i}
            style={{
              padding: "6px 0",
              fontSize: 14,
              color: "#3f3f46",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: accentColor, fontSize: 16 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        // eslint-disable-next-line react/no-unknown-property
        style={{
          ...(Object.fromEntries(
            (ctaClasses[ctaVariant] ?? ctaClasses.primary)
              .split(";")
              .filter(Boolean)
              .map((s) => {
                const [k, v] = s.split(":").map((x) => x.trim());
                return [k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), v];
              }),
          ) as React.CSSProperties),
          width: "100%",
          padding: "12px 0",
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          transition: "opacity 0.15s",
        }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
