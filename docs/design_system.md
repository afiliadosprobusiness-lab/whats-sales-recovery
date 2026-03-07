# RecuperaVentas - Design System (MVP)

## 1) UX principles

- Clarity first: user should identify at-risk conversations in seconds.
- Action-oriented UI: primary actions are "send recovery", "mark won", "close".
- Low cognitive load: minimal navigation for MVP.
- Mobile-safe layouts for sales teams working from phone/laptop.

## 2) Information architecture

- `Login`
- `Dashboard`
- `Conversations`
- `Templates`
- `Settings > WhatsApp Channel`

## 3) Layout patterns

- App shell: left sidebar + top header + content area.
- Dashboard cards row:
  - Idle conversations
  - Recoveries sent
  - Customers replied
  - Sales recovered
- Split view in Conversations:
  - Left: conversation list with status chips (`open`, `idle`, `closed`)
  - Right: thread detail + recovery timeline + action buttons

## 4) Visual hierarchy

- Primary emphasis: `idle` conversations.
- Secondary emphasis: recoveries pending send/failure.
- Neutral style for closed/won conversations.

Status colors (semantic):
- `idle`: warning/amber
- `recovered`: success/green
- `failed`: error/red
- `open`: info/blue
- `closed`: neutral/gray

## 5) Core UI components

- `KpiCard`
- `ConversationRow`
- `StatusChip`
- `MessageBubble` (`inbound`/`outbound`)
- `RecoveryTimelineItem`
- `PrimaryActionButton`
- `ConfirmDialog`
- `EmptyState`
- `ErrorState`
- `PaginationCursor`

## 6) Page behavior

### Dashboard
- Shows recovery funnel metrics for selected date range.
- Default range: last 7 days.

### Conversations
- Filters: status, last activity, unrecovered only.
- Sticky actions in detail panel:
  - Trigger recovery (if eligible)
  - Mark sale recovered
  - Close conversation

### Templates
- Single active template in MVP (simple policy).
- Inline validation for placeholder variables.

### Settings
- WhatsApp channel connection status.
- Webhook verification health.
- Default idle threshold (hours).

## 7) States and feedback

- Loading:
  - Skeleton for list and thread.
- Empty:
  - "No idle conversations right now."
- Error:
  - Retry CTA for failed fetch/send.
- Success:
  - Toast after sending recovery or marking sale recovered.

## 8) Accessibility baseline

- Keyboard navigation for list and actions.
- Color contrast WCAG AA.
- Status not represented by color only (chip text required).
- Buttons with explicit labels, no icon-only critical actions.

