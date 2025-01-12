import { writeFile } from "fs/promises";
import manifest from "./manifest.json" with { type: "json" };
import versions from "./versions.json" with { type: "json" };

const targetVersion = process.env["npm_package_version"] ?? "0";

// read minAppVersion from manifest.json and bump version to target version
manifest.version = targetVersion;
await writeFile("manifest.json", JSON.stringify(manifest, null, 2));

// update versions.json with target version and minAppVersion from manifest.json
/** @type {Record<string, string>} */
const newVersions = Object.assign({}, versions);
newVersions[targetVersion] = manifest.minAppVersion;
await writeFile("versions.json", JSON.stringify(newVersions, null, 2));
