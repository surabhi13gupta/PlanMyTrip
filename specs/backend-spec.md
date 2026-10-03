# Backend Spec — PlanMyTrip

> Status: Draft | Owner: <name> | Last updated: <YYYY-MM-DD>
> Related: [goal-spec.md](./goal-spec.md), [api-contract-spec.md](./api-contract-spec.md)

## 1. Overview
<!-- Responsibilities of the backend. -->

## 2. Tech Stack
- Language / runtime:
- Framework:
- Database:
- ORM / query layer:
- Caching:
- Background jobs / queues:
- Testing:

## 3. Architecture
<!-- Layering (routes → controllers → services → repositories), monolith vs services, diagram if useful. -->

## 4. Data Model
<!-- Repeat for each entity. -->
### 4.x <Entity Name>
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | | PK | |
| created_at | timestamp | not null | |
| updated_at | timestamp | not null | |

### Relationships
- 

### Indexes
- 

## 5. Business Logic / Services
| Service | Responsibilities | Key Rules |
|---------|------------------|-----------|
| | | |

## 6. Authentication & Authorization
- Auth method (JWT, session, OAuth):
- Password hashing:
- Token lifetime / refresh:
- Roles & permissions:
- Resource ownership rules:

## 7. External Integrations
| Service | Purpose | Failure Handling |
|---------|---------|------------------|
| | | |

## 8. Validation
- Input validation approach:
- Shared schemas with frontend?:

## 9. Error Handling
- Error format (see api-contract-spec.md):
- Logging of errors:

## 10. Security
- CORS:
- Rate limiting:
- Secrets management:
- Input sanitization / injection protection:

## 11. Configuration & Environment
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| | | | |

## 12. Logging & Monitoring
- Logging format / levels:
- Health check endpoint:
- Metrics / tracing:

## 13. Testing Strategy
- Unit:
- Integration:
- Test database / fixtures:

## 14. Deployment
- Environments (dev / staging / prod):
- Hosting:
- CI/CD:
- Database migrations:

## 15. Project Structure
```
backend/
  src/
    ...
```

## 16. Open Questions
- 
