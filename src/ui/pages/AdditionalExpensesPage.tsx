import { useState } from "react";

export default function AdditionalExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Gastos Adicionales</h1>
        <button className="btn-primary w-full sm:w-auto whitespace-nowrap">
          Nuevo Gasto
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          className="input flex-1 min-w-0"
          placeholder="Buscar gastos adicionales..."
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
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Gastos Adicionales</h3>
            <p className="text-sm">Esta página está en desarrollo. Aquí podrás gestionar los gastos adicionales del centro de costos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
