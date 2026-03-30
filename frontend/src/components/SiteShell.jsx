const NAV_ITEMS = [
  { href: "/", label: "Customer" },
  { href: "/staff", label: "Staff" },
  { href: "/owner", label: "Owner" },
  { href: "/display", label: "Display" },
];

export default function SiteShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}) {
  const pathname = window.location.pathname;

  return (
    <div className="brand-shell">
      <header className="shell-header">
        <div className="brand-mark">
          <div className="brand-badge">QueueCraft</div>
          <nav className="brand-nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`nav-chip ${pathname === item.href ? "active" : ""}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hero-grid">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1 className="page-title">{title}</h1>
            {description ? <p className="page-copy">{description}</p> : null}
          </div>

          {actions ? <div className="hero-side">{actions}</div> : null}
        </div>
      </header>

      <main className="shell-content">{children}</main>
    </div>
  );
}
