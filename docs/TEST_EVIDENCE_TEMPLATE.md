# Test evidence

Run `cd server && npm test` and paste the actual terminal output below after execution.

| Test | Expected result | Actual result |
|---|---|---|
| FEFO selects earliest expiry first | Pass | Pending execution |
| FEFO splits sale across batches | Pass | Pending execution |
| Expired batch excluded | Rejected | Pending execution |
| Insufficient valid stock | Rejected | Pending execution |
| Zero/invalid quantity | Rejected | Pending execution |

Do not mark tests as passed until the command has been run and output verified.
