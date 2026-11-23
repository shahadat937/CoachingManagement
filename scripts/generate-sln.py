#!/usr/bin/env python3
"""Regenerates CoachingManagement.sln from source and test projects."""
import uuid, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
CS, FOLDER = "{9A19103F-16F7-4668-BE54-9A1E7A4F7556}", "{2150E333-8FDC-42A3-9474-1A3956D46DE8}"
guid = lambda s: "{%s}" % str(uuid.uuid5(uuid.NAMESPACE_URL, "coaching/" + s)).upper()

projects = sorted([*root.glob("src/**/*.csproj"), *root.glob("tests/**/*.csproj")])
folders, nested, entries = {}, [], []   # folders: key -> (name, parent_key|None)

def folder(key, name, parent=None):
    folders.setdefault(key, (name, parent))
    return guid("folder/" + key)

for p in projects:
    rel = p.relative_to(root)
    parts = rel.parts                      # src/Services/Students/Students.Api/Students.Api.csproj
    name = p.stem
    parent = None
    if parts[1] == "BuildingBlocks":
        parent = folder("BuildingBlocks", "BuildingBlocks")
    elif parts[1] == "Services":
        folder("Services", "Services")
        parent = folder("Services/" + parts[2], parts[2], "Services")
    elif parts[0] == "tests":
        parent = folder("Tests", "Tests")
    pid = guid("project/" + name)
    entries.append((name, str(rel).replace("/", "\\"), pid))
    if parent: nested.append((pid, parent))

for key, (name, par) in folders.items():
    if par: nested.append((guid("folder/" + key), guid("folder/" + par)))

out = ["", "Microsoft Visual Studio Solution File, Format Version 12.00", "# Visual Studio Version 17",
       "VisualStudioVersion = 17.0.31903.59", "MinimumVisualStudioVersion = 10.0.40219.1"]
for key, (name, _) in folders.items():
    out += [f'Project("{FOLDER}") = "{name}", "{name}", "{guid("folder/" + key)}"', "EndProject"]
for name, path, pid in entries:
    out += [f'Project("{CS}") = "{name}", "{path}", "{pid}"', "EndProject"]
out += ["Global", "\tGlobalSection(SolutionConfigurationPlatforms) = preSolution",
        "\t\tDebug|Any CPU = Debug|Any CPU", "\t\tRelease|Any CPU = Release|Any CPU", "\tEndGlobalSection",
        "\tGlobalSection(ProjectConfigurationPlatforms) = postSolution"]
for _, _, pid in entries:
    for cfg in ("Debug", "Release"):
        out += [f"\t\t{pid}.{cfg}|Any CPU.ActiveCfg = {cfg}|Any CPU", f"\t\t{pid}.{cfg}|Any CPU.Build.0 = {cfg}|Any CPU"]
out += ["\tEndGlobalSection", "\tGlobalSection(SolutionProperties) = preSolution", "\t\tHideSolutionNode = FALSE", "\tEndGlobalSection",
        "\tGlobalSection(NestedProjects) = preSolution"]
out += [f"\t\t{c} = {p}" for c, p in nested]
out += ["\tEndGlobalSection", "EndGlobal", ""]
(root / "CoachingManagement.sln").write_text("\r\n".join(out), encoding="utf-8-sig")
print(f"Wrote CoachingManagement.sln with {len(entries)} projects")
