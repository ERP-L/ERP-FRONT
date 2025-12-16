import { useState, useMemo, useEffect } from "react";
import { ApiService } from "../../core/api-service";
import type { SupplierListItem, SupplierProduct, ProductListItem } from "../../core/api-types";

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh]">
        <div className="card">
          <div className="card-inner flex flex-col h-[85vh] max-h-[90vh] sm:max-h-[600px] overflow-hidden">
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

type SupplierWithProducts = SupplierListItem & {
  relatedProducts: SupplierProduct[];
};

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierWithProducts[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Modal crear proveedor
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    taxNumber: "",
    supplierName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    relatedProductIds: [] as number[],
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Cargar proveedores y productos al montar
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setLoadingError(null);
    try {
      // Cargar productos disponibles
      const productsResult = await ApiService.getProducts();
      if (productsResult.ok) {
        setAvailableProducts(productsResult.data);
      } else {
        setLoadingError(productsResult.error);
      }

      // Cargar proveedores
      const suppliersResult = await ApiService.getSuppliers(true, 1, 100);
      if (suppliersResult.ok) {
        // Cargar productos relacionados para cada proveedor
        const suppliersWithProducts = await Promise.all(
          suppliersResult.data.items.map(async (supplier) => {
            const productsResult = await ApiService.getSupplierProducts(supplier.supplierId);
            return {
              ...supplier,
              relatedProducts: productsResult.ok ? productsResult.data : [],
            };
          })
        );
        setSuppliers(suppliersWithProducts);
      } else {
        setLoadingError(suppliersResult.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadingError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  // Filtrar proveedores
  const filteredSuppliers = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.taxNumber.toLowerCase().includes(t) ||
      supplier.supplierName.toLowerCase().includes(t) ||
      supplier.contactName.toLowerCase().includes(t) ||
      supplier.phone.toLowerCase().includes(t) ||
      supplier.email.toLowerCase().includes(t) ||
      supplier.address.toLowerCase().includes(t) ||
      supplier.notes.toLowerCase().includes(t) ||
      supplier.relatedProducts.some(product =>
        product.productName.toLowerCase().includes(t) ||
        product.sku.toLowerCase().includes(t)
      )
    );
  }, [suppliers, searchTerm]);

  // Crear nuevo proveedor
  async function handleCreateSupplier(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    
    // Validar campos requeridos
    if (!createForm.taxNumber || !createForm.supplierName || !createForm.contactName || !createForm.phone || !createForm.address) {
      setCreateError("RUC, Nombre, Contacto, Teléfono y Dirección son campos requeridos");
      return;
    }

    // Validar que el RUC tenga 11 dígitos
    if (createForm.taxNumber.length !== 11 || !/^\d+$/.test(createForm.taxNumber)) {
      setCreateError("El RUC debe tener exactamente 11 dígitos");
      return;
    }

    setCreateLoading(true);
    try {
      // Crear el proveedor
      const createResult = await ApiService.createSupplier({
        supplierName: createForm.supplierName,
        taxNumber: createForm.taxNumber,
        contactName: createForm.contactName,
        phone: createForm.phone,
        email: createForm.email || "",
        address: createForm.address,
        notes: createForm.notes || "",
      });

      if (!createResult.ok) {
        setCreateError(createResult.error);
        return;
      }

      // Si hay productos seleccionados, asignarlos al proveedor
      if (createForm.relatedProductIds.length > 0 && createResult.data) {
        const assignResult = await ApiService.assignProductsToSupplier(
          createResult.data.supplierId,
          createForm.relatedProductIds
        );
        
        if (!assignResult.ok) {
          setCreateError(assignResult.error);
          return;
        }
      }

      // Recargar datos
      await loadData();
      
      setOpenCreateModal(false);
      setCreateForm({
        taxNumber: "",
        supplierName: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        relatedProductIds: [],
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      setCreateError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setCreateLoading(false);
    }
  }

  // Toggle producto relacionado
  function toggleRelatedProduct(productId: number) {
    setCreateForm(prev => ({
      ...prev,
      relatedProductIds: prev.relatedProductIds.includes(productId)
        ? prev.relatedProductIds.filter(id => id !== productId)
        : [...prev.relatedProductIds, productId],
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Proveedores</h1>
        <button 
          className="btn-primary w-full sm:w-auto whitespace-nowrap" 
          onClick={() => setOpenCreateModal(true)}
        >
          Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          className="input flex-1 min-w-0"
          placeholder="Buscar proveedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn w-full sm:w-auto whitespace-nowrap">
          Filtrar
        </button>
      </div>

      {/* Tabla de Proveedores */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
            Cargando...
          </div>
        ) : loadingError ? (
          <div className="px-4 py-8 text-center text-red-600">
            {loadingError}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-[hsl(var(--accent))]">
                <tr className="text-left">
                  <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">RUC</th>
                  <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium min-w-[200px]">Nombre</th>
                  <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">Contacto</th>
                  <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">Teléfono</th>
                  <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium min-w-[200px]">Dirección</th>
                  <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium min-w-[200px]">Notas</th>
                  <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium min-w-[250px]">Productos Relacionados</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={7}>
                      Sin datos
                    </td>
                  </tr>
                )}
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.supplierId} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                    <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium">
                      {supplier.taxNumber}
                    </td>
                    <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                      {supplier.supplierName}
                    </td>
                    <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                      {supplier.contactName}
                    </td>
                    <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                      {supplier.phone}
                    </td>
                    <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                      {supplier.address}
                    </td>
                    <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                      <div className="max-w-[200px] line-clamp-2" title={supplier.notes}>
                        {supplier.notes || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-[hsl(var(--border))]">
                      {supplier.relatedProducts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {supplier.relatedProducts.map((product) => (
                            <span
                              key={product.productId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                              title={`${product.productName} (${product.sku})`}
                            >
                              {product.productName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear Proveedor */}
      <Modal
        open={openCreateModal}
        onClose={() => {
          setOpenCreateModal(false);
          setCreateForm({
            taxNumber: "",
            supplierName: "",
            contactName: "",
            phone: "",
            email: "",
            address: "",
            notes: "",
            relatedProductIds: [],
          });
          setCreateError(null);
        }}
        title="Nuevo Proveedor"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn"
              onClick={() => {
                setOpenCreateModal(false);
                setCreateForm({
                  taxNumber: "",
                  supplierName: "",
                  contactName: "",
                  phone: "",
                  email: "",
                  address: "",
                  notes: "",
                  relatedProductIds: [],
                });
                setCreateError(null);
              }}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateSupplier}
              disabled={createLoading}
            >
              {createLoading ? "Creando..." : "Crear"}
            </button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateSupplier}>
          {createError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
              {createError}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                RUC <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={createForm.taxNumber}
                onChange={(e) => setCreateForm(prev => ({ ...prev, taxNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                required
                placeholder="20123456789"
                maxLength={11}
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Debe tener 11 dígitos</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Nombre del Proveedor <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={createForm.supplierName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, supplierName: e.target.value }))}
                required
                placeholder="Nombre del proveedor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Nombre de Contacto <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={createForm.contactName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, contactName: e.target.value }))}
                required
                placeholder="Nombre del contacto"
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
                Email
              </label>
              <input
                className="input"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
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
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Notas
            </label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={createForm.notes}
              onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas adicionales sobre el proveedor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Productos Relacionados
            </label>
            <div className="border border-[hsl(var(--border))] rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {availableProducts.length > 0 ? (
                  availableProducts.map(product => (
                    <label
                      key={product.productId}
                      className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--muted))]/30 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.relatedProductIds.includes(product.productId)}
                        onChange={() => toggleRelatedProduct(product.productId)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {product.productName} <span className="text-[hsl(var(--muted-foreground))]">({product.sku})</span>
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                    No hay productos disponibles
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
