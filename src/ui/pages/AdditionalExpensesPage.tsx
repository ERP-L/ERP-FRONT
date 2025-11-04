import React, { useState } from "react";

export default function AdditionalExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Gastos Adicionales</h1>
        <button className="btn-primary">
          Nuevo Gasto
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          className="input flex-1"
          placeholder="Buscar gastos adicionales..."
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
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Gastos Adicionales</h3>
            <p className="text-sm">Esta página está en desarrollo. Aquí podrás gestionar los gastos adicionales del centro de costos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
