import  { useState } from "react";

export default function InventoryAssetsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Inventario de Activos</h1>
        <button className="btn-primary">
          Nuevo Registro
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          className="input flex-1"
          placeholder="Buscar activos en inventario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn">
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
