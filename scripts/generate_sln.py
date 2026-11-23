#!/usr/bin/env python3
"""Generates CoachingManagement.sln (classic format, opens in VS / Rider / dotnet CLI) with solution folders.
Usage: python3 scripts/generate_sln.py   (run from anywhere)"""
import hashlib, pathlib, uuid

root = pathlib.Path(__file__).resolve().parent.parent
CS, FOLDER = "{9A19103F-16F7-4668-BE54-9A1E7A4F7556}", "{2150E333-8FDC-42A3-9474-1A3956D46DE8}"

def guid(key):  # deterministic, so regenerating gives a stable diff
    return "{" + str(uuid.UUID(hashlib.md5(key.encode()).hexdigest())).upper() + "}"

projects = sorted(p.relative_to(root) for p in (root / "src").rglob("*.csproj"))
folders, nested, entries = {}, [], []

def folder(path):  # ensure every ancestor solution folder exists; return its guid
    if path not in folders:
        folders[path] = guid("folder:" + path)
        parent = str(pathlib.PurePosixPath(path).parent)
        if parent != ".":
            nested.append((folders[path], folder(parent)))
    return folders[path]

for p in projects:
    parts = p.parts                      # src/Services/Attendance/Attendance.Api/Attendance.Api.csproj
    g = guid("proj:" + p.as_posix())
    entries.append((p.stem, p.as_posix().replace("/", "\\"), g))
    # solution folder = directory two levels up from the project (e.g. src/Services/Attendance); gateway sits in "src"
    parent_dir = "/".join(parts[1:-2]) if len(parts) > 3 else ""
    if parent_dir:
        nested.append((g, folder(parent_dir)))

out = ["", "Microsoft Visual Studio Solution File, Format Version 12.00", "# Visual Studio Version 17",
       "VisualStudioVersion = 17.0.31903.59", "MinimumVisualStudioVersion = 10.0.40219.1"]
for path, g in sorted(folders.items()):
    out += [f'Project("{FOLDER}") = "{pathlib.PurePosixPath(path).name}", "{pathlib.PurePosixPath(path).name}", "{g}"', "EndProject"]
for name, rel, g in entries:
    out += [f'Project("{CS}") = "{name}", "{rel}", "{g}"', "EndProject"]
out += ["Global", "\tGlobalSection(SolutionConfigurationPlatforms) = preSolution",
        "\t\tDebug|Any CPU = Debug|Any CPU", "\t\tRelease|Any CPU = Release|Any CPU", "\tEndGlobalSection",
        "\tGlobalSection(ProjectConfigurationPlatforms) = postSolution"]
for _, _, g in entries:
    for c in ("Debug", "Release"):
        out += [f"\t\t{g}.{c}|Any CPU.ActiveCfg = {c}|Any CPU", f"\t\t{g}.{c}|Any CPU.Build.0 = {c}|Any CPU"]
out += ["\tEndGlobalSection", "\tGlobalSection(SolutionProperties) = preSolution", "\t\tHideSolutionNode = FALSE", "\tEndGlobalSection",
        "\tGlobalSection(NestedProjects) = preSolution"]
out += [f"\t\t{c} = {p}" for c, p in nested]
out += ["\tEndGlobalSection", "EndGlobal", ""]
(root / "CoachingManagement.sln").write_text("\r\n".join(out), encoding="utf-8-sig")
print(f"Wrote CoachingManagement.sln with {len(entries)} projects in {len(folders)} solution folders")
