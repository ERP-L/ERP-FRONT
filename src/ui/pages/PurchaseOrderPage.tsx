import { useState, useEffect, useMemo } from "react";
import { ApiService } from "../../core/api-service";
import type { BranchListItem, WarehouseListItem, ProductListItem, CostCenterResponse, PurchaseOrderListItem, PurchaseOrderDetail } from "../../core/api-types";
import type { WarehouseProductStockItem } from "../../core/auth-types";
import jsPDF from "jspdf";

type ProductAlert = {
  id: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  sku: string;
  productId: string;
};

// PurchaseOrder type is now PurchaseOrderListItem from API

type OrderLine = {
  id: string;
  item: string; // nombre del producto/servicio/activo
  itemId?: string; // ID del producto si es producto
  quantity: number;
  warehouseId?: string; // ID del almacén si es producto
  unitCost: number;
  total: number;
};

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh]">
        <div className="card">
          <div className="card-inner flex flex-col h-[85vh] max-h-[90vh] sm:max-h-[800px] overflow-hidden">
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

export default function PurchaseOrderPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>("");

  // Estados para datos de la API
  const [costCenters, setCostCenters] = useState<CostCenterResponse[]>([]);
  const [productAlerts, setProductAlerts] = useState<ProductAlert[]>([]);
  const [loadingCostCenters, setLoadingCostCenters] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Órdenes de compra desde la API (solo tipo PRODUCTO)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderListItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Cargar productos y almacenes
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseListItem[]>([]);

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

  // Cargar almacenes de la sucursal seleccionada
  useEffect(() => {
    if (!selectedBranchId) {
      setWarehouses([]);
      return;
    }

    (async () => {
      try {
        const result = await ApiService.getWarehousesByBranch(parseInt(selectedBranchId));
        if (result.ok) {
          setWarehouses(result.data);
        } else {
          console.error('Error loading warehouses:', result.error);
          setWarehouses([]);
        }
      } catch (error) {
        console.error('Error loading warehouses:', error);
        setWarehouses([]);
      }
    })();
  }, [selectedBranchId]);

  // Cargar alertas de stock basadas en productos de almacenes
  useEffect(() => {
    if (warehouses.length === 0 || products.length === 0) {
      setProductAlerts([]);
      return;
    }

    (async () => {
      setLoadingAlerts(true);
      try {
        const allWarehouseProducts: WarehouseProductStockItem[] = [];
        
        // Obtener productos de cada almacén
        for (const warehouse of warehouses) {
          const result = await ApiService.getWarehouseProducts(warehouse.warehouseId);
          if (result.ok) {
            allWarehouseProducts.push(...result.data);
          }
        }

        // Generar alertas: productos donde quantity < reorderLevel
        const alerts: ProductAlert[] = [];
        const processedProductIds = new Set<number>();

        for (const warehouseProduct of allWarehouseProducts) {
          // Evitar duplicados si un producto está en múltiples almacenes
          if (processedProductIds.has(warehouseProduct.productId)) {
            continue;
          }

          // Buscar el producto en la lista para obtener reorderLevel
          const product = products.find(p => p.productId === warehouseProduct.productId);
          if (!product) continue;

          // Verificar si necesita reorden
          if (warehouseProduct.quantity < product.reorderLevel) {
            alerts.push({
              id: `alert-${warehouseProduct.productId}`,
              productName: warehouseProduct.productName,
              currentStock: warehouseProduct.quantity,
              reorderLevel: product.reorderLevel,
              sku: warehouseProduct.sku,
              productId: String(warehouseProduct.productId),
            });
            processedProductIds.add(warehouseProduct.productId);
          }
        }

        setProductAlerts(alerts);
      } catch (error) {
        console.error('Error loading stock alerts:', error);
        setProductAlerts([]);
      } finally {
        setLoadingAlerts(false);
      }
    })();
  }, [warehouses, products]);

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

  // Modal crear orden
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<PurchaseOrderDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [createForm, setCreateForm] = useState({
    purchaseType: "producto" as "producto" | "servicio" | "activo",
    code: "",
    ruc: "",
    name: "",
    address: "",
    phone: "",
    emissionDate: new Date().toISOString().split("T")[0],
    lines: [{
      id: `line-${Date.now()}`,
      item: "",
      itemId: "",
      quantity: 0,
      warehouseId: "",
      unitCost: 0,
      total: 0,
    }] as OrderLine[],
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Generar código automático (solo para tipo producto)
  useEffect(() => {
    if (openCreateModal && !createForm.code) {
      const timestamp = Date.now().toString().slice(-6);
      setCreateForm(prev => ({ ...prev, code: `OC-P-${timestamp}` }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCreateModal]);

  // Filtrar órdenes
  const filteredOrders = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return purchaseOrders.filter(order =>
      order.codigo.toLowerCase().includes(t) ||
      order.nombre.toLowerCase().includes(t) ||
      order.status.toLowerCase().includes(t) ||
      order.purchaseType.toLowerCase().includes(t)
    );
  }, [purchaseOrders, searchTerm]);

  // Calcular totales del formulario
  const formTotals = useMemo(() => {
    const subtotal = createForm.lines.reduce((sum, line) => sum + line.total, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    return { subtotal, igv, total };
  }, [createForm.lines]);

  // Agregar línea a la tabla
  function handleAddLine() {
    setCreateForm(prev => ({
      ...prev,
      lines: [...prev.lines, {
        id: `line-${Date.now()}-${Math.random()}`,
        item: "",
        itemId: "",
        quantity: 0,
        warehouseId: "",
        unitCost: 0,
        total: 0,
      }],
    }));
  }

  // Eliminar línea
  function handleRemoveLine(lineId: string) {
    setCreateForm(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.id !== lineId),
    }));
  }

  // Actualizar línea
  function handleUpdateLine(lineId: string, field: keyof OrderLine, value: string | number) {
    setCreateForm(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id !== lineId) return line;
        
        const updated = { ...line, [field]: value };
        
        // Auto-calcular total si cambia cantidad o costo unitario
        if (field === "quantity" || field === "unitCost") {
          updated.total = (typeof updated.quantity === "number" ? updated.quantity : 0) * 
                         (typeof updated.unitCost === "number" ? updated.unitCost : 0);
        }
        
        // Auto-calcular cantidad o costo unitario si cambia el total
        if (field === "total") {
          const totalValue = typeof value === "number" ? value : 0;
          const quantity = typeof updated.quantity === "number" ? updated.quantity : 0;
          if (quantity > 0) {
            updated.unitCost = totalValue / quantity;
          }
        }
        
        return updated;
      }),
    }));
  }

  // Crear orden desde alerta
  function handleCreateFromAlert(alert: ProductAlert) {
    const product = products.find(p => String(p.productId) === alert.productId);
    if (!product) return;
    
    setCreateForm({
      purchaseType: "producto",
      code: "",
      ruc: "",
      name: "",
      address: "",
      phone: "",
      emissionDate: new Date().toISOString().split("T")[0],
      lines: [{
        id: `line-${Date.now()}`,
        item: product.productName,
        itemId: String(product.productId),
        quantity: alert.reorderLevel - alert.currentStock,
        warehouseId: warehouses.length > 0 ? String(warehouses[0].warehouseId) : "",
        unitCost: 0,
        total: 0,
      }],
    });
    setOpenCreateModal(true);
  }

  // Crear nueva orden
  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    
    // Validar que se haya seleccionado un centro de costo
    if (!selectedCostCenterId) {
      setCreateError("Debe seleccionar un centro de costo");
      return;
    }

    // Solo permitir crear órdenes de tipo PRODUCTO
    if (createForm.purchaseType !== "producto") {
      setCreateError("Solo se pueden crear órdenes de compra de tipo PRODUCTO");
      return;
    }

    if (!createForm.ruc || !createForm.name || !createForm.address || !createForm.phone) {
      setCreateError("RUC, Nombre, Dirección y Teléfono son campos requeridos");
      return;
    }

    if (createForm.lines.length === 0 || createForm.lines.some(line => !line.itemId || line.quantity <= 0)) {
      setCreateError("Debe agregar al menos un producto con cantidad válida");
      return;
    }

    if (createForm.lines.some(line => !line.warehouseId)) {
      setCreateError("Debe seleccionar un almacén para cada producto");
      return;
    }

    setCreateLoading(true);
    try {
      // Preparar productos para la API
      const products = createForm.lines
        .filter(line => line.itemId && line.warehouseId && line.quantity > 0)
        .map(line => ({
          productId: parseInt(line.itemId!),
          warehouseId: parseInt(line.warehouseId!),
          cantidad: line.quantity,
          unitCost: line.unitCost,
        }));

      // Crear la orden usando la API
      const result = await ApiService.createPurchaseOrder({
        costCenterId: parseInt(selectedCostCenterId),
        purchaseTypeId: 1, // 1 = PRODUCTO según el ejemplo
        codigo: createForm.code,
        ruc: createForm.ruc,
        nombre: createForm.name,
        direccion: createForm.address,
        telefono: createForm.phone,
        fechaEmision: createForm.emissionDate,
        products: products,
      });

      if (!result.ok) {
        setCreateError(result.error);
        return;
      }

      // Recargar órdenes
      if (selectedCostCenterId) {
        const ordersResult = await ApiService.getPurchaseOrders(parseInt(selectedCostCenterId), 1, 100);
        if (ordersResult.ok) {
          const productOrders = ordersResult.data.items.filter(order => 
            order.purchaseType.toUpperCase() === "PRODUCTO"
          );
          setPurchaseOrders(productOrders);
        }
      }

      setOpenCreateModal(false);
      setCreateForm({
        purchaseType: "producto",
        code: "",
        ruc: "",
        name: "",
        address: "",
        phone: "",
        emissionDate: new Date().toISOString().split("T")[0],
        lines: [{
          id: `line-${Date.now()}`,
          item: "",
          itemId: "",
          quantity: 0,
          warehouseId: "",
          unitCost: 0,
          total: 0,
        }],
      });
    } catch (error) {
      console.error('Error creating order:', error);
      setCreateError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setCreateLoading(false);
    }
  }

  // Descargar PDF
  function handleDownloadPDF() {
    if (!createForm.code || !createForm.name) {
      alert("Complete los datos de la orden antes de descargar el PDF");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Función helper para dibujar línea
    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      doc.setLineWidth(0.1);
      doc.line(x1, y1, x2, y2);
    };

    // ========== ENCABEZADO ==========
    // Título y número de orden (centro)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ORDEN DE COMPRA", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 6;
    doc.setFontSize(12);
    doc.text(`N° ${createForm.code}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 6;
    
    // Código de barras simulado (asteriscos)
    doc.setFontSize(10);
    doc.text(`*${createForm.code}*`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Línea separadora
    drawLine(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // ========== INFORMACIÓN DE LA ORDEN ==========
    const infoCol1X = margin;
    const infoCol2X = margin + 60;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Fila 1
    doc.text("Fecha de Emisión:", infoCol1X, yPosition);
    doc.setFont("helvetica", "bold");
    doc.text(createForm.emissionDate || "-", infoCol1X + 35, yPosition);
    
    doc.setFont("helvetica", "normal");
    doc.text("Tipo de Compra:", infoCol2X, yPosition);
    doc.setFont("helvetica", "bold");
    const purchaseTypeText = createForm.purchaseType === "producto" ? "Producto" : 
                             createForm.purchaseType === "servicio" ? "Servicio" : "Activo";
    doc.text(purchaseTypeText, infoCol2X + 30, yPosition);
    yPosition += 8;

    // Línea separadora
    drawLine(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // ========== INFORMACIÓN DEL PROVEEDOR ==========
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PROVEEDOR", margin, yPosition);
    yPosition += 6;

    const supplierCol1X = margin;
    const supplierCol2X = margin + 80;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("RUC:", supplierCol1X, yPosition);
    doc.setFont("helvetica", "bold");
    doc.text(createForm.ruc || "-", supplierCol1X + 15, yPosition);
    
    doc.setFont("helvetica", "normal");
    doc.text("Nombre:", supplierCol2X, yPosition);
    doc.setFont("helvetica", "bold");
    const nameLines = doc.splitTextToSize(createForm.name || "-", pageWidth - margin - supplierCol2X - 20);
    doc.text(nameLines, supplierCol2X + 18, yPosition);
    yPosition += nameLines.length * 4 + 2;

    doc.setFont("helvetica", "normal");
    doc.text("Teléfono:", supplierCol1X, yPosition);
    doc.setFont("helvetica", "bold");
    doc.text(createForm.phone || "-", supplierCol1X + 20, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    doc.text("Dirección:", supplierCol1X, yPosition);
    doc.setFont("helvetica", "bold");
    const addressLines = doc.splitTextToSize(createForm.address || "-", pageWidth - margin - supplierCol1X - 20);
    doc.text(addressLines, supplierCol1X + 20, yPosition);
    yPosition += addressLines.length * 4 + 2;

    // Mostrar almacén si hay líneas con almacén
    const selectedWarehouse = warehouses.find(w => createForm.lines.some(l => l.warehouseId === String(w.warehouseId)));
    if (selectedWarehouse) {
      doc.setFont("helvetica", "normal");
      doc.text("Almacén de Entrega:", supplierCol1X, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(selectedWarehouse.warehouseName, supplierCol1X + 35, yPosition);
      yPosition += 5;
    }
    yPosition += 5;

    // Línea separadora
    drawLine(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // ========== TABLA DE PRODUCTOS ==========
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    
    // Definir columnas según el tipo de compra
    const isProduct = createForm.purchaseType === "producto";
    const colHeaders = isProduct 
      ? ["Producto", "Cantidad", "Almacén", "Costo Unitario", "Total"]
      : [createForm.purchaseType === "servicio" ? "Servicio" : "Activo", "Cantidad", "Costo Unitario", "Total"];
    
    // Anchos fijos en mm para cada columna (proporcionados según la imagen)
    const cellPadding = 3;
    let colWidths: number[];
    if (isProduct) {
      // Producto: 40%, Cantidad: 12%, Almacén: 25%, Costo Unit: 12%, Total: 11%
      // Basado en ancho de página ~180mm, ajustamos proporcionalmente
      const availableWidth = pageWidth - (margin * 2);
      colWidths = [
        availableWidth * 0.40,  // Producto (más ancho)
        availableWidth * 0.12,  // Cantidad (estrecho)
        availableWidth * 0.25,  // Almacén (mediano)
        availableWidth * 0.12,  // Costo Unitario (estrecho)
        availableWidth * 0.11   // Total (estrecho)
      ];
    } else {
      // Item: 50%, Cantidad: 15%, Costo Unit: 17.5%, Total: 17.5%
      const availableWidth = pageWidth - (margin * 2);
      colWidths = [
        availableWidth * 0.50,  // Item
        availableWidth * 0.15,  // Cantidad
        availableWidth * 0.175, // Costo Unitario
        availableWidth * 0.175  // Total
      ];
    }
    
    // Calcular ancho total de la tabla
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    
    let xPos = margin;
    const headerHeight = 8;
    
    // Dibujar fondo de header
    doc.setFillColor(220, 220, 220);
    doc.rect(xPos, yPosition - 5, tableWidth, headerHeight, "F");
    
    // Dibujar headers
    colHeaders.forEach((header, idx) => {
      doc.setDrawColor(0, 0, 0);
      doc.rect(xPos, yPosition - 5, colWidths[idx], headerHeight);
      doc.setFontSize(7);
      const maxWidth = colWidths[idx] - (cellPadding * 2);
      const headerLines = doc.splitTextToSize(header, maxWidth);
      doc.text(headerLines, xPos + cellPadding, yPosition, { align: "left" });
      xPos += colWidths[idx];
    });
    yPosition += headerHeight;

    // Filas de productos
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    
    createForm.lines.forEach((line) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
        // Redibujar headers
        xPos = margin;
        doc.setFont("helvetica", "bold");
        doc.setFillColor(220, 220, 220);
        doc.rect(xPos, yPosition - 5, tableWidth, headerHeight, "F");
        colHeaders.forEach((header, idx) => {
          doc.setDrawColor(0, 0, 0);
          doc.rect(xPos, yPosition - 5, colWidths[idx], headerHeight);
          doc.setFontSize(7);
          const maxWidth = colWidths[idx] - (cellPadding * 2);
          const headerLines = doc.splitTextToSize(header, maxWidth);
          doc.text(headerLines, xPos + cellPadding, yPosition, { align: "left" });
          xPos += colWidths[idx];
        });
        yPosition += headerHeight;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
      }

      xPos = margin;
      const baseRowHeight = 8;
      let maxRowHeight = baseRowHeight;
      
      // Item (Producto/Servicio/Activo)
      let itemText = line.item || "-";
      if (isProduct && line.itemId) {
        const product = products.find(p => String(p.productId) === line.itemId);
        if (product) {
          itemText = `${product.productName} (${product.sku})`;
        }
      }
      const itemMaxWidth = colWidths[0] - (cellPadding * 2);
      const itemLines = doc.splitTextToSize(itemText, itemMaxWidth);
      const itemHeight = Math.max(baseRowHeight, itemLines.length * 3.5);
      maxRowHeight = Math.max(maxRowHeight, itemHeight);
      
      // Cantidad
      const qtyText = String(line.quantity || 0);
      const qtyMaxWidth = colWidths[1] - (cellPadding * 2);
      const qtyLines = doc.splitTextToSize(qtyText, qtyMaxWidth);
      const qtyHeight = Math.max(baseRowHeight, qtyLines.length * 3.5);
      maxRowHeight = Math.max(maxRowHeight, qtyHeight);
      
      // Almacén (solo si es producto)
      if (isProduct) {
        let warehouseText = "-";
        if (line.warehouseId) {
          const warehouse = warehouses.find(w => String(w.warehouseId) === line.warehouseId);
          warehouseText = warehouse?.warehouseName || "-";
        }
        const warehouseMaxWidth = colWidths[2] - (cellPadding * 2);
        const warehouseLines = doc.splitTextToSize(warehouseText, warehouseMaxWidth);
        const warehouseHeight = Math.max(baseRowHeight, warehouseLines.length * 3.5);
        maxRowHeight = Math.max(maxRowHeight, warehouseHeight);
      }
      
      // Costo Unitario
      const costText = `S/ ${(line.unitCost || 0).toFixed(2)}`;
      const costMaxWidth = colWidths[isProduct ? 3 : 2] - (cellPadding * 2);
      const costLines = doc.splitTextToSize(costText, costMaxWidth);
      const costHeight = Math.max(baseRowHeight, costLines.length * 3.5);
      maxRowHeight = Math.max(maxRowHeight, costHeight);
      
      // Total
      const totalText = `S/ ${(line.total || 0).toFixed(2)}`;
      const totalMaxWidth = colWidths[isProduct ? 4 : 3] - (cellPadding * 2);
      const totalLines = doc.splitTextToSize(totalText, totalMaxWidth);
      const totalHeight = Math.max(baseRowHeight, totalLines.length * 3.5);
      maxRowHeight = Math.max(maxRowHeight, totalHeight);
      
      const rowHeight = maxRowHeight;
      
      // Dibujar todas las celdas de la fila
      xPos = margin;
      
      // Producto/Servicio/Activo (izquierda)
      doc.rect(xPos, yPosition - 5, colWidths[0], rowHeight);
      doc.text(itemLines, xPos + cellPadding, yPosition, { align: "left" });
      xPos += colWidths[0];

      // Cantidad (derecha)
      doc.rect(xPos, yPosition - 5, colWidths[1], rowHeight);
      doc.text(qtyLines, xPos + colWidths[1] - cellPadding, yPosition, { align: "right" });
      xPos += colWidths[1];

      // Almacén (solo si es producto) (izquierda)
      if (isProduct) {
        let warehouseText = "-";
        if (line.warehouseId) {
          const warehouse = warehouses.find(w => String(w.warehouseId) === line.warehouseId);
          warehouseText = warehouse?.warehouseName || "-";
        }
        const warehouseMaxWidth = colWidths[2] - (cellPadding * 2);
        const warehouseLines = doc.splitTextToSize(warehouseText, warehouseMaxWidth);
        doc.rect(xPos, yPosition - 5, colWidths[2], rowHeight);
        doc.text(warehouseLines, xPos + cellPadding, yPosition, { align: "left" });
        xPos += colWidths[2];
      }

      // Costo Unitario (derecha)
      doc.rect(xPos, yPosition - 5, colWidths[isProduct ? 3 : 2], rowHeight);
      doc.text(costLines, xPos + colWidths[isProduct ? 3 : 2] - cellPadding, yPosition, { align: "right" });
      xPos += colWidths[isProduct ? 3 : 2];

      // Total (derecha)
      doc.rect(xPos, yPosition - 5, colWidths[isProduct ? 4 : 3], rowHeight);
      doc.text(totalLines, xPos + colWidths[isProduct ? 4 : 3] - cellPadding, yPosition, { align: "right" });

      yPosition += rowHeight;
    });

    yPosition += 5;

    // ========== TOTALES ==========
    const totalsX = pageWidth - margin - 50;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("SUB TOTAL:", totalsX, yPosition, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`S/ ${formTotals.subtotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: "right" });
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.text("IMPUESTO:", totalsX, yPosition, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`S/ ${formTotals.igv.toFixed(2)}`, pageWidth - margin, yPosition, { align: "right" });
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.text("TOTAL:", totalsX, yPosition, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`S/ ${formTotals.total.toFixed(2)}`, pageWidth - margin, yPosition, { align: "right" });
    yPosition += 10;

    // ========== OBSERVACIONES ==========
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones:", margin, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "normal");
    doc.text("-", margin + 5, yPosition);
    yPosition += 10;

    // Descargar PDF
    doc.save(`Orden_Compra_${createForm.code}.pdf`);
  }

  return (
    <>
      <style>{`
        .table-scroll {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
        }
        
        .table-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .table-scroll::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        
        .table-scroll::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 10px;
          transition: background 0.2s ease;
        }
        
        .table-scroll::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Orden de Compra</h1>
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
            <option value="">Todos los centros de costo</option>
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
      </div>

      {/* Layout: tabla central + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">
        {/* Sección central: Tabla */}
        <div className="flex flex-col min-h-0">
          {/* Search y botón crear */}
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
            <button 
              className="btn-primary w-full sm:w-auto whitespace-nowrap" 
              onClick={() => {
                setOpenCreateModal(true);
              }}
            >
              Nueva Orden
            </button>
          </div>

          {/* Tabla de órdenes */}
          <div className="card overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="card-inner flex-1 flex flex-col min-h-0 p-0">
              <div className="overflow-y-auto overflow-x-auto flex-1 table-scroll">
                <div className="p-4 sm:p-6">
                  <div className="inline-block min-w-full align-middle">
                    <table className="w-full text-sm min-w-[1000px]">
                      <thead className="bg-[hsl(var(--accent))] sticky top-0 z-20 shadow-md">
                        <tr className="text-left">
                          <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))] whitespace-nowrap">Código</th>
                          <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))] min-w-[200px]">Proveedor</th>
                          <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))] whitespace-nowrap">Fecha</th>
                          <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))] whitespace-nowrap">Estado</th>
                          <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))] whitespace-nowrap">Tipo de Compra</th>
                          <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))] whitespace-nowrap">Total</th>
                          <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium bg-[hsl(var(--accent))] whitespace-nowrap">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingOrders ? (
                          <tr>
                            <td className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={7}>
                              Cargando...
                            </td>
                          </tr>
                        ) : !selectedCostCenterId ? (
                          <tr>
                            <td className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={7}>
                              Seleccione un centro de costo para ver las órdenes
                            </td>
                          </tr>
                        ) : filteredOrders.length === 0 ? (
                          <tr>
                            <td className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={7}>
                              Sin datos
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => {
                            const statusLower = order.status.toLowerCase();
                            const statusColor = statusLower === "completado" || statusLower === "completada"
                              ? "bg-green-100 text-green-800"
                              : statusLower === "pendiente"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800";
                            
                            const statusText = statusLower === "completado" || statusLower === "completada"
                              ? "Completado"
                              : statusLower === "pendiente"
                              ? "Pendiente"
                              : "Cancelado";

                            return (
                              <tr key={order.purchaseOrderId} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                                <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium">
                                  {order.codigo}
                                </td>
                                <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                                  {order.nombre}
                                </td>
                                <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                                  {order.fechaEmision}
                                </td>
                                <td className="px-4 py-3 border-b border-[hsl(var(--border))]">
                                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                                    {statusText}
                                  </span>
                                </td>
                                <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                                  {order.purchaseType.charAt(0).toUpperCase() + order.purchaseType.slice(1).toLowerCase()}
                                </td>
                                <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium">
                                  S/ {order.total.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 border-b border-[hsl(var(--border))]">
                                  <button 
                                    className="btn text-xs"
                                    onClick={async () => {
                                      setLoadingDetails(true);
                                      setOpenDetailsModal(true);
                                      try {
                                        const detailsResult = await ApiService.getPurchaseOrderDetails(order.purchaseOrderId);
                                        if (detailsResult.ok) {
                                          setOrderDetails(detailsResult.data);
                                        } else {
                                          console.error('Error loading order details:', detailsResult.error);
                                          setOrderDetails(null);
                                        }
                                      } catch (error) {
                                        console.error('Error loading order details:', error);
                                        setOrderDetails(null);
                                      } finally {
                                        setLoadingDetails(false);
                                      }
                                    }}
                                  >
                                    Ver detalles
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
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
            <div className="flex-1 overflow-y-auto space-y-3 px-6 pb-6 table-scroll">
              {!selectedBranchId ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  Seleccione una sucursal para ver alertas
                </div>
              ) : loadingAlerts ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  Cargando alertas...
                </div>
              ) : productAlerts.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  No hay alertas de stock
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
                    <div className="mt-3">
                      <button 
                        className="btn-primary w-full text-xs" 
                        onClick={() => handleCreateFromAlert(alert)}
                      >
                        Crear Orden
                      </button>
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
        open={openCreateModal}
        onClose={() => {
          setOpenCreateModal(false);
          setCreateForm({
            purchaseType: "producto",
            code: "",
            ruc: "",
            name: "",
            address: "",
            phone: "",
            emissionDate: new Date().toISOString().split("T")[0],
            lines: [{
              id: `line-${Date.now()}`,
              item: "",
              itemId: "",
              quantity: 0,
              warehouseId: "",
              unitCost: 0,
              total: 0,
            }],
          });
          setCreateError(null);
        }}
        title="Nueva Orden de Compra"
        footer={
          <div className="flex justify-between items-center">
            <button
              className="btn"
              onClick={handleDownloadPDF}
            >
              Descargar PDF
            </button>
            <div className="flex gap-2">
              <button
                className="btn"
                onClick={() => {
                  setOpenCreateModal(false);
                  setCreateForm({
                    purchaseType: "producto",
                    code: "",
                    ruc: "",
                    name: "",
                    address: "",
                    phone: "",
                    emissionDate: new Date().toISOString().split("T")[0],
                    lines: [{
                      id: `line-${Date.now()}`,
                      item: "",
                      itemId: "",
                      quantity: 0,
                      warehouseId: "",
                      unitCost: 0,
                      total: 0,
                  }],
                });
                setCreateError(null);
              }}
            >
              Cancelar
            </button>
              <button
                className="btn-primary"
                onClick={handleCreateOrder}
                disabled={createLoading}
              >
                {createLoading ? "Creando..." : "Guardar Orden"}
              </button>
            </div>
          </div>
        }
      >
        <form className="space-y-6" onSubmit={handleCreateOrder}>
          {createError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
              {createError}
            </div>
          )}

          {/* Sección 1: Tipo de Compra */}
          <div className="space-y-4">
            <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
              Tipo de Compra
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Tipo de Compra
                </label>
                <select
                  className="select bg-[hsl(var(--muted))] cursor-not-allowed"
                  value="producto"
                  disabled
                >
                  <option value="producto">Producto</option>
                </select>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Solo se pueden crear órdenes de compra de tipo PRODUCTO
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Código
                </label>
                <input
                  className="input bg-[hsl(var(--muted))] cursor-not-allowed"
                  value={createForm.code}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Detalles de Compra */}
          <div className="space-y-4">
            <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
              Detalles de Compra
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  RUC <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={createForm.ruc}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, ruc: e.target.value }))}
                  required
                  placeholder="20123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={createForm.address}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                  required
                  placeholder="Dirección completa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="+51 987 654 321"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Fecha de Emisión
                </label>
                <input
                  className="input"
                  type="date"
                  value={createForm.emissionDate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, emissionDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Detalles de Producto/Servicio/Activo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2 flex-1">
                Detalles de {createForm.purchaseType === "producto" ? "Producto" : createForm.purchaseType === "servicio" ? "Servicio" : "Activo"}
              </div>
              <button
                type="button"
                className="btn text-xs ml-4"
                onClick={handleAddLine}
              >
                + Agregar Fila
              </button>
            </div>

            <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[hsl(var(--accent))]">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">
                        {createForm.purchaseType === "producto" ? "Producto" : createForm.purchaseType === "servicio" ? "Servicio" : "Activo"}
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Cantidad</th>
                      {createForm.purchaseType === "producto" && (
                        <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Almacén</th>
                      )}
                      <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Costo Unitario</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))] whitespace-nowrap">Total</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-[hsl(var(--accent-foreground))] whitespace-nowrap">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {createForm.lines.map((line) => (
                      <tr key={line.id} className="hover:bg-[hsl(var(--accent))]/30 transition-colors">
                        <td className="p-0 border-r border-[hsl(var(--border))]">
                          {createForm.purchaseType === "producto" ? (
                            <select
                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                              value={line.itemId || ""}
                              onChange={(e) => {
                                const product = products.find(p => String(p.productId) === e.target.value);
                                handleUpdateLine(line.id, "itemId", e.target.value);
                                handleUpdateLine(line.id, "item", product?.productName || "");
                              }}
                            >
                              <option value="">Seleccione producto</option>
                              {products.map(p => (
                                <option key={p.productId} value={String(p.productId)}>
                                  {p.productName} ({p.sku})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                              placeholder={`Nombre del ${createForm.purchaseType}`}
                              value={line.item}
                              onChange={(e) => handleUpdateLine(line.id, "item", e.target.value)}
                            />
                          )}
                        </td>
                        <td className="p-0 border-r border-[hsl(var(--border))]">
                          <input
                            className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                            type="number"
                            placeholder="0"
                            min="0"
                            step="1"
                            value={line.quantity || ""}
                            onChange={(e) => {
                              const qty = e.target.value === "" ? 0 : Number(e.target.value);
                              handleUpdateLine(line.id, "quantity", qty);
                            }}
                          />
                        </td>
                        {createForm.purchaseType === "producto" && (
                          <td className="p-0 border-r border-[hsl(var(--border))]">
                            <select
                              className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                              value={line.warehouseId || ""}
                              onChange={(e) => handleUpdateLine(line.id, "warehouseId", e.target.value)}
                            >
                              <option value="">Seleccione almacén</option>
                              {warehouses.map(w => (
                                <option key={w.warehouseId} value={String(w.warehouseId)}>
                                  {w.warehouseName}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td className="p-0 border-r border-[hsl(var(--border))]">
                          <input
                            className="input border-0 rounded-none w-full focus:ring-2 focus:ring-[hsl(var(--primary))] focus:outline-none px-3 py-2"
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={line.unitCost || ""}
                            onChange={(e) => {
                              const cost = e.target.value === "" ? 0 : Number(e.target.value);
                              handleUpdateLine(line.id, "unitCost", cost);
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
                            value={line.total || ""}
                            onChange={(e) => {
                              const total = e.target.value === "" ? 0 : Number(e.target.value);
                              handleUpdateLine(line.id, "total", total);
                            }}
                          />
                        </td>
                        <td className="p-0">
                          <button
                            type="button"
                            className="w-full py-2 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium transition-colors rounded"
                            onClick={() => handleRemoveLine(line.id)}
                            disabled={createForm.lines.length === 1}
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

            {/* Totales */}
            <div className="flex justify-end">
              <div className="text-right space-y-1 min-w-[200px]">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Subtotal: S/ {formTotals.subtotal.toFixed(2)}
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  IGV (18%): S/ {formTotals.igv.toFixed(2)}
                </div>
                <div className="text-sm font-semibold border-t border-[hsl(var(--border))] pt-1">
                  Total: S/ {formTotals.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Detalles de Orden de Compra */}
      <Modal
        open={openDetailsModal}
        onClose={() => {
          setOpenDetailsModal(false);
          setOrderDetails(null);
        }}
        title="Detalles de Orden de Compra"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn"
              onClick={() => {
                setOpenDetailsModal(false);
                setOrderDetails(null);
              }}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {loadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[hsl(var(--muted-foreground))]">Cargando detalles...</div>
          </div>
        ) : !orderDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-600">Error al cargar los detalles de la orden</div>
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
                  <div className="text-sm font-medium">{orderDetails.codigo}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Estado</div>
                  <div>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      orderDetails.status.toLowerCase() === "completado" || orderDetails.status.toLowerCase() === "completada"
                        ? "bg-green-100 text-green-800"
                        : orderDetails.status.toLowerCase() === "pendiente"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {orderDetails.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Fecha de Emisión</div>
                  <div className="text-sm">{orderDetails.fechaEmision}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Tipo de Compra</div>
                  <div className="text-sm">{orderDetails.purchaseType}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Centro de Costo</div>
                  <div className="text-sm">{orderDetails.costCenterName || `ID: ${orderDetails.costCenterId}`}</div>
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
                  <div className="text-sm font-medium">{orderDetails.ruc}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Nombre</div>
                  <div className="text-sm font-medium">{orderDetails.nombre}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Dirección</div>
                  <div className="text-sm">{orderDetails.direccion || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Teléfono</div>
                  <div className="text-sm">{orderDetails.telefono || "-"}</div>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="space-y-4">
              <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
                Productos ({orderDetails.products.length})
              </div>
              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[hsl(var(--accent))]">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))]">Producto</th>
                        <th className="px-4 py-3 text-left font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))]">Almacén</th>
                        <th className="px-4 py-3 text-right font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))]">Cantidad</th>
                        <th className="px-4 py-3 text-right font-semibold text-[hsl(var(--accent-foreground))] border-r border-[hsl(var(--border))]">Costo Unitario</th>
                        <th className="px-4 py-3 text-right font-semibold text-[hsl(var(--accent-foreground))]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {orderDetails.products.map((product, idx) => {
                        const productInfo = products.find(p => p.productId === product.productId);
                        const warehouse = warehouses.find(w => w.warehouseId === product.warehouseId);
                        const productTotal = product.cantidad * product.unitCost;
                        
                        return (
                          <tr key={idx} className="hover:bg-[hsl(var(--accent))]/30 transition-colors">
                            <td className="px-4 py-3 border-r border-[hsl(var(--border))]">
                              <div className="font-medium">{productInfo?.productName || `Producto ${product.productId}`}</div>
                              {productInfo?.sku && (
                                <div className="text-xs text-[hsl(var(--muted-foreground))]">SKU: {productInfo.sku}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 border-r border-[hsl(var(--border))]">
                              {warehouse ? (
                                <div>
                                  <div className="text-sm">{warehouse.warehouseName}</div>
                                  <div className="text-xs text-[hsl(var(--muted-foreground))]">{warehouse.warehouseCode}</div>
                                </div>
                              ) : (
                                <span className="text-[hsl(var(--muted-foreground))]">ID: {product.warehouseId}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right border-r border-[hsl(var(--border))] font-medium">
                              {product.cantidad}
                            </td>
                            <td className="px-4 py-3 text-right border-r border-[hsl(var(--border))]">
                              S/ {product.unitCost.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              S/ {productTotal.toFixed(2)}
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
                    <span className="font-medium">S/ {(orderDetails.total / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">IGV (18%):</span>
                    <span className="font-medium">S/ {(orderDetails.total - (orderDetails.total / 1.18)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold border-t border-[hsl(var(--border))] pt-2">
                    <span>Total:</span>
                    <span>S/ {orderDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </>
  );
}
