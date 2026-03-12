# Quantixone Partner Service — UI/UX Design Specification

**Target audience:** Frontend React/Next.js engineers
**Base URL (env var):** `NEXT_PUBLIC_PARTNER_SERVICE_URL`
**Last updated:** 2026-03-09

---

## Table of Contents

1. [Information Architecture](#1-information-architecture)
2. [Navigation Structure](#2-navigation-structure)
3. [Screen-by-Screen Design Specs](#3-screen-by-screen-design-specs)
   - [Admin Portal](#admin-portal-screens)
   - [Partner Portal](#partner-portal-screens)
4. [Key UI Patterns](#4-key-ui-patterns)
5. [Form Specs](#5-form-specs)
6. [State Management Guide](#6-state-management-guide)
7. [Error Handling](#7-error-handling)
8. [Mobile Responsiveness Notes](#8-mobile-responsiveness-notes)

---

## 1. Information Architecture

### Admin Portal — Site Map

```
/admin
├── /dashboard                        (overview metrics)
├── /slab-config                      (Phase 0 — commission tier settings)
├── /partners
│   ├── /                             (partner list with search + filters)
│   ├── /new                          (onboard new partner)
│   └── /[partnerId]
│       ├── /                         (partner detail + stats)
│       ├── /edit                     (update bank details / notes)
│       └── /contracts
│           └── /[contractId]         (contract detail + countersign action)
├── /contracts                        (all contracts list)
├── /commissions                      (all commissions with filters)
│   └── /[commissionId]              (commission detail)
└── /payouts
    ├── /                             (payout statements list)
    ├── /new                          (generate payout for a partner + period)
    └── /[statementId]               (statement detail, finalize, disburse)
```

### Partner Portal — Site Map

```
/partner
├── /dashboard                        (overview: earned, pending, tier)
├── /referral-codes
│   ├── /                             (list all codes + usage stats)
│   └── /new                          (create a new referral code)
│   └── /[codeId]                     (edit pass-through, status, expiry)
├── /commissions
│   ├── /                             (list all commissions)
│   └── /[commissionId]              (commission detail with hold countdown)
└── /payouts
    ├── /                             (list payout statements)
    └── /[statementId]               (payout statement detail)
```

---

## 2. Navigation Structure

### Admin Portal Sidebar

| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| LayoutDashboard | Dashboard | `/admin/dashboard` | — |
| SlidersHorizontal | Slab Config | `/admin/slab-config` | — |
| Users | Partners | `/admin/partners` | Count of `pending_review` |
| FileText | Contracts | `/admin/contracts` | Count of `partner_signed` (awaiting countersign) |
| Coins | Commissions | `/admin/commissions` | — |
| Wallet | Payouts | `/admin/payouts` | Count of `draft` statements |

### Partner Portal Sidebar

| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| LayoutDashboard | Dashboard | `/partner/dashboard` | — |
| Tag | Referral Codes | `/partner/referral-codes` | — |
| Coins | Commissions | `/partner/commissions` | Count of `payable` |
| Wallet | Payouts | `/partner/payouts` | — |

---

## 3. Screen-by-Screen Design Specs

---

### Admin Portal Screens

---

#### 3.A.1 — Admin Dashboard

**Route:** `/admin/dashboard`
**Purpose:** High-level snapshot of partner program health.
**Layout:** 4-column stat cards row, then two side-by-side summary tables.

**Components:**

| Component | Data shown | API call |
|-----------|-----------|----------|
| Stat card — Total Partners | Count by status | `GET /partners?limit=1` (use `total` field) |
| Stat card — Active Partners | Count of `active` status | `GET /partners?status=active&limit=1` |
| Stat card — Payable Commissions | Sum of `net_commission` for `payable` | `GET /commissions?status=payable&limit=100` |
| Stat card — Draft Payouts | Count of `draft` statements | `GET /payouts?limit=1` |
| Recent Partners table | Latest 5 partners | `GET /partners?limit=5` |
| Pending Actions table | Contracts awaiting countersign | `GET /contracts?limit=20` (filter `partner_signed` client-side) |

**Loading state:** Skeleton placeholders for each card and table row.
**Empty state:** Tables show "No records yet" with a descriptive empty-state illustration.
**Error state:** Inline error banner with retry button per section.

**User actions:**
- Click partner row → navigate to `/admin/partners/[partnerId]`
- Click contract row → navigate to `/admin/partners/[partnerId]/contracts/[contractId]`
- "Onboard Partner" CTA button → `/admin/partners/new`

---

#### 3.A.2 — Slab Config

**Route:** `/admin/slab-config`
**Purpose:** View and update the global commission tier table that determines commission rates.
**Layout:** Full-width card containing an editable table with one row per tier.

**Components:**

Editable tier table:

| Column | Type | Editable |
|--------|------|----------|
| Tier # | Number (read-only) | No |
| Min Orgs | Number input | Yes |
| Max Orgs | Number input (blank = unlimited) | Yes |
| New Rate (%) | Decimal input | Yes |
| Renewal Rate (%) | Decimal input | Yes |

- "Add Tier" button appends a new row at the bottom.
- "Remove" icon button on each row (disabled if only one tier remains).
- "Save Changes" primary button — calls `PUT /slab-config`.
- "Reset to Defaults" secondary button — reloads from API without saving.
- Info banner: _"Rate changes apply to future commissions only. Existing pending/payable commissions retain their recorded rate."_

**API calls:**
- `GET /slab-config` — on mount
- `PUT /slab-config` — on "Save Changes"

**Request body for PUT:**
```json
{
  "tiers": [
    { "tier": 1, "min_orgs": 0, "max_orgs": 10, "new_rate": "12.00", "renewal_rate": "6.00" },
    { "tier": 2, "min_orgs": 11, "max_orgs": 30, "new_rate": "15.00", "renewal_rate": "8.00" },
    { "tier": 3, "min_orgs": 31, "max_orgs": null, "new_rate": "20.00", "renewal_rate": "10.00" }
  ],
  "updated_by": "<current_admin_user_id>"
}
```

**Loading state:** Table rows replaced with skeleton rows.
**Empty state:** Not applicable — API auto-seeds defaults.
**Error state:** Toast error + form remains editable.
**Success state:** Toast "Slab configuration updated" + table refreshes.

---

#### 3.A.3 — Partner List

**Route:** `/admin/partners`
**Purpose:** Browse, search, and filter all partners.
**Layout:** Filter bar + paginated data table.

**Filter bar (above table):**
- Search input (searches `company_name` and `email`) — query param `search`
- Status filter dropdown (all statuses + "All") — query param `status`
- "Onboard Partner" button → `/admin/partners/new`

**Table columns:**

| Column | Field | Sortable |
|--------|-------|----------|
| Company | `company_name` | No |
| Email | `email` | No |
| Status | `status` (badge) | No |
| Tier | `current_tier` | No |
| Orgs Referred | `total_orgs_referred` | No |
| Total Earned | `total_commissions_earned` (₹ formatted) | No |
| Created | `created_at` (relative date) | No |
| Actions | View button | — |

- Row click → `/admin/partners/[partnerId]`
- Pagination: 20 per page; "Previous / Next" controls; shows "Showing X–Y of Z"

**API call:** `GET /partners?skip=0&limit=20&status=<filter>&search=<query>`

**Loading state:** 5 skeleton rows.
**Empty state:** "No partners found. Adjust filters or onboard a new partner." with CTA button.
**Error state:** Full-width error banner with retry.

---

#### 3.A.4 — Onboard Partner (New Partner Form)

**Route:** `/admin/partners/new`
**Purpose:** Admin creates a new partner record after offline KYC verification.
**Layout:** Two-column card layout — KYC section (left) and Bank Details section (right) with Notes below.

**API call on submit:** `POST /partners`

**Request body:**
```json
{
  "kyc": {
    "company_name": "Acme Corp",
    "contact_person_name": "Rajan Garg",
    "email": "rajan@acmecorp.com",
    "phone": "9876543210",
    "aadhar_number": "123456789012",
    "pan_number": "ABCDE1234F",
    "gst_number": "27ABCDE1234F1Z5",
    "dpiit_number": "DIPP12345"
  },
  "bank": {
    "beneficiary_name": "Acme Corp",
    "account_number": "123456789012",
    "ifsc_code": "HDFC0001234",
    "bank_name": "HDFC Bank",
    "branch": "Connaught Place"
  },
  "notes": "Referred by existing partner. KYC docs verified on 2026-03-01."
}
```

**Buttons:**
- "Submit" primary button — submits the form
- "Cancel" secondary button → back to `/admin/partners`

**On success:** Toast "Partner onboarded successfully" + redirect to `/admin/partners/[partnerId]`

**Loading state:** Submit button shows spinner and becomes disabled.
**Error state:** API validation errors shown inline below the relevant field. Duplicate email error shown as a form-level error banner.

---

#### 3.A.5 — Partner Detail

**Route:** `/admin/partners/[partnerId]`
**Purpose:** Full partner profile including KYC, bank details, stats, and status management.
**Layout:** Header with status badge + action buttons; two-column body; bottom section for contracts.

**Header:**
- Company name (H1)
- Status badge (see Section 4.1)
- Tier badge: `Tier [N]` in `bg-purple-100 text-purple-700`
- Action buttons (context-sensitive, see table below)

**Status-based action buttons:**

| Current Status | Available Actions |
|----------------|------------------|
| `pending_review` | "Approve" (→ `approved`), "Terminate" (→ `terminated`) |
| `approved` | "Send Contract" (→ creates contract + status `contract_sent`), "Terminate" |
| `contract_sent` | "View Contract" (navigates to contract detail), "Terminate" |
| `active` | "Suspend" (→ `suspended`), "Terminate" |
| `suspended` | "Reactivate" (→ `active`), "Terminate" |
| `terminated` | — (no actions) |

"Terminate" is always a destructive outlined red button with a confirmation dialog.

**Body sections:**

*KYC Details card (read-only grid):*
- Company Name, Contact Person, Email, Phone
- Aadhar: display as `XXXX XXXX 1234` (mask first 8 digits on frontend)
- PAN: display as `ABCDE1234F`
- GST Number (if present), DPIIT Number (if present)
- "KYC fields cannot be edited after onboarding" info note

*Bank Details card:*
- Beneficiary Name, Account Number (mask as `XXXX...6789`), IFSC Code, Bank Name, Branch
- "Edit Bank Details" link → `/admin/partners/[partnerId]/edit`

*Stats card (4 metrics):*
- Total Orgs Referred | Active Orgs | Total Earned | Total Paid

*Notes section:*
- Read-only textarea showing `notes` field
- "Edit Notes" link → `/admin/partners/[partnerId]/edit`

*Contracts section (bottom table):*

| Column | Field |
|--------|-------|
| Contract ID | `contract_id` (truncated) |
| Status | `status` (badge) |
| Partner Signed | `partner_signed_at` (date or "—") |
| Admin Signed | `admin_signed_at` (date or "—") |
| Created | `created_at` |
| Actions | "View" button |

- "Create Contract" button (shown only when partner status is `approved`)

**API calls:**
- `GET /partners/[partnerId]` — on mount
- `PATCH /partners/[partnerId]/status` — on status action buttons
- `POST /contracts` — on "Send Contract" button
- `GET /contracts?partner_id=[partnerId]` — to populate contracts table (client-side filter from full list, or use partner-scoped query if supported)

**Confirm dialog for destructive actions:**
```
Title: "Terminate Partnership?"
Body: "This will permanently terminate [Company Name]'s partnership. This action cannot be undone."
Input: Optional notes textarea
Buttons: "Cancel" | "Terminate" (red)
```

**Loading state:** Full page skeleton.
**Error state (404):** "Partner not found" with back button.

---

#### 3.A.6 — Edit Partner

**Route:** `/admin/partners/[partnerId]/edit`
**Purpose:** Update bank details and/or admin notes. KYC fields are read-only.
**Layout:** Single-column card form.

**API call on submit:** `PUT /partners/[partnerId]`

**Request body:**
```json
{
  "bank": {
    "beneficiary_name": "Acme Corp",
    "account_number": "987654321098",
    "ifsc_code": "ICIC0001234",
    "bank_name": "ICICI Bank",
    "branch": "Nehru Place"
  },
  "notes": "Bank details updated after name change."
}
```

**Buttons:**
- "Save Changes" primary
- "Cancel" → back to partner detail

**On success:** Toast "Partner updated" + redirect to `/admin/partners/[partnerId]`

---

#### 3.A.7 — Contract Detail

**Route:** `/admin/partners/[partnerId]/contracts/[contractId]`
**Purpose:** View contract status, manage the dual-signature upload flow, and countersign.
**Layout:** Status timeline at top; two file upload panels below; notes at bottom.

**Status timeline:** Visual 4-step indicator:
```
[draft] → [partner_signed] → [active] → [terminated]
```
Completed steps filled green, current step filled blue, future steps gray.

**File Panels:**

*Partner Signature Panel:*
- Status: "Awaiting partner signature" (if `draft`) or "Partner signed on [date]" (if `partner_signed` or later)
- If admin needs to provide the partner upload URL: "Get Upload URL for Partner" button
  - Calls `GET /contracts/[contractId]/upload-url?party=partner&filename=contract.pdf`
  - Displays the returned `upload_url` in a copyable text field with expiry countdown (5 min)
- If `partner_signed_at` exists: shows download link (the `partner_signed_s3_key` rendered as a download link via a separate pre-signed GET URL — frontend must generate this)
- "Record Partner Signature" button → opens modal with `s3_key` input field
  - Calls `POST /contracts/[contractId]/partner-sign`

*Admin Countersign Panel (shown only when status is `partner_signed`):*
- Step 1: "Get Admin Upload URL" button
  - Calls `GET /contracts/[contractId]/upload-url?party=admin&filename=countersigned.pdf`
  - Shows upload URL in copyable field
- Step 2: File upload widget (see Section 4.2 for S3 upload pattern)
  - User selects PDF → frontend PUTs directly to the pre-signed `upload_url`
  - On upload success: s3_key is stored in component state
- Step 3: "Submit Countersignature" button (enabled only after upload completes)
  - Calls `POST /contracts/[contractId]/admin-countersign`
  - Request body: `{ "s3_key": "<from_upload>", "signed_by": "<current_admin_id>" }`

**On countersign success:** Toast "Contract activated — partner is now ACTIVE" + partner status badge updates.

**Terminate button:** Outlined red button at bottom.
Calls `POST /contracts/[contractId]/terminate` after confirmation dialog.

**API calls:**
- `GET /contracts/[contractId]` — on mount
- `GET /contracts/[contractId]/upload-url?party=partner&filename=contract.pdf` — on "Get Upload URL for Partner"
- `POST /contracts/[contractId]/partner-sign` — from partner sign modal
- `GET /contracts/[contractId]/upload-url?party=admin&filename=countersigned.pdf` — on "Get Admin Upload URL"
- `POST /contracts/[contractId]/admin-countersign` — on submit countersignature
- `POST /contracts/[contractId]/terminate` — on terminate

**Loading state:** Skeleton timeline and empty panels.
**Error state (409 conflict):** Inline alert "Action not allowed: [API detail message]".

---

#### 3.A.8 — All Contracts List

**Route:** `/admin/contracts`
**Purpose:** Browse all contracts across partners, focus on those awaiting countersignature.
**Layout:** Filter bar (status dropdown) + paginated table.

**Table columns:**

| Column | Field |
|--------|-------|
| Contract ID | `contract_id` (truncated, copyable) |
| Partner | `partner_id` (link to partner detail) |
| Status | `status` (badge) |
| Partner Signed | `partner_signed_at` (date or "—") |
| Admin Signed | `admin_signed_at` (date or "—") |
| Created | `created_at` |
| Actions | "View" button → contract detail |

- "Pending Countersign" quick-filter chip pre-filters to `partner_signed`

**API call:** `GET /contracts?skip=0&limit=20`

---

#### 3.A.9 — Commissions List (Admin)

**Route:** `/admin/commissions`
**Purpose:** Browse all commissions across all partners with status and event type filters.
**Layout:** Filter bar + paginated table.

**Filter bar:**
- Status filter (all statuses + "All")
- Partner ID filter (text input or autocomplete from partners list)
- Event type filter: `new_subscription` | `renewal` | `upgrade` | "All"
- "Release Payable" button (prominent secondary button, top-right)

**"Release Payable" action:**
- Calls `POST /commissions/release-payable`
- Shows confirmation dialog: _"Release all pending commissions past their 30-day hold date to Payable status? This is safe to run multiple times."_
- Success toast: "X commissions released to payable"

**Table columns:**

| Column | Field |
|--------|-------|
| Commission ID | `commission_id` (truncated) |
| Partner | `partner_id` (link) |
| Org | `referred_org_id` |
| Event Type | `event_type` (formatted: "New Sub", "Renewal", "Upgrade") |
| Net Commission | `net_commission` (₹ formatted) |
| Status | `status` (badge) |
| Hold Until | `hold_until` (date; if future, show countdown chip) |
| Created | `created_at` |
| Actions | "View" |

**API call:** `GET /commissions?skip=0&limit=20&status=<filter>&partner_id=<filter>&event_type=<filter>`

**Loading state:** 5 skeleton rows.
**Empty state:** "No commissions found matching your filters."

---

#### 3.A.10 — Commission Detail (Admin)

**Route:** `/admin/commissions/[commissionId]`
**Purpose:** Full commission breakdown including rate calculation and hold period.
**Layout:** Two-column detail card.

**Fields displayed:**

| Label | Field |
|-------|-------|
| Commission ID | `commission_id` |
| Partner | `partner_id` (link) |
| Referred Org | `referred_org_id` |
| Subscription | `subscription_id` |
| Invoice | `invoice_id` |
| Event Type | `event_type` |
| Plan Amount | `plan_amount` (₹ formatted) |
| Commission Rate | `commission_rate` (% formatted) |
| Gross Commission | `gross_commission` (₹ formatted) |
| Pass-Through Deduction | `pass_through_amount` (₹ formatted, shown as negative) |
| Net Commission | `net_commission` (₹ formatted, bold) |
| Tier at Creation | `tier_at_creation` |
| Status | `status` (badge) |
| Hold Until | `hold_until` (date + countdown if future — see Section 4.4) |
| Payout Statement | `payout_statement_id` (link to payout if present, else "—") |
| Created | `created_at` |

**API call:** `GET /commissions/[commissionId]`

---

#### 3.A.11 — Payouts List (Admin)

**Route:** `/admin/payouts`
**Purpose:** Browse all payout statements; quick access to draft and finalized statements.
**Layout:** Filter bar (partner_id, status) + table + "Generate Payout" CTA.

**Filter bar:**
- Partner ID input
- Status filter dropdown
- "Generate Payout Statement" button → `/admin/payouts/new`

**Table columns:**

| Column | Field |
|--------|-------|
| Statement ID | `statement_id` (truncated) |
| Partner | `partner_id` (link) |
| Period | `period_start` – `period_end` (formatted as "Jan 2026 – Feb 2026") |
| Net Payable | `net_payable` (₹ formatted) |
| Status | `status` (badge) |
| Disbursed At | `disbursed_at` (date or "—") |
| Created | `created_at` |
| Actions | "View" |

**API call:** `GET /payouts?skip=0&limit=20&partner_id=<filter>`

---

#### 3.A.12 — Generate Payout Statement

**Route:** `/admin/payouts/new`
**Purpose:** Admin generates a new payout statement for a partner + period.
**Layout:** Single-column form card.

**API call on submit:** `POST /payouts`

**Request body:**
```json
{
  "partner_id": "partner_abc123",
  "period_start": "2026-02-01T00:00:00Z",
  "period_end": "2026-02-28T23:59:59Z"
}
```

**Form fields:** See Section 5.6.

**On success:** Toast "Payout statement generated" + redirect to `/admin/payouts/[statementId]`
**On 409 conflict:** Inline error "No payable commissions found for this partner in the selected period."

---

#### 3.A.13 — Payout Statement Detail (Admin)

**Route:** `/admin/payouts/[statementId]`
**Purpose:** Review payout details, finalize the statement, and record disbursement after bank transfer.
**Layout:** Header with status + action buttons; summary card; commissions breakdown table; disburse form.

**Header:**
- Statement ID + status badge
- Period range

**Summary card:**

| Label | Field |
|-------|-------|
| Partner | `partner_id` (link) |
| Period | `period_start` – `period_end` |
| Total Commissions | `total_commissions` (₹) |
| Total Clawbacks | `total_clawbacks` (₹, shown as negative in red) |
| Net Payable | `net_payable` (₹, bold, large font) |
| Status | `status` (badge) |
| Disbursed At | `disbursed_at` (if present) |
| Disbursed By | `disbursed_by` (if present) |
| Disbursement Notes | `disbursement_notes` (if present) |

**Included Commissions table** (driven by `commission_ids` array, fetch each commission):

| Column | Field |
|--------|-------|
| Commission ID | truncated |
| Org | `referred_org_id` |
| Event Type | `event_type` |
| Net Commission | `net_commission` |
| Status | `status` (badge — should all be `payable` at this point) |

**Action buttons (context-sensitive):**

| Statement Status | Available Actions |
|-----------------|------------------|
| `draft` | "Finalize Statement" (primary) |
| `finalized` | "Record Disbursement" (opens inline form) |
| `disbursed` | — (no actions; show "Disbursed" banner) |

**"Finalize Statement" confirmation dialog:**
```
Title: "Finalize Payout Statement?"
Body: "This will lock the statement. No further changes can be made."
Buttons: "Cancel" | "Finalize"
```
- Calls `POST /payouts/[statementId]/finalize`

**"Record Disbursement" form (appears inline when clicked):**
- See Section 5.7.
- Calls `POST /payouts/[statementId]/disburse`

**On disbursement success:** Toast "Disbursement recorded. All included commissions marked as Paid." + status badge updates to `disbursed`.

**API calls:**
- `GET /payouts/[statementId]` — on mount
- `POST /payouts/[statementId]/finalize` — on finalize
- `POST /payouts/[statementId]/disburse` — on disburse

---

### Partner Portal Screens

---

#### 3.P.1 — Partner Dashboard

**Route:** `/partner/dashboard`
**Purpose:** Partner's earnings snapshot with tier progress and quick links.
**Layout:** Stat cards row + tier progress bar + recent commissions mini-table.

**Components:**

| Component | Data shown | API call |
|-----------|-----------|----------|
| Stat card — Payable | Sum of `net_commission` for `payable` | `GET /commissions?status=payable&limit=100` |
| Stat card — Paid | From partner stats `total_commissions_paid` | `GET /partners/[self_partner_id]` |
| Stat card — Active Orgs | `stats.active_orgs` | same as above |
| Tier progress bar | `current_tier` + `total_orgs_referred` | same as above |
| Recent Commissions | Latest 5 commissions | `GET /commissions?limit=5` |

**Tier progress bar:** See Section 4.5.

**Recent commissions mini-table:**

| Column | Field |
|--------|-------|
| Org | `referred_org_id` |
| Event | `event_type` |
| Net | `net_commission` |
| Status | `status` (badge) |
| Hold Until | `hold_until` |

- "View All Commissions" link at the bottom.

---

#### 3.P.2 — Referral Codes List (Partner)

**Route:** `/partner/referral-codes`
**Purpose:** Manage all referral codes — view usage stats, create new codes.
**Layout:** Summary stats row + code cards grid (or table).

**Summary stats row:**
- Total Active Codes | Total Uses | Total Commissions from Codes

**Code cards** (one per code):

Each card contains:
- Code string in large monospace font with a "Copy" icon button
- Status badge
- Pass-through info: "5% discount to referred orgs" or "No pass-through"
- Expiry: "Expires Jan 1, 2027" or "No expiry"
- Stats: `total_uses` uses | ₹`total_commissions_earned` earned
- "Edit" button → `/partner/referral-codes/[codeId]`

- "Create New Code" primary CTA button → `/partner/referral-codes/new`

**API call:** `GET /referral-codes/partners/[self_partner_id]`

**Loading state:** 3 skeleton code cards.
**Empty state:** "You haven't created any referral codes yet." with CTA.

---

#### 3.P.3 — Create Referral Code

**Route:** `/partner/referral-codes/new`
**Purpose:** Partner creates a new referral code with optional pass-through discount config.
**Layout:** Single-column form card.

**API call on submit:** `POST /referral-codes/partners/[self_partner_id]`

**Request body:**
```json
{
  "code": "ACME2026",
  "pass_through": {
    "enabled": true,
    "partner_discount_pct": "5.00"
  },
  "expires_at": "2027-01-01T00:00:00Z"
}
```

**Form fields:** See Section 5.3.

**On success:** Toast "Referral code ACME2026 created" + redirect to `/partner/referral-codes`
**On 400 (duplicate code):** Inline field error "This code is already taken. Try a different one."

---

#### 3.P.4 — Edit Referral Code

**Route:** `/partner/referral-codes/[codeId]`
**Purpose:** Update pass-through config, expiry date, or deactivate a code.
**Layout:** Single-column form card; code string shown read-only at top.

**API call on submit:** `PUT /referral-codes/[codeId]`

**Request body:**
```json
{
  "pass_through": {
    "enabled": false,
    "partner_discount_pct": "0"
  },
  "expires_at": null,
  "status": "inactive"
}
```

**Note:** The `code` string itself cannot be changed — display it as a read-only badge at the top.

**Info banner:** _"Setting status to 'inactive' will prevent this code from being used at checkout. Existing commissions are unaffected."_

**Buttons:**
- "Save Changes" primary
- "Cancel" → back to codes list

**API calls:**
- `GET /referral-codes/[codeId]` — on mount to pre-populate form
- `PUT /referral-codes/[codeId]` — on submit

---

#### 3.P.5 — Commissions List (Partner)

**Route:** `/partner/commissions`
**Purpose:** Partner views their own commission history with status breakdown.
**Layout:** Filter chips (by status) + paginated table.

**Filter chips (horizontal pill row):**
- All | Pending | Payable | Paid | Clawed Back

**Table columns:**

| Column | Field |
|--------|-------|
| Commission ID | `commission_id` (truncated) |
| Org | `referred_org_id` |
| Event | `event_type` |
| Net Commission | `net_commission` (₹) |
| Status | `status` (badge) |
| Hold Until | `hold_until` (countdown if pending — see Section 4.4) |
| Created | `created_at` |
| Actions | "View" |

**API call:** `GET /commissions?skip=0&limit=20&status=<filter>` (partner_id is inferred from auth token server-side)

---

#### 3.P.6 — Commission Detail (Partner)

**Route:** `/partner/commissions/[commissionId]`
**Purpose:** Full breakdown of a single commission including hold countdown.
**Layout:** Detail card — same layout as admin version but without partner_id link.

**Fields displayed:** Same as Admin Section 3.A.10 — omit `partner_id` link.

**Hold countdown widget** (shown when `status === "pending"`): See Section 4.4.

**API call:** `GET /commissions/[commissionId]`

---

#### 3.P.7 — Payouts List (Partner)

**Route:** `/partner/payouts`
**Purpose:** Partner views their payout statement history.
**Layout:** Summary stats + paginated table.

**Summary stats:**
- Total Paid (sum of disbursed statement `net_payable`)

**Table columns:**

| Column | Field |
|--------|-------|
| Statement ID | `statement_id` (truncated) |
| Period | `period_start` – `period_end` |
| Net Payable | `net_payable` (₹) |
| Status | `status` (badge) |
| Disbursed At | `disbursed_at` (date or "—") |
| Actions | "View" |

**API call:** `GET /payouts?partner_id=[self_partner_id]`

---

#### 3.P.8 — Payout Statement Detail (Partner)

**Route:** `/partner/payouts/[statementId]`
**Purpose:** Partner views statement breakdown — read-only (no action buttons).
**Layout:** Summary card + commissions table.

Same as Admin Section 3.A.13 but:
- No "Finalize" or "Record Disbursement" buttons.
- If status is `draft` or `finalized`, show info banner: _"This statement is being reviewed. Disbursement is pending admin action."_

**API calls:**
- `GET /payouts/[statementId]` — on mount

---

## 4. Key UI Patterns

---

### 4.1 — Status Badges

All status badges use Tailwind CSS classes. Render as `<span>` with `rounded-full px-2.5 py-0.5 text-xs font-medium`.

**Partner Status:**

| Value | Tailwind classes |
|-------|-----------------|
| `pending_review` | `bg-yellow-100 text-yellow-800` |
| `approved` | `bg-blue-100 text-blue-800` |
| `contract_sent` | `bg-indigo-100 text-indigo-800` |
| `active` | `bg-green-100 text-green-800` |
| `suspended` | `bg-orange-100 text-orange-800` |
| `terminated` | `bg-red-100 text-red-800` |

**Contract Status:**

| Value | Tailwind classes |
|-------|-----------------|
| `draft` | `bg-gray-100 text-gray-700` |
| `partner_signed` | `bg-yellow-100 text-yellow-800` |
| `active` | `bg-green-100 text-green-800` |
| `terminated` | `bg-red-100 text-red-800` |

**Referral Code Status:**

| Value | Tailwind classes |
|-------|-----------------|
| `active` | `bg-green-100 text-green-800` |
| `inactive` | `bg-gray-100 text-gray-700` |
| `expired` | `bg-red-100 text-red-800` |

**Commission Status:**

| Value | Tailwind classes |
|-------|-----------------|
| `pending` | `bg-yellow-100 text-yellow-800` |
| `payable` | `bg-blue-100 text-blue-800` |
| `paid` | `bg-green-100 text-green-800` |
| `clawed_back` | `bg-red-100 text-red-800` |

**Payout Status:**

| Value | Tailwind classes |
|-------|-----------------|
| `draft` | `bg-gray-100 text-gray-700` |
| `finalized` | `bg-blue-100 text-blue-800` |
| `disbursed` | `bg-green-100 text-green-800` |

**Display labels** (human-readable mapping):

```ts
const STATUS_LABELS: Record<string, string> = {
  pending_review:   "Pending Review",
  approved:         "Approved",
  contract_sent:    "Contract Sent",
  active:           "Active",
  suspended:        "Suspended",
  terminated:       "Terminated",
  draft:            "Draft",
  partner_signed:   "Partner Signed",
  partner_signed_contract: "Partner Signed",
  pending:          "Pending",
  payable:          "Payable",
  paid:             "Paid",
  clawed_back:      "Clawed Back",
  finalized:        "Finalized",
  disbursed:        "Disbursed",
  inactive:         "Inactive",
  expired:          "Expired",
};
```

---

### 4.2 — S3 Pre-Signed Upload Flow (Contracts)

This 3-step pattern is used for both partner and admin contract PDF uploads.

**Step 1 — Get upload URL**
```
GET /contracts/{contractId}/upload-url?party=partner&filename=contract.pdf
```
Response:
```json
{
  "upload_url": "https://s3.amazonaws.com/bucket/...?X-Amz-Expires=300...",
  "s3_key": "partners/partner_abc123/contracts/2026-03-09_contract.pdf",
  "expires_in_seconds": 300
}
```
Store `upload_url` and `s3_key` in component state. Show a countdown timer from 300 seconds.

**Step 2 — Upload file directly to S3**
```ts
// Direct PUT to the pre-signed URL — NO Authorization header
const response = await fetch(upload_url, {
  method: 'PUT',
  body: selectedFile,
  headers: { 'Content-Type': 'application/pdf' },
});
// Expect HTTP 200 from S3
```
Show a progress bar during upload (use `XMLHttpRequest` with `upload.onprogress` instead of `fetch` for progress tracking).

**Step 3 — Record the signature**
```ts
// POST to partner-service with the s3_key from step 1
POST /contracts/{contractId}/partner-sign
Body: { "s3_key": "<from_step_1>" }
```

**UI states for the upload widget:**
- `idle` — "Choose PDF file" button
- `selected` — Filename shown + "Upload" button
- `uploading` — Progress bar (0–100%)
- `uploaded` — Green checkmark + filename + "Change file" link
- `error` — Red error message + retry button
- `expired` — "Upload URL expired. Generate a new one." with refresh button

---

### 4.3 — Fire-and-Forget Feedback (Partner Code at Checkout)

This pattern is used in the **Subscription Service checkout UI** (not in the partner portals), but the partner-service validates the code. Document it here for cross-team reference.

When a customer enters a partner code at checkout:

1. Debounce 500ms after user stops typing.
2. Call `POST /referral-codes/validate` with:
   ```json
   { "code": "ACME2026", "org_id": "<current_org>", "amount": "8000.00" }
   ```
3. Response states:

| Response | UI treatment |
|----------|-------------|
| `valid: true, applicable: true` | Green checkmark + "₹400 discount applied (ACME2026)" |
| `valid: true, applicable: false` | Yellow warning icon + `reasons[0]` message (e.g., "Code already used by your organization") |
| `valid: false` | Red X + "Invalid partner code" |
| Network error | Silently ignore — do not block checkout |

4. This call is **fire-and-forget** — a failed validation must never block the user from completing checkout. Wrap in try/catch and swallow errors.

---

### 4.4 — Commission Hold Countdown Display

Shown on commission list rows and commission detail pages when `status === "pending"`.

**Calculation:**
```ts
const msRemaining = new Date(hold_until).getTime() - Date.now();
const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
```

**Display rules:**

| Days remaining | Display |
|----------------|---------|
| > 7 | `"Releases in 14 days"` — gray text |
| 2–7 | `"Releases in 5 days"` — yellow text + yellow clock icon |
| 1 | `"Releases tomorrow"` — orange text |
| 0 (today) | `"Releases today"` — orange text + pulsing dot |
| Past | `"Ready to release"` — blue text (cron hasn't run yet) |

**In the commissions list table:** Render this in the "Hold Until" column replacing the raw date when status is `pending`.

**On commission detail page:** Display as a prominent info card:
```
┌─────────────────────────────────────────┐
│  ⏳ Hold Period                          │
│  This commission releases on             │
│  April 9, 2026 (14 days remaining)      │
│                                          │
│  Commissions are held 30 days to protect │
│  against cancellations.                  │
└─────────────────────────────────────────┘
```

---

### 4.5 — Tier Progress Indicator

Shown on Partner Dashboard (both portals).

**Default tier thresholds** (from slab config defaults):
- Tier 1: 0–10 orgs
- Tier 2: 11–30 orgs
- Tier 3: 31+ orgs

**Render as a segmented progress bar:**

```
Tier 1          Tier 2          Tier 3
[===|========]  [          ]  [          ]
  8/10 orgs

Current: Tier 1 (10% new / 5% renewal)
Next:    Tier 2 at 11 orgs — 2 more orgs needed
```

**Implementation:**
```ts
// Fetch current slab config to get tier thresholds dynamically
// GET /slab-config
// Then calculate progress within the current tier band

const currentTier = slabConfig.tiers.find(t => t.tier === partner.current_tier);
const nextTier = slabConfig.tiers.find(t => t.tier === partner.current_tier + 1);

const progressInTier = partner.stats.total_orgs_referred - currentTier.min_orgs;
const tierBandSize = nextTier ? (nextTier.min_orgs - currentTier.min_orgs) : Infinity;
const progressPct = nextTier ? Math.min((progressInTier / tierBandSize) * 100, 100) : 100;
```

If partner is at maximum tier, show: "Maximum tier reached — earning X% on new subscriptions."

---

## 5. Form Specs

---

### 5.1 — KYC Details Form

Used in: Create Partner (`/admin/partners/new`)

| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|------------|-------------|
| Company Name | Text | Yes | 2–200 chars | "Acme Corp Pvt Ltd" |
| Contact Person Name | Text | Yes | 2–100 chars | "Rajan Garg" |
| Email | Email | Yes | Valid email format | "rajan@acmecorp.com" |
| Phone | Text | Yes | 10–15 digits | "9876543210" |
| Aadhar Number | Text | Yes | Exactly 12 digits | "123456789012" |
| PAN Number | Text | Yes | Exactly 10 chars, uppercase | "ABCDE1234F" |
| GST Number | Text | No | 15 chars if provided | "27ABCDE1234F1Z5" |
| DPIIT Number | Text | No | Max 50 chars | "DIPP12345" |

**Client-side validations:**
- Aadhar: `/^\d{12}$/`
- PAN: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/` (auto-uppercase input)
- GST: `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/`
- Phone: `/^\d{10,15}$/`

---

### 5.2 — Bank Details Form

Used in: Create Partner (`/admin/partners/new`) and Edit Partner (`/admin/partners/[id]/edit`)

| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|------------|-------------|
| Beneficiary Name | Text | Yes | 2–100 chars | "Acme Corp Pvt Ltd" |
| Account Number | Text | Yes | 9–18 digits | "123456789012" |
| IFSC Code | Text | Yes | Exactly 11 chars | "HDFC0001234" |
| Bank Name | Text | Yes | 2–100 chars | "HDFC Bank" |
| Branch | Text | No | Max 100 chars | "Connaught Place, New Delhi" |

**Client-side validations:**
- IFSC: `/^[A-Z]{4}0[A-Z0-9]{6}$/` (auto-uppercase)
- Account Number: `/^\d{9,18}$/`

---

### 5.3 — Referral Code Form

Used in: Create Referral Code (`/partner/referral-codes/new`)

| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|------------|-------------|
| Code | Text | Yes | 3–50 chars, alphanumeric + hyphens | "ACME2026" |
| Enable Pass-Through | Toggle/Checkbox | No | — | Off |
| Discount % | Decimal (shown only if pass-through enabled) | Conditional | 0–100 | "5.00" |
| Expires At | Date picker | No | Future date only | "No expiry" |

**Code field behavior:**
- Auto-uppercase on input
- Strip spaces and special characters (allow only `A-Z`, `0-9`, `-`)
- Show live preview: "Your referral code: ACME2026"

**Pass-through toggle:**
- When toggled ON: reveal the "Discount %" field with smooth animation
- Info text: _"Referred orgs get this % off their first subscription. This amount is deducted from your commission."_

---

### 5.4 — Edit Referral Code Form

Used in: Edit Referral Code (`/partner/referral-codes/[codeId]`)

| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|------------|-------------|
| Code | Text (read-only) | — | — | — |
| Enable Pass-Through | Toggle | No | — | Pre-filled |
| Discount % | Decimal (conditional) | Conditional | 0–100 | Pre-filled |
| Expires At | Date picker | No | Future date only, or clear | Pre-filled |
| Status | Select | No | `active` \| `inactive` | Pre-filled |

---

### 5.5 — Slab Config Form

Used in: Slab Config (`/admin/slab-config`)

Each tier row is an inline-editable table row:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Min Orgs | Number | Yes | ≥ 0; must be ≤ next tier's min_orgs - 1 |
| Max Orgs | Number | No | > min_orgs for same tier; leave blank for unlimited |
| New Rate (%) | Decimal | Yes | 0–100 |
| Renewal Rate (%) | Decimal | Yes | 0–100 |

**Cross-row validation:**
- Tiers must be sequential (tier numbers 1, 2, 3...)
- No gaps allowed: tier N's max_orgs + 1 must equal tier N+1's min_orgs
- Only the last tier can have `max_orgs = null`

---

### 5.6 — Generate Payout Form

Used in: Generate Payout (`/admin/payouts/new`)

| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|------------|-------------|
| Partner | Partner autocomplete / text | Yes | Must be a valid partner ID; partner must be `active` | "Search by company name..." |
| Period Start | Date picker | Yes | Must be before Period End | "Feb 1, 2026" |
| Period End | Date picker | Yes | Must be after Period Start; cannot be future date | "Feb 28, 2026" |

**Partner autocomplete behavior:**
- On type: debounce 300ms, call `GET /partners?search=<query>&limit=10`
- Show dropdown with company name + email
- On select: store `partner_id` in form state

**Info text below form:** _"Only PAYABLE commissions within this period will be included. Commissions already included in another statement are excluded."_

---

### 5.7 — Disburse Payout Form

Used in: Payout Statement Detail — "Record Disbursement" inline form (`/admin/payouts/[statementId]`)

| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|------------|-------------|
| Disbursed By | Text (auto-filled) | Yes | Admin user ID from auth context | Auto-filled, read-only |
| Disbursement Notes | Textarea | No | Max 500 chars | "NEFT ref: TXN123456, HDFC → ICICI" |

**Info banner above form:**
```
⚠️ Confirm bank transfer made
Make sure you have completed the bank transfer (NEFT/IMPS/RTGS) for
₹[net_payable] to [beneficiary_name] (A/C: XXXX[last 4 digits]).
This action will mark all included commissions as PAID and cannot be undone.
```

- "Confirm Disbursement" primary button (red to emphasize irreversibility)
- "Cancel" secondary button

---

## 6. State Management Guide

### Global Store (Zustand / Redux)

Cache the following data globally — they are shared across multiple pages and change infrequently:

| Key | Data | When to refresh |
|-----|------|-----------------|
| `slabConfig` | Full `SlabConfigResponse` | On mount of slab-config page; after PUT succeeds |
| `currentPartner` (Partner Portal only) | `PartnerResponse` for logged-in partner | On auth login; after any status update |
| `adminUser` | Admin user ID and display name | On auth login |

### Page-Level State (React Query / SWR)

Fetch fresh on every page visit — do NOT cache globally:

| Page | Data fetched |
|------|-------------|
| Partners list | `GET /partners` (paginated, filters change frequently) |
| Partner detail | `GET /partners/[id]` (stats update after commissions) |
| Commissions list | `GET /commissions` (statuses change after cron runs) |
| Payouts list | `GET /payouts` (status changes after admin actions) |
| Payout detail | `GET /payouts/[id]` (status changes during workflow) |
| Referral codes | `GET /referral-codes/partners/[id]` (usage stats update after checkout) |

### Optimistic Updates

Apply for these actions (revert on error):

| Action | Optimistic change |
|--------|------------------|
| Partner status change | Update status badge immediately |
| Referral code status toggle | Update badge immediately |
| Payout finalize | Update status badge to `finalized` |

### Cache Invalidation After Mutations

| Mutation | Invalidate these queries |
|----------|--------------------------|
| `POST /partners` | Partners list |
| `PATCH /partners/[id]/status` | Partners list + partner detail |
| `PUT /partners/[id]` | Partner detail |
| `POST /contracts` | Partner detail (contracts section) |
| `POST /contracts/[id]/admin-countersign` | Contract detail + partner detail |
| `PUT /referral-codes/[id]` | Referral codes list |
| `POST /commissions/release-payable` | Commissions list |
| `POST /payouts` | Payouts list |
| `POST /payouts/[id]/finalize` | Payout detail + Payouts list |
| `POST /payouts/[id]/disburse` | Payout detail + Payouts list + Partner detail |

---

## 7. Error Handling

### API Error Code → User-Friendly Message Mapping

| HTTP Status | API detail pattern | User-facing message |
|-------------|-------------------|---------------------|
| 400 | `"company_name: min_length..."` | Show inline below the offending field |
| 400 | `"party must be 'partner' or 'admin'"` | "Invalid request. Please refresh and try again." |
| 404 | `"Partner not found"` | "This partner could not be found. It may have been deleted." |
| 404 | `"Contract not found"` | "This contract could not be found." |
| 404 | `"Commission not found"` | "This commission record could not be found." |
| 404 | `"Payout statement not found"` | "This payout statement could not be found." |
| 404 | `"Referral code not found"` | "This referral code could not be found." |
| 409 | `"Partner email already exists"` | Show on email field: "A partner with this email already exists." |
| 409 | `"Invalid status transition"` | "This status change is not allowed at this stage." |
| 409 | `"Partner must be in approved status to create a contract"` | "Please approve the partner before creating a contract." |
| 409 | `"Contract must be in partner_signed status for admin countersign"` | "Waiting for partner signature before you can countersign." |
| 409 | `"No payable commissions found"` | "No payable commissions exist for this partner in the selected period." |
| 409 | `"Statement must be in draft status to finalize"` | "This statement has already been finalized." |
| 409 | `"Statement must be in finalized status to disburse"` | "Please finalize the statement before recording disbursement." |
| 500 | Any | "Something went wrong on our end. Please try again. If the issue persists, contact support." |
| Network error | (no response) | "Unable to connect. Check your internet connection and try again." |

### Error Display Patterns

- **Field-level errors** (400 validation): Shown as red helper text directly below the input field.
- **Form-level errors** (400 business errors, 409): Red banner at the top of the form.
- **Page-level errors** (404, 500): Centered error card replacing the page content with retry/back options.
- **Mutation errors** (actions on buttons): Toast notification (bottom-right, auto-dismiss after 5s).
- **Network errors**: Persistent top banner: "Connection lost. Retrying..." with manual retry button.

### Toast Notification Spec

```
Position: bottom-right
Duration: success = 3s, error = 5s, warning = 4s (persistent with close button for critical)
Types:
  - success: green background, CheckCircle icon
  - error:   red background, XCircle icon
  - warning: yellow background, AlertTriangle icon
  - info:    blue background, Info icon
```

---

## 8. Mobile Responsiveness Notes

The Partner Service is primarily an admin/partner back-office tool. Not all screens require full mobile optimization, but the following guidelines apply:

### Must Support Mobile (Partner Portal)

Partners may access these screens from mobile devices:

| Screen | Mobile adaptations |
|--------|-------------------|
| Partner Dashboard | Stack stat cards vertically; hide detailed table, show summary |
| Referral Codes List | Switch from grid to single-column; make copy-code button large (44px tap target) |
| Commissions List | Collapse table to card list; show only key fields (status, net, hold until) |
| Commission Detail | Single column layout; all fields readable |
| Payouts List | Card list instead of table |
| Payout Detail | Single column; summary first, commissions table below with horizontal scroll |

**Contract signing (Partner Portal Phase 2):** The file upload for partner signing must work on mobile (use `<input type="file" accept=".pdf">` — do not use drag-and-drop only). Upload URL expires in 5 minutes — warn the user before they start on slow connections.

### Desktop-Only (Admin Portal)

The Admin Portal can be desktop-only with minimum width `1024px`. Show a "Please use a desktop browser" message on smaller viewports. Pages with complex tables (commissions, payouts) are impractical on small screens and should not be artificially compressed.

### Breakpoints

```ts
// Tailwind config — default breakpoints
// sm: 640px  (mobile landscape)
// md: 768px  (tablet)
// lg: 1024px (desktop — minimum for admin)
// xl: 1280px (large desktop)
```

### Accessibility Minimums (Both Portals)

- All interactive elements must have `aria-label` or visible label text.
- Status badges must not convey information by color alone — always include text label.
- Confirmation dialogs must trap focus and be dismissible via Escape key.
- Form errors must be associated with their fields via `aria-describedby`.
- Minimum touch target size: 44×44px for all buttons on Partner Portal.

---

## Appendix A — Complete API Route Reference

| # | Phase | Method | Endpoint | Admin | Partner |
|---|-------|--------|----------|-------|---------|
| 1 | Slab Setup | GET | `/slab-config` | ✓ | — |
| 2 | Slab Setup | PUT | `/slab-config` | ✓ | — |
| 3 | Onboarding | POST | `/partners` | ✓ | — |
| 4 | Onboarding | GET | `/partners` | ✓ | — |
| 5 | Onboarding | GET | `/partners/{id}` | ✓ | ✓ (own) |
| 6 | Onboarding | PATCH | `/partners/{id}/status` | ✓ | — |
| 7 | Onboarding | PUT | `/partners/{id}` | ✓ | — |
| 8 | Contract | POST | `/contracts` | ✓ | — |
| 9 | Contract | GET | `/contracts` | ✓ | — |
| 10 | Contract | GET | `/contracts/{id}` | ✓ | — |
| 11 | Contract | GET | `/contracts/{id}/upload-url?party=partner` | ✓ | ✓ |
| 12 | Contract | GET | `/contracts/{id}/upload-url?party=admin` | ✓ | — |
| 13 | Contract | POST | `/contracts/{id}/partner-sign` | — | ✓ |
| 14 | Contract | POST | `/contracts/{id}/admin-countersign` | ✓ | — |
| 15 | Contract | POST | `/contracts/{id}/terminate` | ✓ | — |
| 16 | Referral Code | POST | `/referral-codes/partners/{id}` | — | ✓ |
| 17 | Referral Code | GET | `/referral-codes/partners/{id}` | ✓ | ✓ (own) |
| 18 | Referral Code | GET | `/referral-codes/{code_id}` | ✓ | ✓ (own) |
| 19 | Referral Code | PUT | `/referral-codes/{code_id}` | ✓ | ✓ (own) |
| 20 | Commission | GET | `/commissions` | ✓ | ✓ (own) |
| 21 | Commission | GET | `/commissions/{id}` | ✓ | ✓ (own) |
| 22 | Commission | POST | `/commissions/release-payable` | ✓ | — |
| 23 | Payout | POST | `/payouts` | ✓ | — |
| 24 | Payout | GET | `/payouts` | ✓ | ✓ (own) |
| 25 | Payout | GET | `/payouts/{id}` | ✓ | ✓ (own) |
| 26 | Payout | POST | `/payouts/{id}/finalize` | ✓ | — |
| 27 | Payout | POST | `/payouts/{id}/disburse` | ✓ | — |

---

## Appendix B — Data Masking Rules

Sensitive fields must be masked in the UI for display. The API returns raw values — masking is entirely a frontend concern.

| Field | Masking rule | Display example |
|-------|-------------|-----------------|
| `aadhar_number` | Show only last 4 digits | `XXXX XXXX 1234` |
| `account_number` | Show only last 4 digits | `XXXX XXXX 6789` |
| `pan_number` | Show full value (not sensitive for display) | `ABCDE1234F` |
| `ifsc_code` | Show full value | `HDFC0001234` |

On the "Edit Bank Details" form, show the masked value as placeholder and require the user to re-enter the full value to change it.
