#!/bin/bash
# Regenerates CoachingManagement.sln (including tests), then restores, builds, and tests it.
# Requires: .NET 9 SDK and python3.
set -e
cd "$(dirname "$0")/.."
python3 scripts/generate-sln.py
dotnet restore CoachingManagement.sln
dotnet build CoachingManagement.sln --no-restore
dotnet test CoachingManagement.sln --no-build
