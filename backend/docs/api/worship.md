# Worship API Documentation

Base URL: `/api/v1/worship`

## Categories

### `GET /categories`
Fetches a list of worship categories.
- **Access**: User (Authenticated)
- **Query Params**:
  - `all` (boolean): If true and requested by an ADMIN, includes inactive categories.
- **Returns**: Array of `WorshipCategory` objects.

### `POST /categories`
Creates a new worship category.
- **Access**: Admin only
- **Body Params**:
  - `name` (string, required)
  - `description` (string, optional)
  - `isActive` (boolean, optional)

### `GET /categories/:id`
Fetches a specific worship category by ID.
- **Access**: Admin only
- **Returns**: `WorshipCategory` object.

### `PUT /categories/:id`
Updates a worship category.
- **Access**: Admin only
- **Body Params**: (Same as POST, all optional)

### `DELETE /categories/:id`
Soft deletes a worship category (sets `deletedAt` and `isActive` to false).
- **Access**: Admin only

---

## Worship Items

### `GET /items`
Fetches a list of worship items.
- **Access**: User (Authenticated)
- **Query Params**:
  - `all` (boolean): If true and requested by an ADMIN, includes inactive items.
- **Returns**: Array of `WorshipItem` objects (includes `category`).

### `POST /items`
Creates a new worship item.
- **Access**: Admin only
- **Body Params**:
  - `categoryId` (uuid, required)
  - `title` (string, required)
  - `description` (string, optional)
  - `icon` (string, optional)
  - `inputType` (enum: BOOLEAN, COUNT, DURATION, TEXT; required)
  - `targetType` (string, optional)
  - `order` (number, optional, default: 0)
  - `isActive` (boolean, optional)

### `GET /items/:id`
Fetches a specific worship item by ID.
- **Access**: Admin only
- **Returns**: `WorshipItem` object (includes `category`).

### `PUT /items/:id`
Updates a worship item.
- **Access**: Admin only
- **Body Params**: (Same as POST, all optional)

### `DELETE /items/:id`
Soft deletes a worship item (sets `deletedAt` and `isActive` to false).
- **Access**: Admin only
