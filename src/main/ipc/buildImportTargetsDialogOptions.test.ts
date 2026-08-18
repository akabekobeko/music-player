import { expect, it } from "vitest";
import { AUDIO_FILE_EXTENSIONS } from "../library/AUDIO_FILE_EXTENSIONS";
import { buildImportTargetsDialogOptions } from "./buildImportTargetsDialogOptions";

it("allows picking files and directories with multi-selection", () => {
  const options = buildImportTargetsDialogOptions(null);
  expect(options.properties).toEqual(
    expect.arrayContaining(["openFile", "openDirectory", "multiSelections"]),
  );
});

it("filters to the importable audio extensions", () => {
  const options = buildImportTargetsDialogOptions(null);
  expect(options.filters).toEqual([
    { name: "Audio Files", extensions: [...AUDIO_FILE_EXTENSIONS] },
  ]);
});

it("opens at the given default path", () => {
  const options = buildImportTargetsDialogOptions("/music/albums");
  expect(options.defaultPath).toBe("/music/albums");
});

it("leaves the location to the OS when no default path is given", () => {
  expect(buildImportTargetsDialogOptions(null)).not.toHaveProperty(
    "defaultPath",
  );
});
