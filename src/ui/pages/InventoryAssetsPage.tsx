import  { useState } from "react";

export default function InventoryAssetsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Inventario de Activos</h1>
        <button className="btn-primary w-full sm:w-auto whitespace-nowrap">
          Nuevo Registro
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          className="input flex-1 min-w-0"
          placeholder="Buscar activos en inventario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn w-full sm:w-auto whitespace-nowrap">
          Filtrar
        </button>
      </div>

      {/* Content */}
      <div className="card">
        <div className="card-inner">
          <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold mb-2">Inventario de Activos</h3>
            <p className="text-sm">Esta página está en desarrollo. Aquí podrás gestionar el inventario de activos fijos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
