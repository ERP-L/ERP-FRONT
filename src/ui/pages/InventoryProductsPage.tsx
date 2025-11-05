import React, { useMemo, useState } from "react";

type ProductType = "lote" | "serie" | "ninguno";

type Product = {
  id: string;
  name: string;
  type: ProductType;
  averageCost: number;
  quantity: number;
  shelves: string[]; // estanterías disponibles para el producto
  batches?: Array<{ id: string; name: string; qty: number; purchaseDate: string; expiryDate: string; shelf: string }>;
  series?: Array<{ id: string; name: string; shelf: string }>;
};

type PurchaseNotification = {
  id: string;
  orderName: string;
  buyer: string;
  productName: string;
  productId: string;
  qty: number;
  date: string;
  totalAmount: number;
  purchaseDate: string;
  expiryDate: string | null;
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
      {children}
    </span>
  );
}

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh]">
        <div className="card">
          <div className="card-inner flex flex-col h-[80vh] max-h-[90vh] sm:max-h-[600px] overflow-hidden">
            <div className="flex items-start justify-between mb-4 flex-shrink-0">
              <h3 className="text-xl font-semibold">{title}</h3>
              <button className="btn" onClick={onClose} aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {children}
            </div>
            {footer && (
              <div className="flex-shrink-0 pt-4 border-t border-[hsl(var(--border))] mt-4">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryProductsPage() {
  // Data mock
  const branches = [
    { id: "b1", name: "Sucursal Centro" },
    { id: "b2", name: "Sucursal Norte" },
  ];
  const warehousesByBranch: Record<string, Array<{ id: string; name: string }>> = {
    b1: [
      { id: "w1", name: "Almacén A" },
      { id: "w2", name: "Almacén B" },
    ],
    b2: [
      { id: "w3", name: "Depósito 1" },
    ],
  };

  const productsMock: Product[] = [
    {
      id: "p1",
      name: "Laptop Pro 14",
      type: "serie",
      averageCost: 1200,
      quantity: 5,
      shelves: ["S-1", "S-2"],
      series: [
        { id: "s1", name: "SN-001", shelf: "S-1" },
        { id: "s2", name: "SN-002", shelf: "S-1" },
      ],
    },
    {
      id: "p2",
      name: "Paracetamol 500mg",
      type: "lote",
      averageCost: 1.2,
      quantity: 240,
      shelves: ["A-1", "A-2", "A-3"],
      batches: [
        { id: "l1", name: "L-2025-01", qty: 120, purchaseDate: "2025-01-15", expiryDate: "2026-01-15", shelf: "A-1" },
        { id: "l2", name: "L-2025-05", qty: 120, purchaseDate: "2025-05-10", expiryDate: "2026-05-10", shelf: "A-2" },
      ],
    },
    {
      id: "p3",
      name: "Café en grano 1kg",
      type: "ninguno",
      averageCost: 8.5,
      quantity: 36,
      shelves: ["G-1"],
    },
  ];

  const notificationsMock: PurchaseNotification[] = [
    { id: "n1", orderName: "OC-10023", buyer: "Compras Central", productName: "Paracetamol 500mg", productId: "p2", qty: 60, date: "2025-10-21", totalAmount: 72, purchaseDate: "2025-10-21", expiryDate: "2026-10-21" },
    { id: "n2", orderName: "OC-10024", buyer: "Compras Norte", productName: "Laptop Pro 14", productId: "p1", qty: 2, date: "2025-10-22", totalAmount: 2400, purchaseDate: "2025-10-22", expiryDate: null },
  ];

  // Mock data para órdenes de venta
  const saleOrdersMock = [
    { id: "so1", orderName: "OV-001", productName: "Paracetamol 500mg", productId: "p2", qty: 30, totalAmount: 36 },
    { id: "so2", orderName: "OV-002", productName: "Laptop Pro 14", productId: "p1", qty: 1, totalAmount: 1200 },
  ];

  // Mock data para movimientos
  const movementsMock = [
    { id: "m1", type: "agregar", productName: "Paracetamol 500mg", quantity: 60, date: "2025-01-15", user: "Juan Pérez", orderRef: "OC-10023" },
    { id: "m2", type: "quitar", productName: "Laptop Pro 14", quantity: 1, date: "2025-01-14", user: "María García", orderRef: "OV-001" },
    { id: "m3", type: "transferir", productName: "Café en grano 1kg", quantity: 10, date: "2025-01-13", user: "Carlos López", destination: "Sucursal Norte" },
    { id: "m4", type: "ajustar", productName: "Paracetamol 500mg", quantity: -5, date: "2025-01-12", user: "Ana Martínez", reason: "Ajuste de inventario" },
    { id: "m5", type: "agregar", productName: "Laptop Pro 14", quantity: 2, date: "2025-01-11", user: "Juan Pérez", orderRef: "OC-10024" },
  ];

  // Estado UI
  const [activeBranchId, setActiveBranchId] = useState<string>(branches[0]?.id ?? "");
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(warehousesByBranch[branches[0]?.id ?? ""]?.[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<"productos" | "movimientos">("productos");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal detalle de producto
  const [openProductId, setOpenProductId] = useState<string | null>(null);

  // Modales de movimientos
  const [movementType, setMovementType] = useState<null | "agregar" | "quitar" | "transferir" | "ajustar">(null);

  // Selecciones para formularios
  const [selectedProductIdForMovement, setSelectedProductIdForMovement] = useState<string>("");
  const [productSearchTerm, setProductSearchTerm] = useState<string>("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState<boolean>(false);

  // Estado formulario AGREGAR
  const [purchaseOrderRef, setPurchaseOrderRef] = useState<string>("");
  const [purchaseDateTop, setPurchaseDateTop] = useState<string>("");
  const [purchaseGeneralExpiry, setPurchaseGeneralExpiry] = useState<string>("");
  const [batchTotalQty, setBatchTotalQty] = useState<number | "">("");
  const [seriesTotalQty, setSeriesTotalQty] = useState<number | "">("");

  // Lote
  const [batchRows, setBatchRows] = useState<Array<{ name: string; qty: number | ""; expiryDate: string; purchaseDate: string; shelf: string }>>([]);

  // Serie
  const [seriesRows, setSeriesRows] = useState<Array<{ name: string; shelf: string }>>([]);

  // Ninguno
  const [simpleQty, setSimpleQty] = useState<number | "">("");
  const [simpleShelf, setSimpleShelf] = useState<string>("");

  // Monto y motivo (al final del modal agregar)
  const [purchaseTotal, setPurchaseTotal] = useState<number | "">("");
  const [movementReason, setMovementReason] = useState<string>("");

  // Estado formulario QUITAR
  const [saleOrderRef, setSaleOrderRef] = useState<string>("");
  const [saleTotal, setSaleTotal] = useState<number | "">("");
  const [removeBatchRows, setRemoveBatchRows] = useState<Array<{ batchId: string; qty: number | "" }>>([]);
  const [removeSelectedSeries, setRemoveSelectedSeries] = useState<string[]>([]);
  const [removeSeriesSearchTerm, setRemoveSeriesSearchTerm] = useState<string>("");
  const [removeSimpleQty, setRemoveSimpleQty] = useState<number | "">("");
  const [removeReason, setRemoveReason] = useState<string>("");

  // Estado formulario TRANSFERIR
  const [transferDestinationBranch, setTransferDestinationBranch] = useState<string>("");
  const [transferDestinationWarehouse, setTransferDestinationWarehouse] = useState<string>("");
  const [transferBatchRows, setTransferBatchRows] = useState<Array<{ batchId: string; qty: number | ""; shelf: string }>>([]);
  const [transferSeriesRows, setTransferSeriesRows] = useState<Array<{ seriesId: string; shelf: string }>>([]);
  const [transferSimpleQty, setTransferSimpleQty] = useState<number | "">("");
  const [transferSimpleShelf, setTransferSimpleShelf] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");

  // Estado formulario AJUSTAR
  const [adjustBatchRows, setAdjustBatchRows] = useState<Array<{ batchId: string; qty: number | ""; shelf: string }>>([]);
  const [adjustSeriesRows, setAdjustSeriesRows] = useState<Array<{ seriesId: string; shelf: string }>>([]);
  const [adjustSimpleQty, setAdjustSimpleQty] = useState<number | "">("");
  const [adjustSimpleShelf, setAdjustSimpleShelf] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");

  function resetAddForm() {
    setPurchaseOrderRef("");
    setPurchaseDateTop("");
    setPurchaseGeneralExpiry("");
    setBatchRows([]);
    setBatchTotalQty("");
    setSeriesTotalQty("");
    setSeriesRows([]);
    setSimpleQty("");
    setSimpleShelf("");
    setPurchaseTotal("");
    setMovementReason("");
    setProductSearchTerm("");
    setIsProductDropdownOpen(false);
  }

  function resetRemoveForm() {
    setSaleOrderRef("");
    setSaleTotal("");
    setRemoveBatchRows([]);
    setRemoveSelectedSeries([]);
    setRemoveSeriesSearchTerm("");
    setRemoveSimpleQty("");
    setRemoveReason("");
    setProductSearchTerm("");
    setIsProductDropdownOpen(false);
  }

  function resetTransferForm() {
    setTransferDestinationBranch("");
    setTransferDestinationWarehouse("");
    setTransferBatchRows([]);
    setTransferSeriesRows([]);
    setTransferSimpleQty("");
    setTransferSimpleShelf("");
    setTransferReason("");
    setProductSearchTerm("");
    setIsProductDropdownOpen(false);
  }

  function resetAdjustForm() {
    setAdjustBatchRows([]);
    setAdjustSeriesRows([]);
    setAdjustSimpleQty("");
    setAdjustSimpleShelf("");
    setAdjustReason("");
    setProductSearchTerm("");
    setIsProductDropdownOpen(false);
  }

  const products = useMemo(() => {
    // En esta versión mock no filtramos por sucursal/almacén; se podría filtrar aquí
    return productsMock.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const filteredProductsForSelection = useMemo(() => {
    if (!productSearchTerm || productSearchTerm.trim() === "") {
      return productsMock;
    }
    return productsMock.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSearchTerm]);

  const selectedProduct = useMemo(() => productsMock.find(p => p.id === selectedProductIdForMovement) ?? null, [selectedProductIdForMovement]); // eslint-disable-line react-hooks/exhaustive-deps
  const openProduct = useMemo(() => productsMock.find(p => p.id === openProductId) ?? null, [openProductId]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentWarehouses = warehousesByBranch[activeBranchId] ?? [];

  function formatCurrency(n: number) {
    try {
      return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);
    } catch {
      return `S/ ${n.toFixed(2)}`;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con selects */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Inventario de Productos</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            className="input w-full sm:w-auto"
            value={activeBranchId}
            onChange={(e) => {
              const newBranchId = e.target.value;
              setActiveBranchId(newBranchId);
              const firstWh = warehousesByBranch[newBranchId]?.[0]?.id ?? "";
              setActiveWarehouseId(firstWh);
            }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            className="input w-full sm:w-auto"
            value={activeWarehouseId}
            onChange={(e) => setActiveWarehouseId(e.target.value)}
          >
            {currentWarehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[hsl(var(--border))]">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "productos" ? "text-[hsl(var(--foreground))] border-b-2 border-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`}
          onClick={() => setActiveTab("productos")}
        >
          Productos
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "movimientos" ? "text-[hsl(var(--foreground))] border-b-2 border-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`}
          onClick={() => setActiveTab("movimientos")}
        >
          Movimientos
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          className="input flex-1 min-w-0"
          placeholder="Buscar productos en inventario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn w-full sm:w-auto whitespace-nowrap">
          Filtrar
        </button>
      </div>

      {activeTab === "productos" ? (
        <div className="space-y-4">
          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <button key={p.id} className="card text-left" onClick={() => setOpenProductId(p.id)}>
                <div className="card-inner space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-[hsl(var(--foreground))]">{p.name}</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">Costo promedio: {formatCurrency(p.averageCost)}</div>
                    </div>
                    <Tag>
                      {p.type === "lote" ? "Lote" : p.type === "serie" ? "Serie" : "Sin etiqueta"}
                    </Tag>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-[hsl(var(--muted-foreground))]">Cantidad</div>
                    <div className="font-medium">{p.quantity}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-[hsl(var(--muted-foreground))]">Estanterías</div>
                    <div className="font-medium">{p.shelves.join(", ")}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Modal de detalle de producto */}
          <Modal open={!!openProduct} onClose={() => setOpenProductId(null)} title={openProduct ? openProduct.name : ""}>
            {openProduct && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">Costo promedio</div>
                    <div className="font-medium">{formatCurrency(openProduct.averageCost)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">Cantidad total</div>
                    <div className="font-medium">{openProduct.quantity}</div>
                  </div>
                </div>

                {openProduct.type === "lote" && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Lotes</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {(openProduct.batches ?? []).map((l) => (
                        <div key={l.id} className="card">
                          <div className="card-inner space-y-1">
                            <div className="font-medium">{l.name}</div>
                            <div className="text-sm text-[hsl(var(--muted-foreground))]">Cantidad: {l.qty}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">Compra: {l.purchaseDate}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">Vence: {l.expiryDate}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">Estantería: {l.shelf}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {openProduct.type === "serie" && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Series</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {(openProduct.series ?? []).map((s) => (
                        <div key={s.id} className="card">
                          <div className="card-inner space-y-1">
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">Estantería: {s.shelf}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Main movimientos */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button className="btn-primary flex items-center justify-center gap-2" onClick={() => setMovementType("agregar")}> 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Agregar
              </button>
              <button className="btn flex items-center justify-center gap-2" onClick={() => setMovementType("quitar")}> 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Quitar
              </button>
              <button className="btn flex items-center justify-center gap-2" onClick={() => setMovementType("transferir")}> 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 8 16 13"></polyline><line x1="21" y1="8" x2="3" y2="8"></line><polyline points="8 21 3 16 8 11"></polyline><line x1="21" y1="16" x2="3" y2="16"></line></svg>
                Transferir
              </button>
              <button className="btn flex items-center justify-center gap-2" onClick={() => setMovementType("ajustar")}> 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .36.12.7.33.98"></path></svg>
                Ajustar
              </button>
            </div>

            {/* Tabla de movimientos */}
            <div className="card mt-4">
              <div className="card-inner">
                <div className="text-sm font-semibold mb-4">Movimientos recientes</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Tipo</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Producto</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Cantidad</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Fecha</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Usuario</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">Referencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {movementsMock.map((movement) => (
                        <tr key={movement.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                          <td className="px-3 py-2 border-r border-[hsl(var(--border))]">
                            <Tag>
                              {movement.type === "agregar" ? "Agregar" : 
                               movement.type === "quitar" ? "Quitar" :
                               movement.type === "transferir" ? "Transferir" : "Ajustar"}
                            </Tag>
                          </td>
                          <td className="px-3 py-2 border-r border-[hsl(var(--border))]">{movement.productName}</td>
                          <td className={`px-3 py-2 border-r border-[hsl(var(--border))] font-medium ${movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                          </td>
                          <td className="px-3 py-2 border-r border-[hsl(var(--border))]">{movement.date}</td>
                          <td className="px-3 py-2 border-r border-[hsl(var(--border))]">{movement.user}</td>
                          <td className="px-3 py-2">
                            {movement.orderRef || movement.destination || movement.reason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal movimiento */}
            <Modal 
              open={movementType !== null} 
              onClose={() => { 
                setMovementType(null); 
                resetAddForm(); 
                resetRemoveForm(); 
                resetTransferForm(); 
                resetAdjustForm(); 
                setSelectedProductIdForMovement(""); 
              }} 
              title={movementType ? movementType[0].toUpperCase() + movementType.slice(1) + " stock" : ""}
              footer={
                <div className="flex justify-end gap-2">
                  <button
                    className="btn"
                    onClick={() => {
                      setMovementType(null);
                      if (movementType === "agregar") resetAddForm();
                      if (movementType === "quitar") resetRemoveForm();
                      if (movementType === "transferir") resetTransferForm();
                      if (movementType === "ajustar") resetAdjustForm();
                      setSelectedProductIdForMovement("");
                    }}
                  >
                    Cancelar
                  </button>
                  <button className="btn-primary">Guardar</button>
                </div>
              }
            >
              <div className="space-y-4">
                {movementType === "agregar" && (
                  <div className="space-y-6">
                    {/* Sección 1: Detalles de compra */}
                    <div className="space-y-4">
                      <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Detalles de compra</div>
                      
                      {/* Fila 1: Orden de compra + Monto de compra */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Orden de compra</div>
                          <select
                            className="input"
                            value={purchaseOrderRef}
                            onChange={(e) => {
                              const orderName = e.target.value;
                              setPurchaseOrderRef(orderName);
                              if (orderName) {
                                const selectedOrder = notificationsMock.find(n => n.orderName === orderName);
                                if (selectedOrder) {
                                  setSelectedProductIdForMovement(selectedOrder.productId);
                                  setProductSearchTerm(selectedOrder.productName);
                                  setPurchaseTotal(selectedOrder.totalAmount);
                                  setPurchaseDateTop(selectedOrder.purchaseDate);
                                  setPurchaseGeneralExpiry(selectedOrder.expiryDate || "");
                                  setBatchRows([]);
                                  setSeriesRows([]);
                                  setBatchTotalQty("");
                                  setSeriesTotalQty("");
                                  setSimpleQty("");
                                  setSimpleShelf("");
                                }
                              } else {
                                setPurchaseDateTop("");
                                setPurchaseTotal("");
                                setPurchaseGeneralExpiry("");
                              }
                            }}
                          >
                            <option value="">Selecciona orden</option>
                            {notificationsMock.map(n => (
                              <option key={n.id} value={n.orderName}>{n.orderName}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Monto de la compra</div>
                          <input
                            className="input"
                            placeholder="0.00"
                            type="number"
                            value={purchaseTotal}
                            onChange={(e) => setPurchaseTotal(e.target.value === "" ? "" : Number(e.target.value))}
                          />
                        </div>
                      </div>

                      {/* Fila 2: Producto con dropdown filtrable */}
                      <div className="space-y-1">
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Producto</div>
                        <div className="relative">
                          <div className="flex items-center">
                            <input
                              className="input w-full pr-8"
                              placeholder="Escribe para filtrar o selecciona"
                              value={productSearchTerm}
                              onChange={(e) => {
                                setProductSearchTerm(e.target.value);
                                setIsProductDropdownOpen(true);
                                if (e.target.value === "") {
                                  setSelectedProductIdForMovement("");
                                }
                              }}
                              onFocus={() => {
                                setIsProductDropdownOpen(true);
                                if (!selectedProductIdForMovement) {
                                  setProductSearchTerm("");
                                }
                              }}
                              onBlur={() => {
                                // Delay para permitir el click en el dropdown
                                setTimeout(() => setIsProductDropdownOpen(false), 200);
                              }}
                            />
                            <svg 
                              className="absolute right-2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none"
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {isProductDropdownOpen && filteredProductsForSelection.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg max-h-48 overflow-y-auto">
                              {filteredProductsForSelection.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--muted))] text-sm transition-colors"
                                  onClick={() => {
                                    setSelectedProductIdForMovement(p.id);
                                    setProductSearchTerm(p.name);
                                    setIsProductDropdownOpen(false);
                                    setBatchRows([]);
                                    setSeriesRows([]);
                                    setBatchTotalQty("");
                                    setSeriesTotalQty("");
                                    setSimpleQty("");
                                    setSimpleShelf("");
                                  }}
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          )}
                          {isProductDropdownOpen && filteredProductsForSelection.length === 0 && productSearchTerm.trim() !== "" && (
                            <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg">
                              <div className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                                No se encontraron productos
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedProductIdForMovement && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            Seleccionado: {selectedProduct?.name}
                          </div>
                        )}
                      </div>

                      {/* Fila 3: Fecha de compra + Fecha de caducidad */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Fecha de compra</div>
                          <input
                            className="input"
                            type="date"
                            value={purchaseDateTop}
                            onChange={(e) => setPurchaseDateTop(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Fecha de caducidad</div>
                          <input
                            className="input"
                            type="date"
                            value={purchaseGeneralExpiry}
                            onChange={(e) => setPurchaseGeneralExpiry(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 2: Detalles del producto */}
                    {selectedProduct && (
                      <div className="space-y-4">
                        <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Detalles del producto</div>
                        
                        {selectedProduct.type === "lote" && (
                          <div className="space-y-3">
                            {/* Cantidad total */}
                            <div className="space-y-1">
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">Cantidad total</div>
                              <input
                                className="input"
                                type="number"
                                placeholder="0"
                                value={batchTotalQty}
                                onChange={(e) => setBatchTotalQty(e.target.value === "" ? "" : Number(e.target.value))}
                              />
                            </div>
                            
                            {/* Tabla simple tipo excel */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Lotes</div>
                                <button
                                  className="btn text-xs"
                                  onClick={() => {
                                    setBatchRows((prev) => [
                                      ...prev,
                                      {
                                        name: "",
                                        qty: "",
                                        expiryDate: purchaseGeneralExpiry,
                                        purchaseDate: purchaseDateTop,
                                        shelf: selectedProduct.shelves[0] ?? "",
                                      },
                                    ]);
                                  }}
                                >
                                  + Agregar fila
                                </button>
                              </div>
                              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80">
                                      <tr>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Nombre lote</th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Cantidad</th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">F. compra</th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">F. caducidad</th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Estantería</th>
                                        <th className="px-3 py-2.5 text-center font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">Acción</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[hsl(var(--border))]">
                                      {batchRows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                                          <td className="p-0 border-r border-[hsl(var(--border))]">
                                            <input
                                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                              placeholder="Nombre"
                                              value={row.name}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                setBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, name: v } : r));
                                              }}
                                            />
                                          </td>
                                          <td className="p-0 border-r border-[hsl(var(--border))]">
                                            <input
                                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                              placeholder="0"
                                              type="number"
                                              value={row.qty}
                                              onChange={(e) => {
                                                const v = e.target.value === "" ? "" : Number(e.target.value);
                                                setBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, qty: v } : r));
                                              }}
                                            />
                                          </td>
                                          <td className="p-0 border-r border-[hsl(var(--border))]">
                                            <input
                                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                              type="date"
                                              value={row.purchaseDate}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                setBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, purchaseDate: v } : r));
                                              }}
                                            />
                                          </td>
                                          <td className="p-0 border-r border-[hsl(var(--border))]">
                                            <input
                                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                              type="date"
                                              value={row.expiryDate}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                setBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, expiryDate: v } : r));
                                              }}
                                            />
                                          </td>
                                          <td className="p-0 border-r border-[hsl(var(--border))]">
                                            <select
                                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                              value={row.shelf}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                setBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, shelf: v } : r));
                                              }}
                                            >
                                              {selectedProduct.shelves.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                          </td>
                                          <td className="p-0">
                                            <button
                                              type="button"
                                              className="w-full py-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium transition-colors rounded"
                                              onClick={() => setBatchRows((prev) => prev.filter((_, i) => i !== idx))}
                                            >
                                              Eliminar
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedProduct.type === "serie" && (
                          <div className="space-y-3">
                            {/* Cantidad total */}
                            <div className="space-y-1">
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">Cantidad total</div>
                              <input
                                className="input"
                                type="number"
                                placeholder="0"
                                value={seriesTotalQty}
                                onChange={(e) => {
                                  const v = e.target.value === "" ? "" : Number(e.target.value);
                                  setSeriesTotalQty(v);
                                  const n = typeof v === "number" ? v : 0;
                                  setSeriesRows((prev) => {
                                    const next = [...prev];
                                    if (n > next.length) {
                                      for (let i = next.length; i < n; i++) {
                                        next.push({ name: "", shelf: selectedProduct.shelves[0] ?? "" });
                                      }
                                    } else if (n < next.length) {
                                      next.length = n;
                                    }
                                    return next;
                                  });
                                }}
                              />
                            </div>
                            
                            {/* Tabla simple tipo excel */}
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Series</div>
                              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80">
                                      <tr>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Nombre de la serie</th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Estantería</th>
                                        <th className="px-3 py-2.5 text-center font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">Acción</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[hsl(var(--border))]">
                                      {seriesRows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                                          <td className="p-0 border-r border-[hsl(var(--border))]">
                                            <input
                                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                              placeholder={`Serie #${idx + 1}`}
                                              value={row.name}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                setSeriesRows((prev) => {
                                                  const next = prev.map((r, i) => i === idx ? { ...r, name: v } : r);
                                                  if (v) {
                                                    for (let j = idx + 1; j < next.length; j++) {
                                                      if (!next[j].name) next[j].name = v;
                                                    }
                                                  }
                                                  return [...next];
                                                });
                                              }}
                                            />
                                          </td>
                                          <td className="p-0 border-r border-[hsl(var(--border))]">
                                            <select
                                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                              value={row.shelf}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                setSeriesRows((prev) => {
                                                  const next = prev.map((r, i) => i === idx ? { ...r, shelf: v } : r);
                                                  for (let j = idx + 1; j < next.length; j++) {
                                                    if (!next[j].shelf) next[j].shelf = v;
                                                  }
                                                  return [...next];
                                                });
                                              }}
                                            >
                                              {selectedProduct.shelves.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                          </td>
                                          <td className="p-0">
                                            <button
                                              type="button"
                                              className="w-full py-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium transition-colors rounded"
                                              onClick={() => {
                                                setSeriesRows((prev) => {
                                                  const filtered = prev.filter((_, i) => i !== idx);
                                                  setSeriesTotalQty(filtered.length);
                                                  return filtered;
                                                });
                                              }}
                                            >
                                              Eliminar
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedProduct.type === "ninguno" && (
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">Cantidad total</div>
                              <input
                                className="input"
                                type="number"
                                placeholder="0"
                                value={simpleQty}
                                onChange={(e) => setSimpleQty(e.target.value === "" ? "" : Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">Estantería</div>
                              <select
                                className="input"
                                value={simpleShelf}
                                onChange={(e) => setSimpleShelf(e.target.value)}
                              >
                                <option value="">Selecciona estantería</option>
                                {selectedProduct.shelves.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sección 3: Motivo */}
                    <div className="space-y-4">
                      <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Información adicional</div>
                      <div className="space-y-1">
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Motivo</div>
                        <input
                          className="input"
                          placeholder="Describe el motivo"
                          value={movementReason}
                          onChange={(e) => setMovementReason(e.target.value)}
                        />
                      </div>
                    </div>

                  </div>
                )}

                {movementType === "quitar" && (
                  <div className="space-y-6">
                    {/* Sección 1: Detalle de venta */}
                    <div className="space-y-4">
                      <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Detalle de venta</div>
                      
                      {/* Fila 1: Orden de venta + Monto de venta */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Orden de venta (opcional)</div>
                          <select
                            className="input"
                            value={saleOrderRef}
                            onChange={(e) => {
                              const orderName = e.target.value;
                              setSaleOrderRef(orderName);
                              if (orderName) {
                                const selectedOrder = saleOrdersMock.find(so => so.orderName === orderName);
                                if (selectedOrder) {
                                  setSelectedProductIdForMovement(selectedOrder.productId);
                                  setProductSearchTerm(selectedOrder.productName);
                                  setSaleTotal(selectedOrder.totalAmount);
                                  setRemoveBatchRows([]);
                                  setRemoveSelectedSeries([]);
                                  setRemoveSimpleQty("");
                                }
                              } else {
                                setSaleTotal("");
                              }
                            }}
                          >
                            <option value="">Selecciona orden o deja en blanco</option>
                            {saleOrdersMock.map(so => (
                              <option key={so.id} value={so.orderName}>{so.orderName}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Monto de la venta</div>
                          <input
                            className="input"
                            placeholder="0.00"
                            type="number"
                            value={saleTotal}
                            onChange={(e) => setSaleTotal(e.target.value === "" ? "" : Number(e.target.value))}
                          />
                        </div>
                      </div>

                      {/* Fila 2: Producto con dropdown filtrable */}
                      <div className="space-y-1">
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Producto</div>
                        <div className="relative">
                          <div className="flex items-center">
                            <input
                              className="input w-full pr-8"
                              placeholder="Escribe para filtrar o selecciona"
                              value={productSearchTerm}
                              onChange={(e) => {
                                setProductSearchTerm(e.target.value);
                                setIsProductDropdownOpen(true);
                                if (e.target.value === "") {
                                  setSelectedProductIdForMovement("");
                                }
                              }}
                              onFocus={() => {
                                setIsProductDropdownOpen(true);
                                if (!selectedProductIdForMovement) {
                                  setProductSearchTerm("");
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => setIsProductDropdownOpen(false), 200);
                              }}
                            />
                            <svg 
                              className="absolute right-2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none"
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {isProductDropdownOpen && filteredProductsForSelection.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg max-h-48 overflow-y-auto">
                              {filteredProductsForSelection.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--muted))] text-sm transition-colors"
                                  onClick={() => {
                                    setSelectedProductIdForMovement(p.id);
                                    setProductSearchTerm(p.name);
                                    setIsProductDropdownOpen(false);
                                    setRemoveBatchRows([]);
                                    setRemoveSelectedSeries([]);
                                    setRemoveSimpleQty("");
                                  }}
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          )}
                          {isProductDropdownOpen && filteredProductsForSelection.length === 0 && productSearchTerm.trim() !== "" && (
                            <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg">
                              <div className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                                No se encontraron productos
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedProductIdForMovement && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            Seleccionado: {selectedProduct?.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sección 2: Detalles del producto */}
                    {selectedProduct && (
                      <div className="space-y-4">
                        <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Detalles del producto</div>
                        
                        {selectedProduct.type === "lote" && (() => {
                          const availableBatches = (selectedProduct.batches ?? []).map(b => ({ id: b.id, key: `${b.id}-${b.shelf}` }));
                          const maxRows = availableBatches.length;
                          
                          return (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Lotes a quitar</div>
                                  {removeBatchRows.length < maxRows && (
                                    <button
                                      className="btn text-xs"
                                      onClick={() => {
                                        setRemoveBatchRows((prev) => [
                                          ...prev,
                                          { batchId: "", qty: "" },
                                        ]);
                                      }}
                                    >
                                      + Agregar fila
                                    </button>
                                  )}
                                </div>
                                <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden shadow-sm">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80">
                                        <tr>
                                          <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Lote</th>
                                          <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Cantidad</th>
                                          <th className="px-3 py-2.5 text-center font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">Acción</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[hsl(var(--border))]">
                                        {removeBatchRows.map((row, idx) => {
                                          const otherUsedKeys = removeBatchRows
                                            .filter((_, i) => i !== idx)
                                            .map(r => {
                                              const batch = availableBatches.find(b => b.id === r.batchId);
                                              return batch ? batch.key : null;
                                            })
                                            .filter(Boolean);
                                          const selectableBatches = availableBatches.filter(b => 
                                            !otherUsedKeys.includes(b.key) || b.id === row.batchId
                                          );
                                          
                                          return (
                                            <tr key={idx} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                                              <td className="p-0 border-r border-[hsl(var(--border))]">
                                                <select
                                                  className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                                  value={row.batchId}
                                                  onChange={(e) => {
                                                    const v = e.target.value;
                                                    setRemoveBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, batchId: v } : r));
                                                  }}
                                                >
                                                  <option value="">Selecciona lote</option>
                                                  {selectableBatches.map(b => {
                                                    const batch = selectedProduct.batches?.find(batch => batch.id === b.id);
                                                    return (
                                                      <option key={b.id} value={b.id}>
                                                        {batch?.name} - {batch?.shelf}
                                                      </option>
                                                    );
                                                  })}
                                                </select>
                                              </td>
                                              <td className="p-0 border-r border-[hsl(var(--border))]">
                                                <input
                                                  className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                                  placeholder="0"
                                                  type="number"
                                                  value={row.qty}
                                                  onChange={(e) => {
                                                    const v = e.target.value === "" ? "" : Number(e.target.value);
                                                    setRemoveBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, qty: v } : r));
                                                  }}
                                                />
                                              </td>
                                              <td className="p-0">
                                                <button
                                                  type="button"
                                                  className="w-full py-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium transition-colors rounded"
                                                  onClick={() => setRemoveBatchRows((prev) => prev.filter((_, i) => i !== idx))}
                                                >
                                                  Eliminar
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {selectedProduct.type === "serie" && (() => {
                          const filteredSeries = (selectedProduct.series ?? []).filter(s => 
                            s.name.toLowerCase().includes(removeSeriesSearchTerm.toLowerCase()) ||
                            s.shelf.toLowerCase().includes(removeSeriesSearchTerm.toLowerCase())
                          );
                          
                          return (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <div className="text-xs text-[hsl(var(--muted-foreground))]">Series a quitar</div>
                                <input
                                  className="input"
                                  placeholder="Buscar serie..."
                                  value={removeSeriesSearchTerm}
                                  onChange={(e) => setRemoveSeriesSearchTerm(e.target.value)}
                                />
                              </div>
                              <div className="border border-[hsl(var(--border))] rounded-lg p-3 max-h-64 overflow-y-auto">
                                <div className="space-y-2">
                                  {filteredSeries.length > 0 ? (
                                    filteredSeries.map(s => (
                                      <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--muted))]/30 rounded cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={removeSelectedSeries.includes(s.id)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setRemoveSelectedSeries(prev => [...prev, s.id]);
                                            } else {
                                              setRemoveSelectedSeries(prev => prev.filter(id => id !== s.id));
                                            }
                                          }}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-sm">{s.name} - {s.shelf}</span>
                                      </label>
                                    ))
                                  ) : (
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                                      No se encontraron series
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {selectedProduct.type === "ninguno" && (
                          <div className="space-y-1">
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">Cantidad a quitar</div>
                            <input
                              className="input"
                              type="number"
                              placeholder="0"
                              value={removeSimpleQty}
                              onChange={(e) => setRemoveSimpleQty(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sección 3: Información adicional */}
                    <div className="space-y-4">
                      <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Información adicional</div>
                      <div className="space-y-1">
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Motivo del retiro</div>
                        <input
                          className="input"
                          placeholder="Describe el motivo"
                          value={removeReason}
                          onChange={(e) => setRemoveReason(e.target.value)}
                        />
                      </div>
                    </div>

                  </div>
                )}

                {movementType === "transferir" && (
                  <div className="space-y-6">
                    {/* Sección 1: Detalle de transferencia */}
                    <div className="space-y-4">
                      <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Detalle de transferencia</div>
                      
                      {/* Fila 1: Sucursal destino + Almacén destino */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Sucursal destino</div>
                          <select
                            className="input"
                            value={transferDestinationBranch}
                            onChange={(e) => {
                              const branchId = e.target.value;
                              setTransferDestinationBranch(branchId);
                              const firstWh = warehousesByBranch[branchId]?.[0]?.id ?? "";
                              setTransferDestinationWarehouse(firstWh);
                            }}
                          >
                            <option value="">Selecciona sucursal</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Almacén destino</div>
                          <select
                            className="input"
                            value={transferDestinationWarehouse}
                            onChange={(e) => setTransferDestinationWarehouse(e.target.value)}
                          >
                            <option value="">Selecciona almacén</option>
                            {(warehousesByBranch[transferDestinationBranch] ?? []).map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Fila 2: Producto con dropdown filtrable */}
                      <div className="space-y-1">
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Producto</div>
                        <div className="relative">
                          <div className="flex items-center">
                            <input
                              className="input w-full pr-8"
                              placeholder="Escribe para filtrar o selecciona"
                              value={productSearchTerm}
                              onChange={(e) => {
                                setProductSearchTerm(e.target.value);
                                setIsProductDropdownOpen(true);
                                if (e.target.value === "") {
                                  setSelectedProductIdForMovement("");
                                }
                              }}
                              onFocus={() => {
                                setIsProductDropdownOpen(true);
                                if (!selectedProductIdForMovement) {
                                  setProductSearchTerm("");
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => setIsProductDropdownOpen(false), 200);
                              }}
                            />
                            <svg 
                              className="absolute right-2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none"
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {isProductDropdownOpen && filteredProductsForSelection.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg max-h-48 overflow-y-auto">
                              {filteredProductsForSelection.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--muted))] text-sm transition-colors"
                                  onClick={() => {
                                    setSelectedProductIdForMovement(p.id);
                                    setProductSearchTerm(p.name);
                                    setIsProductDropdownOpen(false);
                                    setTransferBatchRows([]);
                                    setTransferSeriesRows([]);
                                    setTransferSimpleQty("");
                                    setTransferSimpleShelf("");
                                  }}
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          )}
                          {isProductDropdownOpen && filteredProductsForSelection.length === 0 && productSearchTerm.trim() !== "" && (
                            <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg">
                              <div className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                                No se encontraron productos
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedProductIdForMovement && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            Seleccionado: {selectedProduct?.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sección 2: Detalles del producto */}
                    {selectedProduct && (
                      <div className="space-y-4">
                        <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Detalles del producto</div>
                        
                        {selectedProduct.type === "lote" && (() => {
                          const availableBatches = (selectedProduct.batches ?? []).map(b => ({ id: b.id, key: `${b.id}-${b.shelf}` }));
                          const maxRows = availableBatches.length;
                          
                          return (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Lotes a transferir</div>
                                  {transferBatchRows.length < maxRows && (
                                    <button
                                      className="btn text-xs"
                                      onClick={() => {
                                        setTransferBatchRows((prev) => [
                                          ...prev,
                                          { batchId: "", qty: "", shelf: selectedProduct.shelves[0] ?? "" },
                                        ]);
                                      }}
                                    >
                                      + Agregar fila
                                    </button>
                                  )}
                                </div>
                                <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden shadow-sm">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80">
                                        <tr>
                                          <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Lote</th>
                                          <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Cantidad</th>
                                          <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Estantería destino</th>
                                          <th className="px-3 py-2.5 text-center font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">Acción</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[hsl(var(--border))]">
                                        {transferBatchRows.map((row, idx) => {
                                          const otherUsedKeys = transferBatchRows
                                            .filter((_, i) => i !== idx)
                                            .map(r => {
                                              const batch = availableBatches.find(b => b.id === r.batchId);
                                              return batch ? batch.key : null;
                                            })
                                            .filter(Boolean);
                                          const selectableBatches = availableBatches.filter(b => 
                                            !otherUsedKeys.includes(b.key) || b.id === row.batchId
                                          );
                                          
                                          return (
                                            <tr key={idx} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                                              <td className="p-0 border-r border-[hsl(var(--border))]">
                                                <select
                                                  className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                                  value={row.batchId}
                                                  onChange={(e) => {
                                                    const v = e.target.value;
                                                    setTransferBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, batchId: v } : r));
                                                  }}
                                                >
                                                  <option value="">Selecciona lote</option>
                                                  {selectableBatches.map(b => {
                                                    const batch = selectedProduct.batches?.find(batch => batch.id === b.id);
                                                    return (
                                                      <option key={b.id} value={b.id}>
                                                        {batch?.name} - {batch?.shelf}
                                                      </option>
                                                    );
                                                  })}
                                                </select>
                                              </td>
                                              <td className="p-0 border-r border-[hsl(var(--border))]">
                                                <input
                                                  className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                                  placeholder="0"
                                                  type="number"
                                                  value={row.qty}
                                                  onChange={(e) => {
                                                    const v = e.target.value === "" ? "" : Number(e.target.value);
                                                    setTransferBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, qty: v } : r));
                                                  }}
                                                />
                                              </td>
                                              <td className="p-0 border-r border-[hsl(var(--border))]">
                                                <select
                                                  className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                                  value={row.shelf}
                                                  onChange={(e) => {
                                                    const v = e.target.value;
                                                    setTransferBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, shelf: v } : r));
                                                  }}
                                                >
                                                  {selectedProduct.shelves.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                              </td>
                                              <td className="p-0">
                                                <button
                                                  type="button"
                                                  className="w-full py-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium transition-colors rounded"
                                                  onClick={() => setTransferBatchRows((prev) => prev.filter((_, i) => i !== idx))}
                                                >
                                                  Eliminar
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {selectedProduct.type === "serie" && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Series a transferir</div>
                                <button
                                  className="btn text-xs"
                                  onClick={() => {
                                    setTransferSeriesRows((prev) => [
                                      ...prev,
                                      { seriesId: "", shelf: selectedProduct.shelves[0] ?? "" },
                                    ]);
                                  }}
                                >
                                  + Agregar fila
                                </button>
                              </div>
                              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80">
                                      <tr>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Nombre</th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Estantería destino</th>
                                        <th className="px-3 py-2.5 text-center font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">Acción</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[hsl(var(--border))]">
                                      {transferSeriesRows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                                          <td className="p-0 border-r border-[hsl(var(--border))]">
                                            <select
                                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                              value={row.seriesId}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                setTransferSeriesRows((prev) => prev.map((r, i) => i === idx ? { ...r, seriesId: v } : r));
                                              }}
                                            >
                                              <option value="">Selecciona serie</option>
                                              {(selectedProduct.series ?? []).map(s => (
                                                <option key={s.id} value={s.id}>{s.name} - {s.shelf}</option>
                                              ))}
                                            </select>
                                          </td>
                                          <td className="p-0 border-r border-[hsl(var(--border))]">
                                            <select
                                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                              value={row.shelf}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                setTransferSeriesRows((prev) => prev.map((r, i) => i === idx ? { ...r, shelf: v } : r));
                                              }}
                                            >
                                              {selectedProduct.shelves.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                          </td>
                                          <td className="p-0">
                                            <button
                                              type="button"
                                              className="w-full py-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium transition-colors rounded"
                                              onClick={() => setTransferSeriesRows((prev) => prev.filter((_, i) => i !== idx))}
                                            >
                                              Eliminar
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedProduct.type === "ninguno" && (
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">Cantidad a transferir</div>
                              <input
                                className="input"
                                type="number"
                                placeholder="0"
                                value={transferSimpleQty}
                                onChange={(e) => setTransferSimpleQty(e.target.value === "" ? "" : Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">Estantería destino</div>
                              <select
                                className="input"
                                value={transferSimpleShelf}
                                onChange={(e) => setTransferSimpleShelf(e.target.value)}
                              >
                                <option value="">Selecciona estantería</option>
                                {selectedProduct.shelves.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sección 3: Información adicional */}
                    <div className="space-y-4">
                      <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Información adicional</div>
                      <div className="space-y-1">
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Motivo</div>
                        <input
                          className="input"
                          placeholder="Describe el motivo"
                          value={transferReason}
                          onChange={(e) => setTransferReason(e.target.value)}
                        />
                      </div>
                    </div>

                  </div>
                )}

                {movementType === "ajustar" && (
                  <div className="space-y-6">
                    {/* Sección 1: Detalle del producto */}
                    <div className="space-y-4">
                      <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Detalle del producto</div>
                      
                      {/* Producto con dropdown filtrable */}
                      <div className="space-y-1">
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Producto</div>
                        <div className="relative">
                          <div className="flex items-center">
                            <input
                              className="input w-full pr-8"
                              placeholder="Escribe para filtrar o selecciona"
                              value={productSearchTerm}
                              onChange={(e) => {
                                setProductSearchTerm(e.target.value);
                                setIsProductDropdownOpen(true);
                                if (e.target.value === "") {
                                  setSelectedProductIdForMovement("");
                                }
                              }}
                              onFocus={() => {
                                setIsProductDropdownOpen(true);
                                if (!selectedProductIdForMovement) {
                                  setProductSearchTerm("");
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => setIsProductDropdownOpen(false), 200);
                              }}
                            />
                            <svg 
                              className="absolute right-2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none"
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {isProductDropdownOpen && filteredProductsForSelection.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg max-h-48 overflow-y-auto">
                              {filteredProductsForSelection.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--muted))] text-sm transition-colors"
                                  onClick={() => {
                                    setSelectedProductIdForMovement(p.id);
                                    setProductSearchTerm(p.name);
                                    setIsProductDropdownOpen(false);
                                    // Inicializar con todos los lotes/series existentes
                                    if (p.type === "lote" && p.batches) {
                                      setAdjustBatchRows(p.batches.map(b => ({ batchId: b.id, qty: b.qty, shelf: b.shelf })));
                                    } else if (p.type === "serie" && p.series) {
                                      setAdjustSeriesRows(p.series.map(s => ({ seriesId: s.id, shelf: s.shelf })));
                                    } else {
                                      setAdjustBatchRows([]);
                                      setAdjustSeriesRows([]);
                                    }
                                    setAdjustSimpleQty("");
                                    setAdjustSimpleShelf("");
                                  }}
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          )}
                          {isProductDropdownOpen && filteredProductsForSelection.length === 0 && productSearchTerm.trim() !== "" && (
                            <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg">
                              <div className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                                No se encontraron productos
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedProductIdForMovement && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            Seleccionado: {selectedProduct?.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sección 2: Detalles del producto */}
                    {selectedProduct && (
                      <div className="space-y-4">
                        <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Ajustes del producto</div>
                        
                        {selectedProduct.type === "lote" && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Lotes a ajustar</div>
                              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80">
                                      <tr>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Lote</th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Cantidad</th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Estantería</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[hsl(var(--border))]">
                                      {adjustBatchRows.map((row, idx) => {
                                        const batch = selectedProduct.batches?.find(b => b.id === row.batchId);
                                        return (
                                          <tr key={idx} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                                            <td className="px-3 py-2 border-r border-[hsl(var(--border))]">
                                              {batch?.name || "N/A"}
                                            </td>
                                            <td className="p-0 border-r border-[hsl(var(--border))]">
                                              <input
                                                className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                                placeholder="0"
                                                type="number"
                                                value={row.qty}
                                                onChange={(e) => {
                                                  const v = e.target.value === "" ? "" : Number(e.target.value);
                                                  setAdjustBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, qty: v } : r));
                                                }}
                                              />
                                            </td>
                                            <td className="p-0 border-r border-[hsl(var(--border))]">
                                              <select
                                                className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                                value={row.shelf}
                                                onChange={(e) => {
                                                  const v = e.target.value;
                                                  setAdjustBatchRows((prev) => prev.map((r, i) => i === idx ? { ...r, shelf: v } : r));
                                                }}
                                              >
                                                {selectedProduct.shelves.map(s => <option key={s} value={s}>{s}</option>)}
                                              </select>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedProduct.type === "serie" && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Series a ajustar</div>
                              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80">
                                      <tr>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Nombre</th>
                                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Estantería</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[hsl(var(--border))]">
                                      {adjustSeriesRows.map((row, idx) => {
                                        const series = selectedProduct.series?.find(s => s.id === row.seriesId);
                                        return (
                                          <tr key={idx} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                                            <td className="px-3 py-2 border-r border-[hsl(var(--border))]">
                                              {series?.name || "N/A"}
                                            </td>
                                            <td className="p-0 border-r border-[hsl(var(--border))]">
                                              <select
                                                className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                                value={row.shelf}
                                                onChange={(e) => {
                                                  const v = e.target.value;
                                                  setAdjustSeriesRows((prev) => prev.map((r, i) => i === idx ? { ...r, shelf: v } : r));
                                                }}
                                              >
                                                {selectedProduct.shelves.map(s => <option key={s} value={s}>{s}</option>)}
                                              </select>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedProduct.type === "ninguno" && (
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">Cantidad ajustada</div>
                              <input
                                className="input"
                                type="number"
                                placeholder="0"
                                value={adjustSimpleQty}
                                onChange={(e) => setAdjustSimpleQty(e.target.value === "" ? "" : Number(e.target.value))}
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">Estantería</div>
                              <select
                                className="input"
                                value={adjustSimpleShelf}
                                onChange={(e) => setAdjustSimpleShelf(e.target.value)}
                              >
                                <option value="">Selecciona estantería</option>
                                {selectedProduct.shelves.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sección 3: Información adicional */}
                    <div className="space-y-4">
                      <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">Información adicional</div>
                      <div className="space-y-1">
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Motivo</div>
                        <input
                          className="input"
                          placeholder="Describe el motivo"
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </Modal>
          </div>

          {/* Sidebar notificaciones */}
          <div className="card h-max">
            <div className="card-inner space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Listas para stock</div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              </div>

              <div className="space-y-3">
                {notificationsMock.map(n => (
                  <div key={n.id} className="border rounded p-3 border-[hsl(var(--border))]">
                    <div className="text-sm font-medium">{n.orderName}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{n.buyer}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="text-[hsl(var(--muted-foreground))]">Producto</div>
                      <div className="font-medium">{n.productName}</div>
                      <div className="text-[hsl(var(--muted-foreground))]">Cantidad</div>
                      <div className="font-medium">{n.qty}</div>
                      <div className="text-[hsl(var(--muted-foreground))]">Fecha</div>
                      <div className="font-medium">{n.date}</div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button className="btn-primary" onClick={() => setMovementType("agregar")}>Agregar a stock</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
