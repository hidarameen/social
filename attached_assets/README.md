# attached_assets

This folder is reserved for runtime assets that may be referenced by the Next.js app.

It is intentionally kept in git so the Docker build step `COPY attached_assets ./attached_assets` does not fail even when no additional assets are present.
