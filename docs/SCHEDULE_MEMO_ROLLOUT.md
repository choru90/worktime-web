# Schedule memo rollout

Both schedule proposal forms send non-empty memo text (maximum 500 UTF-16 code
units); an empty optional field stays omitted. Text is preserved without trimming
and React renders it as text in the existing schedule list.

This web change requires the backend's nullable schedule memo request/storage/
response support and Flyway V7. Apply V7, finish deploying the supporting backend
on **all** serving instances, verify create/detail/list round-trip, then deploy web.
Do not deploy web first: the old backend accepts but silently discards unknown memo.
Old web/mobile can use the new backend by omitting memo and ignoring the additive
response field. Existing schedules with no memo still display `-`.

Rollback web first; retain the nullable memo column and stored data. If rolling
backend back, remove all memo-enabled web writers first. No merge or deployment
is performed by these PRs. See backend docs/SCHEDULE_MEMO_ROLLOUT.md and the PR
dependency link for the schema and API tests.
