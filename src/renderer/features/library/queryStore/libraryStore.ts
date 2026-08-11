import { createQueryStore } from "./createQueryStore";
import { fetchLibraryQuery } from "./fetchLibraryQuery";

/** The app-wide library query store. */
export const libraryStore = createQueryStore(fetchLibraryQuery);
