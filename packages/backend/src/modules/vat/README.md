# VAT & Compliance Module

Complete UK VAT with Making Tax Digital (MTD) API integration for DeepFinance.

## Overview

The VAT module provides:

- **VAT Settings Management** - Configure VAT registration, scheme (Standard, Flat Rate, Cash Accounting), and HMRC authentication
- **VAT Return Calculation** - Automatically calculate 9-box VAT returns based on invoices/bills with scheme-specific logic
- **VAT Return Tracking** - Manage VAT return lifecycle (Draft → Calculated → Reviewed → Submitted → Accepted)
- **HMRC MTD Integration** - OAuth authentication and REST API integration for submitting returns to HMRC
- **Obligation Syncing** - Fetch VAT return periods from HMRC

## Entities

### VatSettings
Stores VAT configuration per entity (tenant/entity scoped). One record per legal entity.

**Key fields:**
- `vatNumber` - UK VAT registration number (e.g., "GB123456789")
- `vatScheme` - STANDARD, FLAT_RATE, or CASH_ACCOUNTING
- `isRegistered` - Whether entity is registered for VAT
- `returnFrequency` - QUARTERLY, MONTHLY, or ANNUAL
- `staggerGroup` - For quarterly returns (1-3) determines stagger months
- `hmrcAccessToken/refreshToken` - OAuth tokens for HMRC API access
- `lastSyncedAt` - When obligations were last synced from HMRC

### VatReturn
VAT return record with calculated 9 boxes.

**Lifecycle statuses:**
- `DRAFT` - Initial state, can be edited
- `CALCULATED` - Boxes calculated from transactions
- `REVIEWED` - Ready for submission
- `SUBMITTED` - Sent to HMRC
- `ACCEPTED` - HMRC confirmed receipt
- `REJECTED` - HMRC rejected (validation errors)
- `AMENDED` - Amended return after original submission

**9 VAT boxes (stored in pence as bigint):**
- Box 1: VAT due on sales
- Box 2: VAT due on EU acquisitions (usually 0 post-Brexit)
- Box 3: Total VAT due (Box 1 + Box 2)
- Box 4: VAT reclaimed on purchases
- Box 5: Net VAT to pay/reclaim (Box 3 - Box 4)
- Box 6: Total sales excluding VAT
- Box 7: Total purchases excluding VAT
- Box 8: Total goods supplied to EU (usually 0)
- Box 9: Total goods acquired from EU (usually 0)

### VatObligation
Synced from HMRC - tracks VAT return periods due.

**Statuses:**
- `OPEN` - Return not yet submitted
- `FULFILLED` - Return submitted and accepted

## Services

### VatService
Main orchestration service with methods for:

**Settings:**
- `getSettings()` - Get or create default settings
- `updateSettings()` - Update VAT config
- `linkHmrcTokens()` - Store OAuth tokens after auth
- `refreshHmrcToken()` - Update refreshed access token

**Returns:**
- `listReturns()` - List with optional filtering
- `getReturn()` - Get single return detail
- `calculateReturn()` - Calculate new return (creates CALCULATED status record)
- `recalculateReturn()` - Recalculate existing DRAFT/CALCULATED return
- `reviewReturn()` - Mark CALCULATED as REVIEWED
- `submitReturn()` - Submit REVIEWED return to HMRC

**Obligations:**
- `listObligations()` - Get synced VAT periods
- `syncObligations()` - Fetch next 2 years from HMRC

### VatCalculationService
Calculates VAT boxes based on scheme:

**Standard Scheme:**
- Box 1: Sum of output VAT from invoices with issue date in period
- Box 4: Sum of input VAT from bills with issue date in period
- Box 6: Sum of invoice subtotals
- Box 7: Sum of bill subtotals

**Flat Rate Scheme:**
- Box 1: Gross turnover (including VAT) × flat rate percentage
- Box 4: VAT on purchases (simplified, excludes capital goods)
- Box 6: Gross turnover including VAT
- Box 7: Total purchases including VAT

**Cash Accounting Scheme:**
- Box 1: Output VAT from invoices where payment received in period
- Box 4: Input VAT from bills where payment made in period
- Box 6: Net value of sales with payment received
- Box 7: Net value of purchases with payment made

All calculations use pence (bigint) internally.

### HmrcMtdService
HMRC Making Tax Digital API integration.

**OAuth Flow:**
1. Generate authorization URL → redirect user to HMRC
2. User authenticates and grants permission
3. Exchange authorization code for access/refresh tokens
4. Tokens stored in VatSettings

**API Operations:**
- `getAuthUrl()` - Generate HMRC OAuth URL
- `exchangeCode()` - Exchange auth code for tokens
- `refreshAccessToken()` - Refresh expired access token
- `ensureValidToken()` - Check token validity, refresh if needed
- `getObligations()` - Fetch VAT return periods from HMRC
- `submitReturn()` - Submit VAT return to HMRC
- `viewReturn()` - Retrieve previously submitted return

**Configuration:**
- `HMRC_API_BASE_URL` - API endpoint (defaults to `https://test-api.service.hmrc.gov.uk` for sandbox)
- `HMRC_CLIENT_ID` - OAuth client ID
- `HMRC_CLIENT_SECRET` - OAuth client secret
- `HMRC_REDIRECT_URI` - Callback URL after user auth

## API Endpoints

All endpoints require `x-tenant-id` and `x-entity-id` headers.

### Settings
```
GET    /vat/settings                    Get VAT settings
PATCH  /vat/settings                    Update VAT settings
```

### Returns
```
GET    /vat/returns                     List returns
GET    /vat/returns/:id                 Get return detail
POST   /vat/returns/calculate           Calculate new return
POST   /vat/returns/:id/recalculate     Recalculate existing return
POST   /vat/returns/:id/review          Mark as reviewed
POST   /vat/returns/:id/submit          Submit to HMRC
```

### Obligations
```
GET    /vat/obligations                 List obligations
POST   /vat/obligations/sync            Sync from HMRC
```

### OAuth
```
GET    /vat/auth/url                    Get HMRC auth URL
POST   /vat/auth/callback               Handle OAuth callback
```

## Usage Examples

### 1. Setup VAT Settings
```bash
curl -X PATCH http://localhost:3000/vat/settings \
  -H "x-tenant-id: <tenant-id>" \
  -H "x-entity-id: <entity-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "vatNumber": "GB123456789",
    "vatScheme": "STANDARD",
    "isRegistered": true,
    "registrationDate": "2020-01-01",
    "returnFrequency": "QUARTERLY",
    "staggerGroup": 1
  }'
```

### 2. Authenticate with HMRC
```bash
# Get auth URL
curl http://localhost:3000/vat/auth/url \
  -H "x-tenant-id: <tenant-id>" \
  -H "x-entity-id: <entity-id>"

# User navigates to returned authUrl and grants permission
# HMRC redirects to /vat/auth/callback?code=...

# Handle callback to exchange code for tokens
curl -X POST http://localhost:3000/vat/auth/callback \
  -H "x-tenant-id: <tenant-id>" \
  -H "x-entity-id: <entity-id>" \
  -H "Content-Type: application/json" \
  -d '{"code": "<auth-code-from-hmrc>"}'
```

### 3. Calculate VAT Return
```bash
curl -X POST http://localhost:3000/vat/returns/calculate \
  -H "x-tenant-id: <tenant-id>" \
  -H "x-entity-id: <entity-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "periodStart": "2026-01-01",
    "periodEnd": "2026-03-31"
  }'
```

### 4. Review and Submit
```bash
# Review the calculated return
curl -X POST http://localhost:3000/vat/returns/<return-id>/review \
  -H "x-tenant-id: <tenant-id>" \
  -H "x-entity-id: <entity-id>"

# Submit to HMRC
curl -X POST http://localhost:3000/vat/returns/<return-id>/submit \
  -H "x-tenant-id: <tenant-id>" \
  -H "x-entity-id: <entity-id>"
```

### 5. Sync Obligations
```bash
curl -X POST http://localhost:3000/vat/obligations/sync \
  -H "x-tenant-id: <tenant-id>" \
  -H "x-entity-id: <entity-id>"
```

## Implementation Notes

### Monetary Amounts
- **Internal storage:** All VAT amounts stored in **pence** as `bigint`
- **API requests:** Values in the 9-box return must be converted to **pounds** when submitting to HMRC
- **Invoice/Bill data:** Uses `numeric(15,2)` in pounds from invoices/bills modules

Conversion: `pence ÷ 100 = pounds`

### Period Key Format
HMRC uses period keys like `2026Q1` for Q1 2026. Generated from period start/end dates.

### Token Refresh
Access tokens are automatically refreshed when needed (checked with 5-minute buffer before expiry).

### Error Handling
HMRC API errors are caught and mapped to appropriate NestJS exceptions:
- 401/403 → Authentication failed
- 400 → Validation error
- 404 → Return/obligation not found
- 409 → Conflict (e.g., duplicate submission)
- 429 → Rate limited
- 500+ → Service unavailable

### Database Indexes
```sql
-- vat_settings
CREATE UNIQUE INDEX idx_vat_settings_tenant_entity
  ON vat_settings(tenant_id, entity_id);

-- vat_returns
CREATE UNIQUE INDEX idx_vat_returns_period
  ON vat_returns(tenant_id, entity_id, period_start, period_end);
CREATE INDEX idx_vat_returns_status
  ON vat_returns(tenant_id, entity_id, status);
CREATE INDEX idx_vat_returns_due_date
  ON vat_returns(tenant_id, entity_id, due_date);

-- vat_obligations
CREATE UNIQUE INDEX idx_vat_obligations_period
  ON vat_obligations(tenant_id, entity_id, period_start, period_end);
CREATE INDEX idx_vat_obligations_status
  ON vat_obligations(tenant_id, entity_id, status);
```

### HMRC API Headers
All HMRC API calls include:
```
Authorization: Bearer <access_token>
Accept: application/vnd.hmrc.1.0+json
Content-Type: application/json
Gov-Client-Connection-Method: WEB_APP_VIA_SERVER
```

## Testing

The module supports both sandbox (test) and production HMRC APIs via the `HMRC_API_BASE_URL` env var.

**Sandbox URL:** `https://test-api.service.hmrc.gov.uk`
**Production URL:** `https://api.service.hmrc.gov.uk`

For local development, use the sandbox endpoint with test credentials.

## File Structure

```
packages/backend/src/modules/vat/
├── vat-settings.entity.ts          # VAT config entity
├── vat-return.entity.ts            # VAT return entity
├── vat-obligation.entity.ts        # Obligation entity
├── vat-calculation.service.ts      # Calculation logic
├── hmrc-mtd.service.ts             # HMRC API integration
├── vat.service.ts                  # Main service
├── vat-returns.controller.ts       # REST endpoints
├── vat.dto.ts                      # DTOs
├── vat.module.ts                   # Module definition
└── README.md                        # This file
```

## Contributing

When adding new features:
1. Add enum values to entity definitions (e.g., new VAT schemes)
2. Implement calculation logic in VatCalculationService
3. Add corresponding service methods in VatService
4. Create controller endpoints with Swagger docs
5. Update DTOs with validation
6. Test with both standard and edge case scenarios
