import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppStore } from "../../app/store";
import { Home, Building2, Boxes, Package, Tags } from "lucide-react";

function SidebarLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm border border-[hsl(var(--border))]"
            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
        }`
      }
      end
    >
      {icon ? <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-4 text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]/70">
      {children}
    </div>
  );
}

function ProfileMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de perfil"
        className="h-9 w-9 rounded-full border border-[hsl(var(--border))] bg-white/70 backdrop-blur flex items-center justify-center text-xl leading-none hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition"
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 bottom-11 w-48 rounded-xl border border-[hsl(var(--border))] bg-white/95 shadow-lg overflow-hidden"
        >
          <button
            role="menuitem"
            className="w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function PortalLayout() {
  const nav = useNavigate();
  const { session, setSession } = useAppStore();
  const handleLogout = () => {
    setSession(null);
    nav("/login");
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-screen-2xl px-6 py-8 grid grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="glass p-6 min-h-[90vh] flex flex-col gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center text-xl font-bold">
                A
              </div>
              <div className="text-lg font-semibold text-[hsl(var(--foreground))]">ERP</div>
            </div>

            {/* Menú */}
            <nav className="space-y-2 flex-1 overflow-y-auto">
              <SidebarLink to="/app/home" icon={<Home />}>Inicio</SidebarLink>

              <SectionTitle>Activos</SectionTitle>
              <div className="space-y-2">
                <SidebarLink to="/app/branches" icon={<Building2 />}>Sucursales</SidebarLink>
                <SidebarLink to="/app/warehouses" icon={<Boxes />}>Almacenes</SidebarLink>
              </div>

              <SectionTitle>Inventario</SectionTitle>
              <div className="space-y-2">
                <SidebarLink to="/app/products" icon={<Package />}>Productos</SidebarLink>
                <SidebarLink to="/app/categories" icon={<Tags />}>Categorías</SidebarLink>
              </div>
            </nav>

            {/* Perfil */}
            <div className="mt-auto border-t border-[hsl(var(--border))] pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] flex items-center justify-center text-sm font-semibold">
                  {session?.email?.[0]?.toUpperCase() || "D"}
                </div>
                <div className="truncate text-sm text-[hsl(var(--muted-foreground))]">
                  {session?.email ?? "demo"}
                </div>
              </div>
              <ProfileMenu onLogout={handleLogout} />
            </div>
          </div>
        </aside>

        {/* Content */}
        <section className="col-span-12 md:col-span-9 lg:col-span-10">
          <div className="card card-inner min-h-[90vh]">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}
