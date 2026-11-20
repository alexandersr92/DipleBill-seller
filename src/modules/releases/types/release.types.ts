export interface IProductRelease {
  id: string;
  version: string;
  title: string;
  body: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IProductReleaseResponse {
  data: IProductRelease[];
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}
