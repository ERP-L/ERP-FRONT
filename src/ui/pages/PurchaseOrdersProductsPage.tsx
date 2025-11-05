import React, { useState, useMemo } from "react";

type ProductAlert = {
  id: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  sku: string;
};

type PurchaseOrder = {
  id: string;
  orderNumber: string;
  supplier: string;
  date: string;
  status: "pending" | "completed";
  total: number;
  products: Array<{ productName: string; quantity: number; unitPrice: number }>;
  invoice?: {
    type: "manual" | "electronic";
    documentType: "boleta" | "factura" | "boleta_electronica" | "factura_electronica";
    ruc: string;
    series: string;
    number: string;
    igv: number;
    total: number;
    date: string;
    file?: string;
  };
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
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh]">
        <div className="card">
          <div className="card-inner flex flex-col h-[85vh] max-h-[90vh] sm:max-h-[700px] overflow-hidden">
            <div className="flex items-start justify-between mb-4 flex-shrink-0">
              <h3 className="text-xl font-semibold">{title}</h3>
              <button className="btn" onClick={onClose} aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
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

// Mock productos disponibles
const availableProducts = [
  { id: "p1", name: "Laptop Pro 14", sku: "PROD-001" },
  { id: "p2", name: "Paracetamol 500mg", sku: "PROD-002" },
  { id: "p3", name: "Café en grano 1kg", sku: "PROD-003" },
];

export default function PurchaseOrdersProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openNewOrder, setOpenNewOrder] = useState(false);

  // Mock data - Alertas de stock
  const productAlerts: ProductAlert[] = [
    { id: "a1", productName: "Paracetamol 500mg", currentStock: 15, reorderLevel: 50, sku: "PROD-001" },
    { id: "a2", productName: "Café en grano 1kg", currentStock: 8, reorderLevel: 20, sku: "PROD-003" },
    { id: "a3", productName: "Laptop Pro 14", currentStock: 3, reorderLevel: 5, sku: "PROD-001" },
    { id: "a4", productName: "Mouse Inalámbrico", currentStock: 12, reorderLevel: 25, sku: "PROD-004" },
    { id: "a5", productName: "Teclado Mecánico", currentStock: 5, reorderLevel: 15, sku: "PROD-005" },
    { id: "a6", productName: "Monitor 27 pulgadas", currentStock: 2, reorderLevel: 5, sku: "PROD-006" },
    { id: "a7", productName: "Auriculares Bluetooth", currentStock: 7, reorderLevel: 20, sku: "PROD-007" },
    { id: "a4", productName: "Mouse Inalámbrico", currentStock: 12, reorderLevel: 25, sku: "PROD-004" },
    { id: "a5", productName: "Teclado Mecánico", currentStock: 5, reorderLevel: 15, sku: "PROD-005" },
    { id: "a6", productName: "Monitor 27 pulgadas", currentStock: 2, reorderLevel: 5, sku: "PROD-006" },
    { id: "a7", productName: "Auriculares Bluetooth", currentStock: 7, reorderLevel: 20, sku: "PROD-007" },
  ];

  // Mock data - Órdenes de compra
  const [purchaseOrdersMock] = useState<PurchaseOrder[]>([
    {
      id: "po1",
      orderNumber: "OC-001",
      supplier: "Proveedor ABC S.A.",
      date: "2025-01-10",
      status: "completed",
      total: 7200,
      products: [
        { productName: "Laptop Pro 14", quantity: 2, unitPrice: 2400 },
        { productName: "Paracetamol 500mg", quantity: 500, unitPrice: 1.2 },
      ],
      invoice: {
        type: "electronic",
        documentType: "factura_electronica",
        ruc: "20123456789",
        series: "F001",
        number: "000123",
        igv: 1296,
        total: 7200,
        date: "2025-01-10",
        file: "invoice_001.pdf",
      },
    },
    {
      id: "po2",
      orderNumber: "OC-002",
      supplier: "Distribuidora XYZ",
      date: "2025-01-12",
      status: "pending",
      total: 850,
      products: [
        { productName: "Café en grano 1kg", quantity: 100, unitPrice: 8.5 },
      ],
    },
    {
      id: "po3",
      orderNumber: "OC-003",
      supplier: "Suministros Médicos S.A.",
      date: "2025-01-13",
      status: "completed",
      total: 1500,
      products: [
        { productName: "Paracetamol 500mg", quantity: 1000, unitPrice: 1.2 },
      ],
    },
    {
      id: "po4",
      orderNumber: "OC-004",
      supplier: "Tecnología Global S.R.L.",
      date: "2025-01-14",
      status: "pending",
      total: 4800,
      products: [
        { productName: "Laptop Pro 14", quantity: 2, unitPrice: 2400 },
      ],
    },
    {
      id: "po5",
      orderNumber: "OC-005",
      supplier: "Alimentos Premium",
      date: "2025-01-15",
      status: "completed",
      total: 425,
      products: [
        { productName: "Café en grano 1kg", quantity: 50, unitPrice: 8.5 },
      ],
    },
    {
      id: "po6",
      orderNumber: "OC-006",
      supplier: "Distribuidora Nacional",
      date: "2025-01-16",
      status: "pending",
      total: 3200,
      products: [
        { productName: "Laptop Pro 14", quantity: 1, unitPrice: 2400 },
        { productName: "Paracetamol 500mg", quantity: 500, unitPrice: 1.2 },
      ],
    },
    {
      id: "po7",
      orderNumber: "OC-007",
      supplier: "Proveedor ABC S.A.",
      date: "2025-01-17",
      status: "completed",
      total: 960,
      products: [
        { productName: "Café en grano 1kg", quantity: 120, unitPrice: 8.5 },
      ],
    },
    {
      id: "po8",
      orderNumber: "OC-008",
      supplier: "Suministros Médicos S.A.",
      date: "2025-01-18",
      status: "pending",
      total: 2400,
      products: [
        { productName: "Paracetamol 500mg", quantity: 2000, unitPrice: 1.2 },
      ],
    },
  ]);

  // Estados para nueva orden
  const [orderForm, setOrderForm] = useState({
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    products: [{ productName: "", quantity: 0, unitPrice: 0 }] as Array<{ productName: string; quantity: number; unitPrice: number }>,
    invoice: {
      type: "manual" as "manual" | "electronic",
      documentType: "factura_electronica" as "boleta" | "factura" | "boleta_electronica" | "factura_electronica",
      ruc: "",
      series: "",
      number: "",
      igv: 0,
      total: 0,
      date: new Date().toISOString().split("T")[0],
      file: null as File | null,
    },
    status: "pending" as "pending" | "completed",
  });

  const [productSearchTerms, setProductSearchTerms] = useState<Record<number, string>>({});
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrTextInput, setQrTextInput] = useState("");
  const [showQrInput, setShowQrInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Función para obtener productos filtrados por índice de fila
  const getFilteredProducts = (index: number) => {
    const searchTerm = productSearchTerms[index] || "";
    if (!searchTerm || searchTerm.trim() === "") {
      return availableProducts;
    }
    return availableProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredOrders = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return purchaseOrdersMock.filter(po => 
      po.orderNumber.toLowerCase().includes(t) ||
      po.supplier.toLowerCase().includes(t) ||
      po.status.toLowerCase().includes(t)
    );
  }, [searchTerm, purchaseOrdersMock]);

  function handleAddProduct() {
    setOrderForm(prev => ({
      ...prev,
      products: [...prev.products, { productName: "", quantity: 0, unitPrice: 0 }],
    }));
  }

  function handleRemoveProduct(index: number) {
    setOrderForm(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  }

  function handleProductSelect(productName: string, index: number) {
    setOrderForm(prev => ({
      ...prev,
      products: prev.products.map((p, i) => i === index ? { ...p, productName } : p),
    }));
    setProductSearchTerms(prev => ({ ...prev, [index]: "" }));
    setOpenDropdownIndex(null);
  }

  function handleProductSearchChange(value: string, index: number) {
    setProductSearchTerms(prev => ({ ...prev, [index]: value }));
    setOrderForm(prev => ({
      ...prev,
      products: prev.products.map((p, i) => i === index ? { ...p, productName: value } : p),
    }));
    setOpenDropdownIndex(index);
  }

  function calculateTotal() {
    const subtotal = orderForm.products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const igv = subtotal * 0.18;
    return { subtotal, igv, total: subtotal + igv };
  }

  function handleQrUpload(file: File) {
    setQrFile(file);
    // Aquí se procesaría la imagen del QR para extraer la información
    // Por ahora, simulamos que se llenan algunos campos
    const mockQRData = "20608449320|01|F001|00006880|41.19|270.00|2024-11-14|6|20608634640";
    const parsed = parseQR(mockQRData);
    if (parsed) {
      setOrderForm(prev => ({
        ...prev,
        invoice: {
          ...prev.invoice,
          ruc: parsed.ruc,
          series: parsed.series,
          number: parsed.number,
          igv: parsed.igv,
          total: parsed.total,
          date: parsed.date,
        },
      }));
    }
  }

  function handleQrTextInput(qrText: string) {
    setQrTextInput(qrText);
    const parsed = parseQR(qrText);
    if (parsed) {
      setOrderForm(prev => ({
        ...prev,
        invoice: {
          ...prev.invoice,
          ruc: parsed.ruc,
          series: parsed.series,
          number: parsed.number,
          igv: parsed.igv,
          total: parsed.total,
          date: parsed.date,
        },
      }));
    }
  }

  function handleFileSelect(file: File) {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setOrderForm(prev => ({
        ...prev,
        invoice: { ...prev.invoice, file },
      }));
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }

  function handleSubmitOrder() {
    // Aquí se enviaría la orden
    console.log("Enviando orden:", orderForm);
    setOpenNewOrder(false);
      // Reset form
      setOrderForm({
        supplier: "",
        date: new Date().toISOString().split("T")[0],
        products: [{ productName: "", quantity: 0, unitPrice: 0 }],
        invoice: {
          type: "manual",
          documentType: "factura_electronica",
          ruc: "",
          series: "",
          number: "",
          igv: 0,
          total: 0,
          date: new Date().toISOString().split("T")[0],
          file: null,
        },
        status: "pending",
      });
      setProductSearchTerms({});
      setOpenDropdownIndex(null);
      setQrFile(null);
      setQrTextInput("");
      setShowQrInput(false);
      setIsDragging(false);
  }

  const totals = calculateTotal();

  // Función para parsear QR (formato: RUC|SERIE|NUMERO|IGV|TOTAL|FECHA|...)
  function parseQR(qrData: string) {
    const parts = qrData.split("|");
    if (parts.length >= 6) {
      return {
        ruc: parts[0] || "",
        series: parts[1] || "",
        number: parts[2] || "",
        igv: parseFloat(parts[3] || "0"),
        total: parseFloat(parts[4] || "0"),
        date: parts[5] || new Date().toISOString().split("T")[0],
      };
    }
    return null;
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Órdenes de Compra - Productos</h1>
        <button className="btn-primary w-full sm:w-auto whitespace-nowrap" onClick={() => setOpenNewOrder(true)}>
          Nueva Orden
        </button>
      </div>

      {/* Layout: contenido central + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Contenido central */}
        <div className="flex flex-col min-h-0">
          {/* Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 flex-shrink-0">
            <input
              className="input flex-1 min-w-0"
              placeholder="Buscar órdenes de compra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn w-full sm:w-auto whitespace-nowrap">
              Filtrar
            </button>
          </div>

          {/* Tabla de órdenes de compra */}
          <div className="card overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="card-inner flex-1 flex flex-col min-h-0 p-0">
              <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
                <div className="p-4 sm:p-6">
                  <div className="inline-block min-w-full align-middle">
                    <table className="w-full text-sm">
                    <thead className="bg-[hsl(var(--accent))] sticky top-0 z-20 shadow-md">
                      <tr className="text-left">
                        <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">N° Orden</th>
                        <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Proveedor</th>
                        <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Fecha</th>
                        <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Estado</th>
                        <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Total</th>
                        <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={6}>
                            Sin datos
                          </td>
                        </tr>
                      )}
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                          <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium">
                            {order.orderNumber}
                          </td>
                          <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                            {order.supplier}
                          </td>
                          <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                            {order.date}
                          </td>
                          <td className="px-6 py-4 border-b border-[hsl(var(--border))]">
                            {order.status === "completed" ? (
                              <Tag>Realizado</Tag>
                            ) : (
                              <Tag>Pendiente</Tag>
                            )}
                          </td>
                          <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium">
                            S/ {order.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 border-b border-[hsl(var(--border))]">
                            <button className="btn text-xs">Ver detalles</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Alertas de stock */}
        <div className="card flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="card-inner flex flex-col flex-1 min-h-0 p-0">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0 p-6 pb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h3 className="text-sm font-semibold">Alertas de Stock</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar px-6 pb-6">
              {productAlerts.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  No hay alertas
                </div>
              ) : (
                productAlerts.map(alert => (
                  <div key={alert.id} className="border rounded p-3 border-[hsl(var(--border))]">
                    <div className="font-medium text-sm">{alert.productName}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">SKU: {alert.sku}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="text-[hsl(var(--muted-foreground))]">Stock actual</div>
                      <div className="font-medium">{alert.currentStock}</div>
                      <div className="text-[hsl(var(--muted-foreground))]">Umbral</div>
                      <div className="font-medium text-red-600">{alert.reorderLevel}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Nueva Orden de Compra */}
      <Modal
        open={openNewOrder}
        onClose={() => setOpenNewOrder(false)}
        title="Nueva Orden de Compra"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn"
              onClick={() => setOpenNewOrder(false)}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmitOrder}
            >
              Guardar Orden
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Sección 1: Documento Emitido */}
          <div className="space-y-4">
            <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
              Documento Emitido
            </div>

            {/* Tipo de documento */}
            <div className="space-y-1">
              <div className="text-xs text-[hsl(var(--muted-foreground))]">Tipo de Documento</div>
              <select
                className="input"
                value={orderForm.invoice.documentType}
                onChange={(e) => setOrderForm(prev => ({
                  ...prev,
                  invoice: { ...prev.invoice, documentType: e.target.value as "boleta" | "factura" | "boleta_electronica" | "factura_electronica" },
                }))}
              >
                <option value="boleta_electronica">Boleta Electrónica</option>
                <option value="boleta">Boleta Simple</option>
                <option value="factura_electronica">Factura Electrónica</option>
                <option value="factura">Factura Simple</option>
              </select>
            </div>

            {/* Inputs del documento */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">RUC</div>
                <input
                  className="input"
                  placeholder="RUC del proveedor"
                  value={orderForm.invoice.ruc}
                  onChange={(e) => setOrderForm(prev => ({
                    ...prev,
                    invoice: { ...prev.invoice, ruc: e.target.value },
                  }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Serie</div>
                <input
                  className="input"
                  placeholder="Serie"
                  value={orderForm.invoice.series}
                  onChange={(e) => setOrderForm(prev => ({
                    ...prev,
                    invoice: { ...prev.invoice, series: e.target.value },
                  }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Número</div>
                <input
                  className="input"
                  placeholder="Número de factura"
                  value={orderForm.invoice.number}
                  onChange={(e) => setOrderForm(prev => ({
                    ...prev,
                    invoice: { ...prev.invoice, number: e.target.value },
                  }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">IGV</div>
                <input
                  className="input"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={orderForm.invoice.igv || ""}
                  onChange={(e) => setOrderForm(prev => ({
                    ...prev,
                    invoice: { ...prev.invoice, igv: e.target.value === "" ? 0 : Number(e.target.value) },
                  }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Total</div>
                <input
                  className="input"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={orderForm.invoice.total || ""}
                  onChange={(e) => setOrderForm(prev => ({
                    ...prev,
                    invoice: { ...prev.invoice, total: e.target.value === "" ? 0 : Number(e.target.value) },
                  }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Fecha</div>
                <input
                  className="input"
                  type="date"
                  value={orderForm.invoice.date}
                  onChange={(e) => setOrderForm(prev => ({
                    ...prev,
                    invoice: { ...prev.invoice, date: e.target.value },
                  }))}
                />
              </div>
            </div>

            {/* Código QR - Input intuitivo */}
            <div className="space-y-2">
              <div className="text-xs text-[hsl(var(--muted-foreground))]">Código QR</div>
              <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-4 hover:border-[hsl(var(--primary))] transition-colors">
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="flex-1 w-full">
                    {!showQrInput ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn flex-1 flex items-center justify-center gap-2"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                handleQrUpload(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          Subir imagen QR
                        </button>
                        <button
                          type="button"
                          className="btn flex-1 flex items-center justify-center gap-2"
                          onClick={() => {
                            // Aquí se podría abrir la cámara para escanear QR
                            alert("Función de escaneo QR próximamente");
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="5" width="22" height="14" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                          </svg>
                          Escanear QR
                        </button>
                        <button
                          type="button"
                          className="btn flex-1 flex items-center justify-center gap-2"
                          onClick={() => setShowQrInput(true)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 7h16M4 12h16M4 17h16"></path>
                          </svg>
                          Pegar texto QR
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          className="input flex-1"
                          placeholder="Pega aquí el código QR (ej: 20608449320|01|F001|00006880|41.19|270.00|2024-11-14|6|20608634640)"
                          value={qrTextInput}
                          onChange={(e) => handleQrTextInput(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setShowQrInput(false);
                            setQrTextInput("");
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {qrFile && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Archivo cargado: {qrFile.name}
                  </div>
                )}
                {qrTextInput && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Código QR procesado correctamente
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección 2: Productos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2 flex-1">
                Productos
              </div>
              <button className="btn text-xs" onClick={handleAddProduct}>
                + Agregar producto
              </button>
            </div>

            {orderForm.products.length > 0 && (
              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Producto</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Cantidad</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Precio Unit.</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Subtotal</th>
                        <th className="px-3 py-2.5 text-center font-semibold text-[hsl(var(--foreground))] whitespace-nowrap">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {orderForm.products.map((product, idx) => (
                        <tr key={idx} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                          <td className="p-0 border-r border-[hsl(var(--border))]">
                            <div className="relative">
                              <input
                                className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                                placeholder="Buscar producto..."
                                value={product.productName}
                                onChange={(e) => handleProductSearchChange(e.target.value, idx)}
                                onFocus={() => setOpenDropdownIndex(idx)}
                                onBlur={() => setTimeout(() => setOpenDropdownIndex(null), 200)}
                              />
                              {openDropdownIndex === idx && getFilteredProducts(idx).length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                                  {getFilteredProducts(idx).map(p => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--muted))] text-sm transition-colors"
                                      onClick={() => handleProductSelect(p.name, idx)}
                                    >
                                      {p.name} ({p.sku})
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-0 border-r border-[hsl(var(--border))]">
                            <input
                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                              type="number"
                              placeholder="0"
                              min="0"
                              value={product.quantity || ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                setOrderForm(prev => ({
                                  ...prev,
                                  products: prev.products.map((p, i) => i === idx ? { ...p, quantity: val } : p),
                                }));
                              }}
                            />
                          </td>
                          <td className="p-0 border-r border-[hsl(var(--border))]">
                            <input
                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                              type="number"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              value={product.unitPrice || ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                setOrderForm(prev => ({
                                  ...prev,
                                  products: prev.products.map((p, i) => i === idx ? { ...p, unitPrice: val } : p),
                                }));
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 border-r border-[hsl(var(--border))]">
                            S/ {(product.quantity * product.unitPrice).toFixed(2)}
                          </td>
                          <td className="p-0">
                            <button
                              type="button"
                              className="w-full py-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium transition-colors rounded"
                              onClick={() => handleRemoveProduct(idx)}
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
            )}

            {orderForm.products.length === 0 && (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                No hay productos agregados. Haz clic en "Agregar producto" para comenzar.
              </div>
            )}

            {orderForm.products.length > 0 && (
              <div className="flex justify-end">
                <div className="text-right space-y-1">
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Subtotal: S/ {totals.subtotal.toFixed(2)}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    IGV (18%): S/ {totals.igv.toFixed(2)}
                  </div>
                  <div className="text-sm font-semibold">
                    Total: S/ {totals.total.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sección 3: Archivos */}
          <div className="space-y-4">
            <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
              Archivos
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Adjuntar documento (Boleta/Factura/Boleta Electrónica/Factura Electrónica)
              </div>
              <div
                className={`border-2 border-dashed rounded-lg p-6 transition-all ${
                  isDragging
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  {isDragging ? (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[hsl(var(--primary))]">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[hsl(var(--muted-foreground))]">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  )}
                  <div className="text-center">
                    <div className={`text-sm font-medium mb-1 ${isDragging ? "text-[hsl(var(--primary))]" : ""}`}>
                      {isDragging ? "Suelta el archivo aquí" : "Sube una foto o PDF de la boleta/factura"}
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                      {isDragging ? "Arrastra y suelta para subir" : "Arrastra y suelta o haz clic para seleccionar"}
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                      Formatos aceptados: JPG, PNG, PDF
                    </div>
                    <label className="btn-primary cursor-pointer inline-block">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(file);
                          }
                        }}
                      />
                      Seleccionar archivo
                    </label>
                  </div>
                  {orderForm.invoice.file && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Archivo cargado: {orderForm.invoice.file.name}
                      <button
                        type="button"
                        className="ml-2 text-red-600 hover:text-red-700"
                        onClick={() => {
                          setOrderForm(prev => ({
                            ...prev,
                            invoice: { ...prev.invoice, file: null },
                          }));
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
