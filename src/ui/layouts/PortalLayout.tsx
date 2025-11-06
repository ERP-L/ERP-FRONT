import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppStore } from "../../app/store";
import { Home, Building2, Boxes, Package, Tags, ChevronDown, ChevronRight, Menu, X } from "lucide-react";

function SidebarLink({
  to,
  icon,
  children,
  onClick,
}: {
  to: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
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

function SidebarGroup({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius)] text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-all duration-200 w-full"
      >
        {icon ? <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span> : null}
        <span className="truncate flex-1 text-left">{title}</span>
        <span className="[&_svg]:h-4 [&_svg]:w-4">
          {isOpen ? <ChevronDown /> : <ChevronRight />}
        </span>
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {children}
        </div>
      )}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    setSession(null);
    nav("/login");
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className={`glass transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} hidden md:flex flex-shrink-0 m-2 md:m-4 overflow-hidden`}>
        <div className={`p-4 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'gap-2 h-full' : 'gap-4 h-full'} overflow-hidden`}>
            {/* Logo y botón colapsar */}
            <div className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {sidebarCollapsed ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center text-lg font-bold transition-all duration-300">
                    A
                  </div>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-1 rounded-[var(--radius)] hover:bg-[hsl(var(--accent))] transition-all duration-200 hover:scale-110"
                    title="Expandir menú"
                  >
                    <Menu className="h-4 w-4 transition-all duration-200" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center text-xl font-bold transition-all duration-300">
                      A
                    </div>
                    <div className="text-lg font-semibold text-[hsl(var(--foreground))] transition-all duration-300">ERP</div>
                  </div>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 rounded-[var(--radius)] hover:bg-[hsl(var(--accent))] transition-all duration-200 hover:scale-110"
                    title="Colapsar menú"
                  >
                    <X className="h-5 w-5 transition-all duration-200" />
                  </button>
                </>
              )}
            </div>

            {/* Menú */}
            {!sidebarCollapsed && (
              <nav className="space-y-1 flex-1 overflow-y-auto min-h-0 transition-all duration-300">
                <SidebarLink to="/app/home" icon={<Home />}>
                  Inicio
                </SidebarLink>

                <SidebarGroup title="Activos" icon={<Building2 />}>
                  <SidebarLink to="/app/branches" icon={<Building2 />}>Sucursales</SidebarLink>
                  <SidebarLink to="/app/warehouses" icon={<Boxes />}>Almacenes</SidebarLink>
                </SidebarGroup>

                <SidebarGroup title="Inventario" icon={<Package />}>
                  <SidebarLink to="/app/products" icon={<Package />}>Catálogo de Productos</SidebarLink>
                  <SidebarLink to="/app/categories" icon={<Tags />}>Catálogo de Categorías</SidebarLink>
                  <SidebarLink to="/app/inventory-products" icon={<Package />}>Inventario de Productos</SidebarLink>
                  <SidebarLink to="/app/inventory-assets" icon={<Building2 />}>Inventario de Activos</SidebarLink>
                </SidebarGroup>

                <SidebarGroup title="Centro de Costos" icon={<Tags />}>
                  <SidebarLink to="/app/purchase-orders-products" icon={<Package />}>Orden de Compra Productos</SidebarLink>
                  <SidebarLink to="/app/purchase-orders-assets" icon={<Building2 />}>Orden de Compra Activos</SidebarLink>
                  <SidebarLink to="/app/additional-expenses" icon={<Tags />}>Gastos Adicionales</SidebarLink>
                  <SidebarLink to="/app/expense-summary" icon={<Tags />}>Resumen de Gastos</SidebarLink>
                </SidebarGroup>
              </nav>
            )}

            {/* Perfil */}
            <div className={`mt-auto border-t border-[hsl(var(--border))] transition-all duration-300 ${sidebarCollapsed ? 'pt-2' : 'pt-3'}`}>
              {sidebarCollapsed ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] flex items-center justify-center text-xs font-semibold transition-all duration-300">
                    {session?.email?.[0]?.toUpperCase() || "D"}
                  </div>
                  <ProfileMenu onLogout={handleLogout} />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] flex items-center justify-center text-sm font-semibold transition-all duration-300">
                      {session?.email?.[0]?.toUpperCase() || "D"}
                    </div>
                    <div className="truncate text-sm text-[hsl(var(--muted-foreground))] transition-all duration-300">
                      {session?.email ?? "demo"}
                    </div>
                  </div>
                  <ProfileMenu onLogout={handleLogout} />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 m-2 md:m-4 min-w-0 overflow-hidden flex flex-col">
          {/* Mobile menu button */}
          <div className="md:hidden mb-4 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[var(--radius)] hover:bg-[hsl(var(--accent))] transition"
              aria-label="Menú"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-lg font-semibold text-[hsl(var(--foreground))]">ERP</div>
            <div className="w-10"></div>
          </div>
          
          {/* Mobile sidebar overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex overflow-hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
              <aside className="glass w-64 flex-shrink-0 m-2 relative z-10 overflow-hidden">
                <div className="p-4 flex flex-col gap-4 h-full overflow-hidden">
                  <div className="flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center text-xl font-bold">
                        A
                      </div>
                      <div className="text-lg font-semibold text-[hsl(var(--foreground))]">ERP</div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-[var(--radius)] hover:bg-[hsl(var(--accent))] transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <nav className="space-y-1 flex-1 overflow-y-auto min-h-0">
                    <SidebarLink to="/app/home" icon={<Home />} onClick={() => setMobileMenuOpen(false)}>
                      Inicio
                    </SidebarLink>
                    <SidebarGroup title="Activos" icon={<Building2 />}>
                      <SidebarLink to="/app/branches" icon={<Building2 />} onClick={() => setMobileMenuOpen(false)}>Sucursales</SidebarLink>
                      <SidebarLink to="/app/warehouses" icon={<Boxes />} onClick={() => setMobileMenuOpen(false)}>Almacenes</SidebarLink>
                    </SidebarGroup>
                    <SidebarGroup title="Inventario" icon={<Package />}>
                      <SidebarLink to="/app/products" icon={<Package />} onClick={() => setMobileMenuOpen(false)}>Catálogo de Productos</SidebarLink>
                      <SidebarLink to="/app/categories" icon={<Tags />} onClick={() => setMobileMenuOpen(false)}>Catálogo de Categorías</SidebarLink>
                      <SidebarLink to="/app/inventory-products" icon={<Package />} onClick={() => setMobileMenuOpen(false)}>Inventario de Productos</SidebarLink>
                      <SidebarLink to="/app/inventory-assets" icon={<Building2 />} onClick={() => setMobileMenuOpen(false)}>Inventario de Activos</SidebarLink>
                    </SidebarGroup>
                    <SidebarGroup title="Centro de Costos" icon={<Tags />}>
                      <SidebarLink to="/app/purchase-orders-products" icon={<Package />} onClick={() => setMobileMenuOpen(false)}>Orden de Compra Productos</SidebarLink>
                      <SidebarLink to="/app/purchase-orders-assets" icon={<Building2 />} onClick={() => setMobileMenuOpen(false)}>Orden de Compra Activos</SidebarLink>
                      <SidebarLink to="/app/additional-expenses" icon={<Tags />} onClick={() => setMobileMenuOpen(false)}>Gastos Adicionales</SidebarLink>
                      <SidebarLink to="/app/expense-summary" icon={<Tags />} onClick={() => setMobileMenuOpen(false)}>Resumen de Gastos</SidebarLink>
                    </SidebarGroup>
                  </nav>
                  <div className="mt-auto border-t border-[hsl(var(--border))] pt-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
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
                </div>
              </aside>
            </div>
          )}
          
          <div className="card card-inner flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </div>
        </main>
    </div>
  );
}
