#!/bin/sh
# Run this on every deploy. Open pages notice the new version within ~1 minute and refresh themselves.
cd "$(dirname "$0")" && printf '{ "version": "%s" }\n' "$(date -u +%Y-%m-%d.%H%M%S)" > version.json && cat version.json
