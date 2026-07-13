export interface Tenant {
  id: string;
  slug: string;
  labName: string;
  university: string | null;
  logoUrl: string | null;
  theme: string;
  primaryColor: string | null;
  customDomain: string | null;
  reviewEnabled: boolean;
  createdAt: Date;
}
