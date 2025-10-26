export interface Warehouse {
  id: string;
  branchId: string;
  name: string;
  code: string;
}

export interface WarehouseExtended {
  branchId: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}
