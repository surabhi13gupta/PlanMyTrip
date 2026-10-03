# API Contract Spec — PlanMyTrip

> Status: Draft | Owner: <name> | Last updated: <YYYY-MM-DD>
> Version: v1
> Related: [frontend-spec.md](./frontend-spec.md), [backend-spec.md](./backend-spec.md)

## 1. Conventions
- Base URL: `/api/v1`
- Protocol / format: REST, JSON
- Naming (camelCase / snake_case):
- Date/time format: ISO 8601 (UTC)
- IDs (UUID / int):
- Authentication header: `Authorization: Bearer <token>`
- Pagination: <!-- e.g. ?page=&limit= or cursor -->
- Sorting / filtering:
- Versioning strategy:

## 2. Standard Error Response
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

| HTTP Status | Code | When |
|-------------|------|------|
| 400 | VALIDATION_ERROR | |
| 401 | UNAUTHORIZED | |
| 403 | FORBIDDEN | |
| 404 | NOT_FOUND | |
| 409 | CONFLICT | |
| 500 | INTERNAL_ERROR | |

## 3. Shared Schemas
<!-- Reusable object shapes referenced by endpoints. -->
### <SchemaName>
```json
{
}
```

## 4. Endpoint Summary
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| | | | |

## 5. Endpoint Details
<!-- Repeat this block for each endpoint. -->
### 5.x `<METHOD> <path>`
- **Description:**
- **Auth required:** Yes / No
- **Path params:**
- **Query params:**

**Request body**
```json
{
}
```

**Success response** — `<status>`
```json
{
}
```

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| | | |

## 6. Rate Limits
- 

## 7. Changelog
| Date | Version | Change |
|------|---------|--------|
| | v1 | Initial draft |
