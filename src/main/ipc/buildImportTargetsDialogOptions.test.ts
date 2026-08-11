import { expect, it } from "vitest";
import { AUDIO_FILE_EXTENSIONS } from "../library/AUDIO_FILE_EXTENSIONS";
import { buildImportTargetsDialogOptions } from "./buildImportTargetsDialogOptions";

it("allows picking files and directories with multi-selection", () => {
  const options = buildImportTargetsDialogOptions();
  expect(options.properties).toEqual(
    expect.arrayContaining(["openFile", "openDirectory", "multiSelections"]),
  );
});

it("filters to the importable audio extensions", () => {
  const options = buildImportTargetsDialogOptions();
  expect(options.filters).toEqual([
    { name: "Audio Files", extensions: [...AUDIO_FILE_EXTENSIONS] },
  ]);
});
