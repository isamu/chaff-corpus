# Incident Report: Duplicate Card Charges on November 3, 2026

**Report date:** November 5, 2026
**Prepared by:** Engineering Operations
**Severity:** High (customer financial impact)

## 1. Summary

Between 14:10 and 15:02 UTC on November 3, 2026, 1,284 customers who placed orders through the online store were charged twice for the same order. The duplicate charges totaled $96,318. All duplicate charges were refunded by 21:30 UTC on November 4. No card data was exposed.

## 2. Impact

- 1,284 customers were charged twice. Of these, 211 contacted customer support.
- Some customers saw both charges as pending on their card statements for up to 48 hours, depending on their bank.
- Order fulfillment was not affected; each customer received one order.

## 3. Timeline (UTC)

| Time | Event |
|---|---|
| 13:55, Nov 3 | Release 4.18.0 deployed to production |
| 14:10 | First duplicate charge recorded |
| 14:41 | Customer support reports an unusual number of "charged twice" contacts |
| 14:48 | On-call engineer begins investigation |
| 14:57 | Cause identified as the retry change in release 4.18.0 |
| 15:02 | Release 4.18.0 rolled back; no further duplicate charges |
| 16:30 | Affected orders identified |
| 21:30, Nov 4 | All duplicate charges refunded |

## 4. Root Cause

Release 4.18.0 changed how the checkout service retries a payment request when the payment provider does not respond within 5 seconds. The new retry logic did not send the idempotency key that the provider uses to recognize a repeated request. When the provider's response was slow, which happened frequently during a period of high load at the provider between 14:00 and 15:00, the provider treated each retry as a new payment.

The change passed automated tests because the test environment's mock payment provider does not enforce idempotency keys.

## 5. Contributing Factors

- No alert existed for an abnormal number of payments per order.
- The first signal came from customer support, 31 minutes after the first duplicate charge.

## 6. Corrective Actions

| Action | Owner | Due date | Status |
|---|---|---|---|
| Fix retry logic to always include the idempotency key | Payments team | Nov 6 | In progress |
| Update the mock payment provider to enforce idempotency keys | Platform team | Nov 13 | Not started |
| Add an alert when an order has more than one successful charge | SRE team | Nov 10 | Not started |
| Require a payments team review for any change to checkout retry behavior | Engineering leads | Nov 13 | Not started |

## 7. Customer Communication

An apology email was sent to all affected customers on November 4, confirming the refund and the expected time for it to appear on their statements. Customer support has been given a script for follow-up questions.
