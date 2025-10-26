export interface Company {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
}
