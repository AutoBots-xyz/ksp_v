# AppSail (optional heavy workers)

Dockerized runtime for long-running / custom-runtime jobs that exceed Catalyst Function limits.
Reference: TECH_STACK.md #1, CATALYST_INTEGRATION.md #14.

## ml-worker

Python/Node ML feature engineering + training batch jobs invoked by Cron/Circuit.
Only used if Function timeouts are hit (per ADR-008).

```
ml-worker/
  Dockerfile
  src/
```
