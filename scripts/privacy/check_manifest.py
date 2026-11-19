"""Check the app's iOS privacy manifest against the libraries we ship.

Apple rejects uploads whose privacy manifest leaves out a "required reason" API
that the app or its libraries use. Expo's guide says CocoaPods does not always
merge the libraries' own PrivacyInfo.xcprivacy files, so the reasons should be
copied into app.json (expo.ios.privacyManifests).

This script reads every PrivacyInfo.xcprivacy in node_modules (skipping example
apps and the Google Maps bundle, which we don't use on iOS), and reports any
API category or reason code missing from app.json.

Run after `npm install` or any library upgrade:
    python3 -I scripts/privacy/check_manifest.py
Exit code 1 means app.json needs updating.
"""
import collections
import glob
import json
import os
import plistlib
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKIP = ("/example", "/AirGoogleMaps/", "/Example")


def package_of(path: str) -> str:
    parts = path.split("node_modules/")[-1].split("/")
    return "/".join(parts[:2]) if parts[0].startswith("@") else parts[0]


def library_reasons():
    need = collections.defaultdict(set)
    who = collections.defaultdict(set)
    for f in glob.glob(os.path.join(ROOT, "node_modules", "**", "PrivacyInfo.xcprivacy"), recursive=True):
        if any(s in f for s in SKIP):
            continue
        with open(f, "rb") as fh:
            data = plistlib.load(fh)
        for entry in data.get("NSPrivacyAccessedAPITypes", []):
            cat = entry["NSPrivacyAccessedAPIType"]
            need[cat] |= set(entry.get("NSPrivacyAccessedAPITypeReasons", []))
            who[cat].add(package_of(f))
    return need, who


def app_reasons():
    with open(os.path.join(ROOT, "app.json"), encoding="utf-8") as fh:
        cfg = json.load(fh)
    pm = cfg["expo"]["ios"].get("privacyManifests", {})
    have = collections.defaultdict(set)
    for entry in pm.get("NSPrivacyAccessedAPITypes", []):
        have[entry["NSPrivacyAccessedAPIType"]] |= set(entry.get("NSPrivacyAccessedAPITypeReasons", []))
    return have


def main() -> int:
    if not os.path.isdir(os.path.join(ROOT, "node_modules")):
        print("Run npm install first.")
        return 2
    need, who = library_reasons()
    have = app_reasons()
    missing = 0
    for cat in sorted(need):
        gap = need[cat] - have.get(cat, set())
        status = "ok" if not gap else "MISSING " + ", ".join(sorted(gap))
        if gap:
            missing += 1
        print(f"{cat}: {', '.join(sorted(need[cat]))}  [{status}]  from {', '.join(sorted(who[cat]))}")
    if missing:
        print("\nAdd the missing reasons to expo.ios.privacyManifests in app.json.")
        return 1
    print("\napp.json declares every required reason our libraries use.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
