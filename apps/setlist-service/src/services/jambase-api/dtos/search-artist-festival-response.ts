export class SearchArtistFestivalsResponseDto {
  events: Event[];
  pagination: Pagination;
  success: boolean;
}

class Pagination {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

class Event {
  name: string;
  identifier: string;
  image: string;
  startDate: string;
  endDate: string;
  location: Location;
  performer: Artist[];
}

class Location {
  name: string;
  image?: string;
  address: Address;
}

class Address {
  streetAddress: string;
  addressLocality: string;
  addressRegion: AddressInfo | Record<string, never>;
  addressCountry: AddressInfo;
  geo: Geo;
}

class AddressInfo {
  identifier: string;
  name: string;
  alternateName: string;
}

class Geo {
  latitude: number;
  longitude: number;
}

class Artist {
  name: string;
  identifier: string;
  image: string;
  genre: string[];
}
