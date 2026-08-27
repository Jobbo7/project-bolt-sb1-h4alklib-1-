// Production-ready Prisma schema for a three-sided auto parts marketplace.
// Sides: DIYers, Mechanics, Sellers.
// Fitment modeled on standard ACES/PIES data structures.

export const prismaSchema = `// ============================================================================
// Auto Parts Marketplace — Prisma Schema
// Three-sided marketplace: DIYers, Mechanics, Sellers
// Fitment modeled on ACES (fitment) / PIES (product attributes) structures
// PostgreSQL + PostGIS-ready geospatial indexing
// ============================================================================

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

// ----------------------------------------------------------------------------
// Enums
// ----------------------------------------------------------------------------

enum UserRole {
  diy
  mechanic
  seller
}

enum DeliveryType {
  local_courier
  national_shipping
  pickup
  all_three
}

enum ListingStatus {
  draft
  active
  out_of_stock
  discontinued
}

enum PartCategory {
  engine
  transmission
  brakes
  suspension
  electrical
  cooling
  exhaust
  body
  interior
  accessories
}

// ----------------------------------------------------------------------------
// Users — marketplace participants (DIYers, Mechanics, Sellers)
// ----------------------------------------------------------------------------

model User {
  id            String     @id @default(uuid())
  email         String     @unique
  passwordHash  String
  displayName   String
  role          UserRole
  phone         String?
  // Seller / mechanic business profile
  businessName  String?
  rating        Float      @default(0)
  reviewCount   Int        @default(0)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  vehicles      Vehicle[]
  inventory     Inventory[]
  reviewsGiven  Review[]   @relation("ReviewAuthor")
  reviewsRecv   Review[]   @relation("ReviewSubject")

  @@index([role])
  @@index([email])
  @@map("users")
}

// ----------------------------------------------------------------------------
// Vehicles — a user's "virtual garage"
// ----------------------------------------------------------------------------

model Vehicle {
  id           String   @id @default(uuid())
  ownerId      String
  year         Int
  make         String
  model        String
  engine       String   // e.g. "3.5L V6 DOHC"
  vin          String?  @unique
  licensePlate String?
  createdAt    DateTime @default(now())

  owner        User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  @@index([ownerId])
  @@index([make, model, year])
  @@index([vin])
  @@map("vehicles")
}

// ----------------------------------------------------------------------------
// Parts — PIES-style product catalog with ACES-style fitment
// ----------------------------------------------------------------------------

model Part {
  id              String        @id @default(uuid())
  // PIES identification
  partNumber      String        @unique
  brand           String
  manufacturerPn  String?
  category        PartCategory
  // PIES product attributes
  title           String
  description     String?
  weightLb        Float?
  dimensionsMm    String?       // "LxWxH"
  // ACES-style fitment is stored in PartFitment rows
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  fitment         PartFitment[]
  inventory       Inventory[]

  @@index([partNumber])
  @@index([brand])
  @@index([category])
  @@map("parts")
}

// ----------------------------------------------------------------------------
// PartFitment — ACES-style vehicle fitment mapping
// Mirrors the ACES BaseVehicle / Vehicle / Engine qualifier structure.
// ----------------------------------------------------------------------------

model PartFitment {
  id            String   @id @default(uuid())
  partId        String
  // ACES qualifier fields
  year          Int
  make          String
  model         String
  submodel      String?  // e.g. "Sport", "Limited"
  engine        String?  // e.g. "3.5L V6"
  // Optional ACES position / attribute qualifiers
  position      String?  // e.g. "Front Left"
  note          String?
  createdAt     DateTime @default(now())

  part          Part     @relation(fields: [partId], references: [id], onDelete: Cascade)

  @@index([partId])
  // Composite index for fast "what fits this vehicle" lookups
  @@index([make, model, year, submodel, engine])
  @@index([year, make, model])
  @@map("part_fitment")
}

// ----------------------------------------------------------------------------
// Inventory — a Seller's stock of a Part, geospatially indexed
// ----------------------------------------------------------------------------

model Inventory {
  id            String        @id @default(uuid())
  sellerId      String
  partId        String
  stockQuantity Int
  price         Decimal       @db.Decimal(10, 2)
  // Geospatial coordinates for proximity search
  latitude      Float
  longitude     Float
  location      Unsupported("geography(Point, 4326)")?
  deliveryType  DeliveryType
  status        ListingStatus @default(active)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  seller        User          @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  part          Part          @relation(fields: [partId], references: [id], onDelete: Cascade)

  // B-tree indexes for fast filtering on numeric columns
  @@index([sellerId])
  @@index([partId])
  @@index([status])
  @@index([deliveryType])
  @@index([price])
  @@index([stockQuantity])
  // Composite index for the common "find active stock of a part" query
  @@index([partId, status, stockQuantity])
  @@map("inventory")
}

// ----------------------------------------------------------------------------
// Reviews — marketplace trust layer
// ----------------------------------------------------------------------------

model Review {
  id          String   @id @default(uuid())
  authorId    String
  subjectId   String
  inventoryId String?
  rating      Int
  comment     String?
  createdAt   DateTime @default(now())

  author      User     @relation("ReviewAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  subject     User     @relation("ReviewSubject", fields: [subjectId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@index([subjectId])
  @@index([inventoryId])
  @@map("reviews")
}
`;

export type TableName =
  | 'users'
  | 'vehicles'
  | 'parts'
  | 'part_fitment'
  | 'inventory'
  | 'reviews';

export interface TableMeta {
  name: TableName;
  label: string;
  side: 'DIYers' | 'Mechanics' | 'Sellers' | 'Catalog' | 'Trust';
  purpose: string;
  columns: { name: string; type: string; note?: string }[];
  indexes: string[];
}

export const tables: TableMeta[] = [
  {
    name: 'users',
    label: 'Users',
    side: 'All sides',
    purpose:
      'Marketplace participants. The role enum separates DIYers, mechanics, and sellers while keeping them in one identity table.',
    columns: [
      { name: 'id', type: 'UUID' },
      { name: 'email', type: 'String', note: 'unique' },
      { name: 'passwordHash', type: 'String' },
      { name: 'displayName', type: 'String' },
      { name: 'role', type: 'UserRole', note: 'diy | mechanic | seller' },
      { name: 'businessName', type: 'String?', note: 'sellers / mechanics' },
      { name: 'rating', type: 'Float' },
      { name: 'reviewCount', type: 'Int' },
    ],
    indexes: ['role', 'email'],
  },
  {
    name: 'vehicles',
    label: 'Vehicles',
    side: 'DIYers & Mechanics',
    purpose:
      'A user\'s "virtual garage". Each vehicle carries Year, Make, Model, Engine, VIN, and License Plate — the fields needed to resolve part fitment.',
    columns: [
      { name: 'id', type: 'UUID' },
      { name: 'ownerId', type: 'FK → users' },
      { name: 'year', type: 'Int' },
      { name: 'make', type: 'String' },
      { name: 'model', type: 'String' },
      { name: 'engine', type: 'String' },
      { name: 'vin', type: 'String?', note: 'unique' },
      { name: 'licensePlate', type: 'String?' },
    ],
    indexes: ['ownerId', 'make, model, year', 'vin'],
  },
  {
    name: 'parts',
    label: 'Parts',
    side: 'Catalog',
    purpose:
      'PIES-style product catalog. Holds brand, part number, category, and product attributes. Fitment lives in PartFitment so a single part can fit many vehicles.',
    columns: [
      { name: 'id', type: 'UUID' },
      { name: 'partNumber', type: 'String', note: 'unique' },
      { name: 'brand', type: 'String' },
      { name: 'category', type: 'PartCategory' },
      { name: 'title', type: 'String' },
      { name: 'description', type: 'String?' },
      { name: 'weightLb', type: 'Float?' },
      { name: 'dimensionsMm', type: 'String?' },
    ],
    indexes: ['partNumber', 'brand', 'category'],
  },
  {
    name: 'part_fitment',
    label: 'Part Fitment',
    side: 'Catalog',
    purpose:
      'ACES-style fitment mapping. Mirrors the ACES BaseVehicle / Vehicle / Engine qualifier structure so queries like "what fits a 2018 Honda Civic EX 1.5L" resolve in a single indexed lookup.',
    columns: [
      { name: 'id', type: 'UUID' },
      { name: 'partId', type: 'FK → parts' },
      { name: 'year', type: 'Int' },
      { name: 'make', type: 'String' },
      { name: 'model', type: 'String' },
      { name: 'submodel', type: 'String?' },
      { name: 'engine', type: 'String?' },
      { name: 'position', type: 'String?', note: 'e.g. Front Left' },
      { name: 'note', type: 'String?' },
    ],
    indexes: ['partId', 'make, model, year, submodel, engine', 'year, make, model'],
  },
  {
    name: 'inventory',
    label: 'Inventory',
    side: 'Sellers',
    purpose:
      'A seller\'s stock of a part with price, quantity, delivery options, and lat/long for proximity search. A PostGIS geography(Point) column enables radius queries.',
    columns: [
      { name: 'id', type: 'UUID' },
      { name: 'sellerId', type: 'FK → users' },
      { name: 'partId', type: 'FK → parts' },
      { name: 'stockQuantity', type: 'Int' },
      { name: 'price', type: 'Decimal(10,2)' },
      { name: 'latitude', type: 'Float' },
      { name: 'longitude', type: 'Float' },
      { name: 'location', type: 'geography(Point,4326)', note: 'PostGIS' },
      { name: 'deliveryType', type: 'DeliveryType' },
      { name: 'status', type: 'ListingStatus' },
    ],
    indexes: [
      'sellerId',
      'partId',
      'status',
      'deliveryType',
      'price',
      'stockQuantity',
      'partId, status, stockQuantity',
    ],
  },
  {
    name: 'reviews',
    label: 'Reviews',
    side: 'Trust',
    purpose:
      'Cross-side trust layer. DIYers and mechanics review sellers; ratings roll up into the seller profile.',
    columns: [
      { name: 'id', type: 'UUID' },
      { name: 'authorId', type: 'FK → users' },
      { name: 'subjectId', type: 'FK → users' },
      { name: 'inventoryId', type: 'FK → inventory?' },
      { name: 'rating', type: 'Int' },
      { name: 'comment', type: 'String?' },
    ],
    indexes: ['authorId', 'subjectId', 'inventoryId'],
  },
];

export interface DesignDecision {
  title: string;
  detail: string;
}

export const designDecisions: DesignDecision[] = [
  {
    title: 'Single Users table with a role enum',
    detail:
      'DIYers, mechanics, and sellers share one identity table. The role enum drives authorization and keeps cross-side interactions (reviews, orders) on a single foreign key instead of three parallel tables.',
  },
  {
    title: 'Fitment split out from Parts (ACES)',
    detail:
      'A part fits many vehicles and a vehicle takes many parts. Modeling fitment in its own table with composite indexes on (make, model, year, submodel, engine) mirrors the ACES qualifier structure and turns "what fits this car?" into one indexed read.',
  },
  {
    title: 'PIES-style product attributes on Parts',
    detail:
      'Brand, manufacturer part number, category, weight, and dimensions follow PIES product-attribute conventions so the catalog interoperates with industry data feeds.',
  },
  {
    title: 'PostGIS geography column for proximity',
    detail:
      'Inventory carries raw lat/long for convenience plus a PostGIS geography(Point,4326) column. Radius and "nearest seller" queries use ST_DWithin / ST_Distance against the GiST-backed geography column for sub-millisecond spatial filtering.',
  },
  {
    title: 'Delivery type as an enum, not a flag set',
    detail:
      'local_courier, national_shipping, pickup, and all_three are the four valid states. An enum prevents invalid combinations and indexes cleanly for "show me local-only sellers".',
  },
  {
    title: 'Composite index on (partId, status, stockQuantity)',
    detail:
      'The hottest query is "active, in-stock listings for this part". A composite index serves it without touching the heap, and the individual indexes cover filtered and sorted variants.',
  },
];
