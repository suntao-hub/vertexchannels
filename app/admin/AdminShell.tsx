"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const line = "#1E3A4C";

const NAV = [
  {
    href: "/admin",
    label: "Leads",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    href: "/admin/deals",
    label: "Deal Desk",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    href: "/admin/roadmap",
    label: "Roadmap",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
];

export default function AdminShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("vc_admin_nav") === "1"); } catch { /* */ }
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem("vc_admin_nav", next ? "1" : "0"); } catch { /* */ }
      return next;
    });
  }

  const w = collapsed ? 60 : 208;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB", fontFamily: "system-ui, sans-serif" }}>
      <aside
        style={{
          width: w, flexShrink: 0, background: navy, position: "sticky", top: 0,
          height: "100vh", alignSelf: "flex-start", display: "flex", flexDirection: "column",
          transition: ready ? "width .16s ease" : undefined,
        }}
      >
        <a
          href="/"
          style={{
            display: "flex", alignItems: "center", gap: 2, height: 56,
            padding: collapsed ? 0 : "0 18px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderBottom: `1px solid ${line}`, textDecoration: "none",
          }}
        >
          {collapsed ? (
            <span style={{ fontSize: 18, fontWeight: 900, color: orange }}>V</span>
          ) : (
            <>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Vertex</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: orange }}>Channels</span>
            </>
          )}
        </a>

        <nav style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map((item) => {
            const active = pathname === item.href
              || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
            return (
              <a
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: collapsed ? "10px 0" : "9px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 8, textDecoration: "none",
                  background: active ? "rgba(255,255,255,.12)" : "transparent",
                  color: active ? "#fff" : "#94A3B8",
                  fontSize: 13.5, fontWeight: active ? 700 : 500,
                }}
              >
                {item.icon}
                {!collapsed && item.label}
              </a>
            );
          })}
        </nav>

        <button
          onClick={toggle}
          title={collapsed ? "Expand menu" : "Collapse menu"}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: collapsed ? "12px 0" : "12px 16px",
            justifyContent: collapsed ? "center" : "flex-start",
            background: "none", border: "none", borderTop: `1px solid ${line}`,
            color: "#64748B", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 14 }}>{collapsed ? "»" : "«"}</span>
          {!collapsed && "Collapse"}
        </button>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: 56, flexShrink: 0, background: "#fff", borderBottom: `1px solid ${border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, color: navy }}>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{actions}</div>
        </header>
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
