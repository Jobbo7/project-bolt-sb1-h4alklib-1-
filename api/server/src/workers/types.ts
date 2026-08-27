export interface MarketplaceListing {
  title: string;
  price: string;
  location: string;
  imageUrl: string;
  sourceUrl: string;
}

export interface SearchParams {
  searchString: string;
  location: string;
}

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}
