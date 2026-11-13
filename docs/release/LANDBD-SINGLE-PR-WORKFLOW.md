# LandBD single-PR release workflow

Effective 2026-11-14.

- All remaining LandBD work goes to one integration branch: `integration/landbd-complete-20261114`.
- There is one release pull request to `main`.
- Do not create separate feature/release PRs for remaining completion work.
- Keep that PR in draft until the agreed backlog is complete and final QA passes.
- Do not merge to `main`, promote a preview, or deploy production before final approval.
- Batch commits where practical to reduce Vercel preview builds and preserve the deployment quota.
- GitHub remains the source of truth; production rollback must remain available.

Superseded PRs are preserved in GitHub history for auditability, but no longer serve as release paths.
