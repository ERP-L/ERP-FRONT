export interface Product {
  id: string;
  SKU?: string;
  ProductName: string;
  CategoryID?: string;
  UOMID?: string;
  IsSerialized: boolean;
  IsBatchControlled: boolean;
  ReorderLevel?: number;
  LeadTimeDays?: number;
  Weight?: number;
  Volume?: number;
}
