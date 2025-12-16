import { useState, useMemo, useEffect } from "react";
import { ApiService } from "../../core/api-service";
import type { BranchListItem, CostCenterResponse, PurchaseOrderListItem, PurchaseOrderDetail, ProductListItem, InvoiceListItem, InvoiceDetail, CreateInvoiceRequest } from "../../core/api-types";

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

export default function InvoicingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Gasto adicional");
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrderListItem | null>(null);
  const [selectedPurchaseOrderDetails, setSelectedPurchaseOrderDetails] = useState<PurchaseOrderDetail | null>(null);
  
  // Selectores de sucursal y centro de costo
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>("");
  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterResponse[]>([]);
  const [loadingCostCenters, setLoadingCostCenters] = useState(false);
  const [products, setProducts] = useState<ProductListItem[]>([]);

  // Órdenes de compra desde la API
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderListItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Facturas desde la API
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail | null>(null);
  const [loadingInvoiceDetails, setLoadingInvoiceDetails] = useState(false);

  // Estados para el formulario de factura
  const [invoiceForm, setInvoiceForm] = useState({
    documentType: "factura_electronica" as "boleta" | "factura" | "boleta_electronica" | "factura_electronica",
    ruc: "",
    series: "",
    number: "",
    igv: 0,
    total: 0,
    date: new Date().toISOString().split("T")[0],
    file: null as File | null,
    products: [{ productName: "", quantity: 0, unitPrice: 0 }] as Array<{ productName: string; quantity: number; unitPrice: number }>,
  });

  const [productSearchTerms, setProductSearchTerms] = useState<Record<number, string>>({});
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrTextInput, setQrTextInput] = useState("");
  const [showQrInput, setShowQrInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Cargar sucursales
  useEffect(() => {
    (async () => {
      try {
        const result = await ApiService.getBranches();
        if (result.ok) {
          setBranches(result.data);
        }
      } catch (error) {
        console.error('Error loading branches:', error);
      }
    })();
  }, []);

  // Cargar productos
  useEffect(() => {
    (async () => {
      try {
        const result = await ApiService.getProducts();
        if (result.ok) {
          setProducts(result.data);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    })();
  }, []);

  // Cargar centros de costo cuando se selecciona una sucursal
  useEffect(() => {
    if (!selectedBranchId) {
      setCostCenters([]);
      setSelectedCostCenterId("");
      return;
    }

    (async () => {
      setLoadingCostCenters(true);
      try {
        const result = await ApiService.getCostCentersByBranch(parseInt(selectedBranchId), 0, 25);
        if (result.ok) {
          setCostCenters(result.data.items);
        } else {
          console.error('Error loading cost centers:', result.error);
          setCostCenters([]);
        }
      } catch (error) {
        console.error('Error loading cost centers:', error);
        setCostCenters([]);
      } finally {
        setLoadingCostCenters(false);
      }
    })();
  }, [selectedBranchId]);

  // Cargar órdenes de compra cuando se selecciona un centro de costo
  useEffect(() => {
    if (!selectedCostCenterId) {
      setPurchaseOrders([]);
      return;
    }

    (async () => {
      setLoadingOrders(true);
      try {
        const result = await ApiService.getPurchaseOrders(parseInt(selectedCostCenterId), 1, 100);
        if (result.ok) {
          // Filtrar solo órdenes de tipo PRODUCTO
          const productOrders = result.data.items.filter(order => 
            order.purchaseType.toUpperCase() === "PRODUCTO"
          );
          setPurchaseOrders(productOrders);
        } else {
          console.error('Error loading purchase orders:', result.error);
          setPurchaseOrders([]);
        }
      } catch (error) {
        console.error('Error loading purchase orders:', error);
        setPurchaseOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [selectedCostCenterId]);

  // Cargar facturas cuando se selecciona un centro de costo
  useEffect(() => {
    if (!selectedCostCenterId) {
      setInvoices([]);
      return;
    }

    (async () => {
      setLoadingInvoices(true);
      try {
        const result = await ApiService.getInvoices(parseInt(selectedCostCenterId), 1, 100);
        if (result.ok) {
          setInvoices(result.data);
        } else {
          console.error('Error loading invoices:', result.error);
          setInvoices([]);
        }
      } catch (error) {
        console.error('Error loading invoices:', error);
        setInvoices([]);
      } finally {
        setLoadingInvoices(false);
      }
    })();
  }, [selectedCostCenterId]);

  const filteredInvoices = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return invoices.filter(inv => 
      (inv.code || `${inv.serie}-${inv.numeroFactura}`).toLowerCase().includes(t) ||
      inv.ruc.toLowerCase().includes(t) ||
      (inv.purchaseOrderId ? `OC-${inv.purchaseOrderId}` : "gasto adicional").toLowerCase().includes(t)
    );
  }, [searchTerm, invoices]);

  function handleNewInvoice() {
    setSelectedPurchaseOrder(null);
    setModalTitle("Gasto adicional");
    setOpenModal(true);
  }

  async function handleCreateFromPurchaseOrder(order: PurchaseOrderListItem) {
    setSelectedPurchaseOrder(order);
    setModalTitle("Factura de orden de compra");
    
    // Obtener detalles de la orden de compra
    try {
      const result = await ApiService.getPurchaseOrderDetails(order.purchaseOrderId);
      if (result.ok) {
        setSelectedPurchaseOrderDetails(result.data);
        
        // Prellenar el formulario con los datos de la orden
        const orderDetails = result.data;
        const orderProducts = orderDetails.products.map(product => {
          const productInfo = products.find(p => p.productId === product.productId);
          return {
            productName: productInfo?.productName || `Producto ${product.productId}`,
            quantity: product.cantidad,
            unitPrice: product.unitCost,
          };
        });

        setInvoiceForm({
          documentType: "factura_electronica",
          ruc: orderDetails.ruc,
          series: "",
          number: "",
          igv: orderDetails.total * 0.18 / 1.18, // Calcular IGV del total
          total: orderDetails.total,
          date: orderDetails.fechaEmision,
          file: null,
          products: orderProducts.length > 0 ? orderProducts : [{ productName: "", quantity: 0, unitPrice: 0 }],
        });
      } else {
        console.error('Error loading purchase order details:', result.error);
        // Aún abrir el modal pero sin prellenar
        setSelectedPurchaseOrderDetails(null);
      }
    } catch (error) {
      console.error('Error loading purchase order details:', error);
      setSelectedPurchaseOrderDetails(null);
    }
    
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setSelectedPurchaseOrder(null);
    setSelectedPurchaseOrderDetails(null);
    // Reset form
    setInvoiceForm({
      documentType: "factura_electronica",
      ruc: "",
      series: "",
      number: "",
      igv: 0,
      total: 0,
      date: new Date().toISOString().split("T")[0],
      file: null,
      products: [{ productName: "", quantity: 0, unitPrice: 0 }],
    });
    setProductSearchTerms({});
    setOpenDropdownIndex(null);
    setQrFile(null);
    setQrTextInput("");
    setShowQrInput(false);
    setIsDragging(false);
  }

  // Función para obtener productos filtrados por índice de fila
  const getFilteredProducts = (index: number) => {
    const searchTerm = productSearchTerms[index] || "";
    if (!searchTerm || searchTerm.trim() === "") {
      return products.map(p => ({ id: String(p.productId), name: p.productName, sku: p.sku }));
    }
    return products
      .filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(p => ({ id: String(p.productId), name: p.productName, sku: p.sku }));
  };

  function handleAddProduct() {
    setInvoiceForm(prev => ({
      ...prev,
      products: [...prev.products, { productName: "", quantity: 0, unitPrice: 0 }],
    }));
  }

  function handleRemoveProduct(index: number) {
    setInvoiceForm(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  }

  function handleProductSelect(productName: string, index: number) {
    setInvoiceForm(prev => ({
      ...prev,
      products: prev.products.map((p, i) => i === index ? { ...p, productName } : p),
    }));
    setProductSearchTerms(prev => ({ ...prev, [index]: "" }));
    setOpenDropdownIndex(null);
  }

  function handleProductSearchChange(value: string, index: number) {
    setProductSearchTerms(prev => ({ ...prev, [index]: value }));
    setInvoiceForm(prev => ({
      ...prev,
      products: prev.products.map((p, i) => i === index ? { ...p, productName: value } : p),
    }));
    setOpenDropdownIndex(index);
  }

  function calculateTotal() {
    const subtotal = invoiceForm.products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const igv = subtotal * 0.18;
    return { subtotal, igv, total: subtotal + igv };
  }

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

  function handleQrUpload(file: File) {
    setQrFile(file);
    // Aquí se procesaría la imagen del QR para extraer la información
    // Por ahora, simulamos que se llenan algunos campos
    const mockQRData = "20608449320|01|F001|00006880|41.19|270.00|2024-11-14|6|20608634640";
    const parsed = parseQR(mockQRData);
    if (parsed) {
      setInvoiceForm(prev => ({
        ...prev,
        ruc: parsed.ruc,
        series: parsed.series,
        number: parsed.number,
        igv: parsed.igv,
        total: parsed.total,
        date: parsed.date,
      }));
    }
  }

  function handleQrTextInput(qrText: string) {
    setQrTextInput(qrText);
    const parsed = parseQR(qrText);
    if (parsed) {
      setInvoiceForm(prev => ({
        ...prev,
        ruc: parsed.ruc,
        series: parsed.series,
        number: parsed.number,
        igv: parsed.igv,
        total: parsed.total,
        date: parsed.date,
      }));
    }
  }

  function handleFileSelect(file: File) {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setInvoiceForm(prev => ({
        ...prev,
        file,
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

  async function handleSubmitInvoice() {
    // Validar campos requeridos
    if (!selectedCostCenterId || !selectedBranchId) {
      alert("Debe seleccionar una sucursal y un centro de costo");
      return;
    }

    if (!invoiceForm.ruc || !invoiceForm.series || !invoiceForm.number) {
      alert("RUC, Serie y Número son campos requeridos");
      return;
    }

    if (invoiceForm.products.length === 0 || invoiceForm.products.some(p => !p.productName || p.quantity <= 0)) {
      alert("Debe agregar al menos un producto con cantidad válida");
      return;
    }

    try {
      // Mapear documentType a documentTypeId
      const documentTypeMap: Record<string, number> = {
        "factura_electronica": 1,
        "factura": 2,
        "boleta_electronica": 3,
        "boleta": 4,
      };

      // Preparar items de la factura
      const items = invoiceForm.products
        .filter(p => p.productName && p.quantity > 0)
        .map(p => {
          const product = products.find(prod => prod.productName === p.productName);
          if (!product) {
            throw new Error(`Producto ${p.productName} no encontrado`);
          }
          return {
            productId: product.productId,
            cantidad: p.quantity,
            unitCost: p.unitPrice,
          };
        });

      // Preparar datos para la API
      const invoiceData: CreateInvoiceRequest = {
        documentTypeId: documentTypeMap[invoiceForm.documentType] || 1,
        ruc: invoiceForm.ruc,
        serie: invoiceForm.series,
        numeroFactura: invoiceForm.number,
        igv: invoiceForm.igv,
        total: invoiceForm.total,
        fecha: invoiceForm.date,
        urlDocumento: invoiceForm.file ? invoiceForm.file.name : "",
        costCenterId: parseInt(selectedCostCenterId),
        branchId: parseInt(selectedBranchId),
        code: invoiceForm.series + "-" + invoiceForm.number,
        items: items,
      };

      // Si hay una orden de compra seleccionada, agregar purchaseOrderId
      if (selectedPurchaseOrder) {
        invoiceData.purchaseOrderId = selectedPurchaseOrder.purchaseOrderId;
      }

      const result = await ApiService.createInvoice(invoiceData);
      
      if (!result.ok) {
        alert(`Error al crear factura: ${result.error}`);
        return;
      }

      // Recargar facturas
      if (selectedCostCenterId) {
        const invoicesResult = await ApiService.getInvoices(parseInt(selectedCostCenterId), 1, 100);
        if (invoicesResult.ok) {
          setInvoices(invoicesResult.data);
        }
      }

      handleCloseModal();
      alert("Factura creada exitosamente");
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert("Error inesperado al crear la factura");
    }
  }

  const totals = calculateTotal();

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Facturación</h1>
          <select
            className="select w-full sm:w-64"
            value={selectedBranchId}
            onChange={(e) => {
              setSelectedBranchId(e.target.value);
              setSelectedCostCenterId(""); // Reset centro de costo al cambiar sucursal
            }}
          >
            <option value="">Seleccione una sucursal</option>
            {branches.map(branch => (
              <option key={branch.branchId} value={String(branch.branchId)}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            className="select w-full sm:w-64"
            value={selectedCostCenterId}
            onChange={(e) => setSelectedCostCenterId(e.target.value)}
            disabled={!selectedBranchId || loadingCostCenters}
          >
            <option value="">Seleccione un centro de costo</option>
            {loadingCostCenters ? (
              <option value="" disabled>Cargando...</option>
            ) : (
              costCenters.map(cc => (
                <option key={cc.costCenterId} value={String(cc.costCenterId)}>
                  {cc.code} - {cc.name}
                </option>
              ))
            )}
          </select>
        </div>
        <button className="btn-primary w-full sm:w-auto whitespace-nowrap" onClick={handleNewInvoice}>
          Nueva Factura
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
              placeholder="Buscar facturas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn w-full sm:w-auto whitespace-nowrap">
              Filtrar
            </button>
          </div>

          {/* Tabla de facturas */}
          <div className="card overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="card-inner flex-1 flex flex-col min-h-0 p-0">
              <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
                <div className="p-4 sm:p-6">
                  <div className="inline-block min-w-full align-middle">
                    <table className="w-full text-sm">
                      <thead className="bg-[hsl(var(--accent))] sticky top-0 z-20 shadow-md">
                        <tr className="text-left">
                          <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Código</th>
                          <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Proveedor</th>
                          <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Fecha</th>
                          <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Orden de Compra</th>
                          <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Total</th>
                          <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))]">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingInvoices ? (
                          <tr>
                            <td className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={6}>
                              Cargando...
                            </td>
                          </tr>
                        ) : !selectedCostCenterId ? (
                          <tr>
                            <td className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={6}>
                              Seleccione un centro de costo para ver las facturas
                            </td>
                          </tr>
                        ) : filteredInvoices.length === 0 ? (
                          <tr>
                            <td className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={6}>
                              Sin datos
                            </td>
                          </tr>
                        ) : (
                          filteredInvoices.map((invoice) => (
                            <tr key={invoice.invoiceId} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                              <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium">
                                {invoice.code || `${invoice.serie}-${invoice.numeroFactura}`}
                              </td>
                              <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                                {invoice.ruc}
                              </td>
                              <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                                {invoice.fecha}
                              </td>
                              <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                                {invoice.purchaseOrderId ? `OC-${invoice.purchaseOrderId}` : "Gasto adicional"}
                              </td>
                              <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium">
                                S/ {invoice.total.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 border-b border-[hsl(var(--border))]">
                                <button 
                                  className="btn text-xs"
                                  onClick={async () => {
                                    setLoadingInvoiceDetails(true);
                                    setOpenDetailsModal(true);
                                    try {
                                      const result = await ApiService.getInvoiceDetails(invoice.invoiceId);
                                      if (result.ok) {
                                        setInvoiceDetails(result.data);
                                      } else {
                                        console.error('Error loading invoice details:', result.error);
                                        setInvoiceDetails(null);
                                      }
                                    } catch (error) {
                                      console.error('Error loading invoice details:', error);
                                      setInvoiceDetails(null);
                                    } finally {
                                      setLoadingInvoiceDetails(false);
                                    }
                                  }}
                                >
                                  Ver detalles
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Órdenes de Compra */}
        <div className="card flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="card-inner flex flex-col flex-1 min-h-0 p-0">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0 p-6 pb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3 className="text-sm font-semibold">Órdenes de Compra</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar px-6 pb-6">
              {!selectedCostCenterId ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  Seleccione un centro de costo para ver órdenes
                </div>
              ) : loadingOrders ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  Cargando órdenes...
                </div>
              ) : purchaseOrders.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  No hay órdenes de compra
                </div>
              ) : (
                purchaseOrders.map(order => (
                  <div key={order.purchaseOrderId} className="border rounded p-3 border-[hsl(var(--border))]">
                    <div className="font-medium text-sm">{order.nombre}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Código: {order.codigo}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Fecha: {order.fechaEmision}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total: S/ {order.total.toFixed(2)}</div>
                    <div className="mt-3">
                      <button 
                        className="btn-primary w-full text-xs" 
                        onClick={() => handleCreateFromPurchaseOrder(order)}
                      >
                        Crear Factura
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Nueva Factura */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        title={modalTitle}
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn"
              onClick={handleCloseModal}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmitInvoice}
            >
              Guardar Factura
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {selectedPurchaseOrder && selectedPurchaseOrderDetails && (
            <div className="bg-[hsl(var(--muted))] p-4 rounded-lg">
              <div className="text-sm font-semibold mb-2">Orden de Compra Seleccionada</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                <div>Código: {selectedPurchaseOrderDetails.codigo}</div>
                <div>Proveedor: {selectedPurchaseOrderDetails.nombre}</div>
                <div>RUC: {selectedPurchaseOrderDetails.ruc}</div>
                <div>Dirección: {selectedPurchaseOrderDetails.direccion}</div>
                <div>Teléfono: {selectedPurchaseOrderDetails.telefono}</div>
                <div>Fecha: {selectedPurchaseOrderDetails.fechaEmision}</div>
                <div>Total: S/ {selectedPurchaseOrderDetails.total.toFixed(2)}</div>
                <div className="mt-2 pt-2 border-t border-[hsl(var(--border))]">
                  <div className="font-medium">Productos ({selectedPurchaseOrderDetails.products.length}):</div>
                  {selectedPurchaseOrderDetails.products.map((product, idx) => {
                    const productInfo = products.find(p => p.productId === product.productId);
                    return (
                      <div key={idx} className="mt-1">
                        • {productInfo?.productName || `Producto ${product.productId}`} - 
                        Cantidad: {product.cantidad} - 
                        Costo Unit: S/ {product.unitCost.toFixed(2)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
                value={invoiceForm.documentType}
                onChange={(e) => setInvoiceForm(prev => ({
                  ...prev,
                  documentType: e.target.value as "boleta" | "factura" | "boleta_electronica" | "factura_electronica",
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
                  value={invoiceForm.ruc}
                  onChange={(e) => setInvoiceForm(prev => ({
                    ...prev,
                    ruc: e.target.value,
                  }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Serie</div>
                <input
                  className="input"
                  placeholder="Serie"
                  value={invoiceForm.series}
                  onChange={(e) => setInvoiceForm(prev => ({
                    ...prev,
                    series: e.target.value,
                  }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Número</div>
                <input
                  className="input"
                  placeholder="Número de factura"
                  value={invoiceForm.number}
                  onChange={(e) => setInvoiceForm(prev => ({
                    ...prev,
                    number: e.target.value,
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
                  value={invoiceForm.igv || ""}
                  onChange={(e) => setInvoiceForm(prev => ({
                    ...prev,
                    igv: e.target.value === "" ? 0 : Number(e.target.value),
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
                  value={invoiceForm.total || ""}
                  onChange={(e) => setInvoiceForm(prev => ({
                    ...prev,
                    total: e.target.value === "" ? 0 : Number(e.target.value),
                  }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Fecha</div>
                <input
                  className="input"
                  type="date"
                  value={invoiceForm.date}
                  onChange={(e) => setInvoiceForm(prev => ({
                    ...prev,
                    date: e.target.value,
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

            {invoiceForm.products.length > 0 && (
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
                      {invoiceForm.products.map((product, idx) => (
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
                                setInvoiceForm(prev => ({
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
                                setInvoiceForm(prev => ({
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

            {invoiceForm.products.length === 0 && (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                No hay productos agregados. Haz clic en "Agregar producto" para comenzar.
              </div>
            )}

            {invoiceForm.products.length > 0 && (
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
                  {invoiceForm.file && (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Archivo cargado: {invoiceForm.file.name}
                      <button
                        type="button"
                        className="ml-2 text-red-600 hover:text-red-700"
                        onClick={() => {
                          setInvoiceForm(prev => ({
                            ...prev,
                            file: null,
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

      {/* Modal: Detalles de Factura */}
      <Modal
        open={openDetailsModal}
        onClose={() => {
          setOpenDetailsModal(false);
          setInvoiceDetails(null);
        }}
        title="Detalles de Factura"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn"
              onClick={() => {
                setOpenDetailsModal(false);
                setInvoiceDetails(null);
              }}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {loadingInvoiceDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[hsl(var(--muted-foreground))]">Cargando detalles...</div>
          </div>
        ) : !invoiceDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-600">Error al cargar los detalles de la factura</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información General */}
            <div className="space-y-4">
              <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
                Información General
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Código</div>
                  <div className="text-sm font-medium">{invoiceDetails.code || `${invoiceDetails.serie}-${invoiceDetails.numeroFactura}`}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Tipo de Documento</div>
                  <div className="text-sm">{invoiceDetails.documentTypeName}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Serie</div>
                  <div className="text-sm">{invoiceDetails.serie}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Número</div>
                  <div className="text-sm">{invoiceDetails.numeroFactura}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Fecha</div>
                  <div className="text-sm">{invoiceDetails.fecha}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Centro de Costo</div>
                  <div className="text-sm">{invoiceDetails.costCenterName || `ID: ${invoiceDetails.costCenterId}`}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Orden de Compra</div>
                  <div className="text-sm">{invoiceDetails.purchaseOrderId ? `OC-${invoiceDetails.purchaseOrderId}` : "Gasto adicional"}</div>
                </div>
              </div>
            </div>

            {/* Información del Proveedor */}
            <div className="space-y-4">
              <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
                Información del Proveedor
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">RUC</div>
                  <div className="text-sm font-medium">{invoiceDetails.ruc}</div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
                Productos ({invoiceDetails.items.length})
              </div>
              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[hsl(var(--accent))]">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))]">Producto</th>
                        <th className="px-4 py-3 text-right font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))]">Cantidad</th>
                        <th className="px-4 py-3 text-right font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))]">Precio Unitario</th>
                        <th className="px-4 py-3 text-right font-semibold text-[hsl(var(--accent-foreground))]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {invoiceDetails.items.map((item, idx) => {
                        const productInfo = products.find(p => p.productId === item.productId);
                        const itemTotal = item.cantidad * item.unitCost;
                        
                        return (
                          <tr key={idx} className="hover:bg-[hsl(var(--accent))]/30 transition-colors">
                            <td className="px-4 py-3 border-r border-[hsl(var(--border))]">
                              <div className="font-medium">{productInfo?.productName || `Producto ${item.productId}`}</div>
                              {productInfo?.sku && (
                                <div className="text-xs text-[hsl(var(--muted-foreground))]">SKU: {productInfo.sku}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right border-r border-[hsl(var(--border))] font-medium">
                              {item.cantidad}
                            </td>
                            <td className="px-4 py-3 text-right border-r border-[hsl(var(--border))]">
                              S/ {item.unitCost.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              S/ {itemTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-4">
              <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
                Totales
              </div>
              <div className="flex justify-end">
                <div className="text-right space-y-2 min-w-[250px]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">Subtotal:</span>
                    <span className="font-medium">S/ {(invoiceDetails.total - invoiceDetails.igv).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">IGV:</span>
                    <span className="font-medium">S/ {invoiceDetails.igv.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold border-t border-[hsl(var(--border))] pt-2">
                    <span>Total:</span>
                    <span>S/ {invoiceDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

