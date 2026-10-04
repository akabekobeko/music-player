import type { DemoArtistSeed } from "../types.ts";

/**
 * Fictional artists of the demo library, grouped by the initial the Artist
 * view files them under (leading articles are ignored there, so "The Amber
 * Arcade" is listed under A).
 *
 * The names are made up or common placeholders (John Doe, Lorem Ipsum, Alice
 * and Bob). The number of artists per initial is uneven on purpose so the
 * list looks like a real library, and names with a leading "The", all
 * capitals and all lower case are mixed in.
 */
export const DEMO_ARTISTS: readonly DemoArtistSeed[] = [
  // A
  {
    name: "Abigail Thorne",
    person: true,
    genre: "Folk",
    startYear: 2009,
    albumCount: 4,
  },
  {
    name: "Acme Philharmonic",
    genre: "Classical",
    startYear: 1968,
    albumCount: 9,
  },
  { name: "Alice & Bob", genre: "Pop", startYear: 2018, albumCount: 3 },
  { name: "ALMANAC", genre: "Electronic", startYear: 1998, albumCount: 6 },
  { name: "The Amber Arcade", genre: "Rock", startYear: 1987, albumCount: 7 },
  { name: "aurora club", genre: "Ambient", startYear: 2019, albumCount: 2 },
  // B
  {
    name: "Bartholomew Quince",
    person: true,
    genre: "Jazz",
    startYear: 1961,
    albumCount: 12,
  },
  {
    name: "Beatrix Vale",
    person: true,
    genre: "Pop",
    startYear: 2021,
    albumCount: 2,
  },
  { name: "birdsong radio", genre: "Ambient", startYear: 2011, albumCount: 3 },
  { name: "The Blue Lanterns", genre: "Rock", startYear: 1972, albumCount: 15 },
  { name: "BRASSWORKS", genre: "Jazz", startYear: 1994, albumCount: 5 },
  {
    name: "Bruno Halloway",
    person: true,
    genre: "Blues",
    startYear: 1979,
    albumCount: 4,
  },
  // C
  { name: "Carol & Dave", genre: "Folk", startYear: 2003, albumCount: 2 },
  {
    name: "The Cardboard Kings",
    genre: "Rock",
    startYear: 2006,
    albumCount: 5,
  },
  {
    name: "Cedric Moon",
    person: true,
    genre: "Hip Hop",
    startYear: 2012,
    albumCount: 3,
  },
  { name: "CITRUS", genre: "Pop", startYear: 2023, albumCount: 1 },
  {
    name: "Clementine Hart",
    person: true,
    genre: "Jazz",
    startYear: 1999,
    albumCount: 6,
  },
  // D
  {
    name: "Daisy Calloway",
    person: true,
    genre: "Pop",
    startYear: 1989,
    albumCount: 8,
  },
  { name: "DELTA NINE", genre: "Electronic", startYear: 2001, albumCount: 4 },
  {
    name: "Dolor Sit Amet",
    genre: "Classical",
    startYear: 1983,
    albumCount: 3,
  },
  {
    name: "The Driftwood Choir",
    genre: "Folk",
    startYear: 2010,
    albumCount: 2,
  },
  // E
  {
    name: "Edgar Finch",
    person: true,
    genre: "Blues",
    startYear: 1966,
    albumCount: 5,
  },
  { name: "ember & ash", genre: "Folk", startYear: 2022, albumCount: 1 },
  {
    name: "Example Orchestra",
    genre: "Soundtrack",
    startYear: 1995,
    albumCount: 7,
  },
  // F
  {
    name: "Felix Harrow",
    person: true,
    genre: "Hip Hop",
    startYear: 2008,
    albumCount: 4,
  },
  { name: "FJORD", genre: "Ambient", startYear: 2005, albumCount: 3 },
  { name: "The Foobars", genre: "Rock", startYear: 1996, albumCount: 6 },
  // G
  {
    name: "Gideon Marsh",
    person: true,
    genre: "Blues",
    startYear: 1974,
    albumCount: 3,
  },
  { name: "glass harbor", genre: "Electronic", startYear: 2019, albumCount: 2 },
  { name: "The Golden Hours", genre: "Pop", startYear: 1981, albumCount: 5 },
  // H
  {
    name: "Hazel Whitlock",
    person: true,
    genre: "Folk",
    startYear: 1971,
    albumCount: 4,
  },
  { name: "Hello World", genre: "Electronic", startYear: 2013, albumCount: 3 },
  { name: "The Hollow Pines", genre: "Rock", startYear: 2002, albumCount: 2 },
  // I
  {
    name: "Ingrid Solberg",
    person: true,
    genre: "Classical",
    startYear: 1992,
    albumCount: 4,
  },
  { name: "IRON LANTERN", genre: "Rock", startYear: 1984, albumCount: 10 },
  // J
  {
    name: "Jane Doe",
    person: true,
    genre: "Pop",
    startYear: 2007,
    albumCount: 5,
  },
  { name: "John Doe Trio", genre: "Jazz", startYear: 1969, albumCount: 8 },
  { name: "juniper lane", genre: "Folk", startYear: 2020, albumCount: 1 },
  // K
  { name: "Kestrel", genre: "Rock", startYear: 1993, albumCount: 3 },
  { name: "The Kite Makers", genre: "Pop", startYear: 2017, albumCount: 2 },
  // L
  { name: "The Lamplighters", genre: "Jazz", startYear: 1964, albumCount: 6 },
  { name: "Lorem Ipsum", genre: "Electronic", startYear: 2000, albumCount: 5 },
  {
    name: "Lucille Fairweather",
    person: true,
    genre: "Blues",
    startYear: 1977,
    albumCount: 2,
  },
  { name: "LUMEN", genre: "Ambient", startYear: 2009, albumCount: 4 },
  // M
  {
    name: "Mallory Quinn",
    person: true,
    genre: "Hip Hop",
    startYear: 2020,
    albumCount: 2,
  },
  { name: "The Marigold Tapes", genre: "Rock", startYear: 1990, albumCount: 5 },
  { name: "MERIDIAN", genre: "Classical", startYear: 1986, albumCount: 3 },
  {
    name: "Milo Ashgrove",
    person: true,
    genre: "Electronic",
    startYear: 2011,
    albumCount: 4,
    playable: {
      albumIndex: 3,
      albumTitle: "Modulations",
      trackTitle: "Test Tone Serenade",
    },
  },
  {
    name: "Mock Turtle Society",
    genre: "Pop",
    startYear: 1976,
    albumCount: 7,
  },
  { name: "moss & mirror", genre: "Ambient", startYear: 2024, albumCount: 1 },
  // N
  {
    name: "Nadia Brooks",
    person: true,
    genre: "Pop",
    startYear: 2004,
    albumCount: 3,
  },
  {
    name: "The Null Pointers",
    genre: "Electronic",
    startYear: 1997,
    albumCount: 4,
  },
  // O
  {
    name: "Oliver Stagg",
    person: true,
    genre: "Blues",
    startYear: 1970,
    albumCount: 6,
  },
  { name: "opal", genre: "Pop", startYear: 2021, albumCount: 1 },
  // P
  {
    name: "Penelope Wren",
    person: true,
    genre: "Classical",
    startYear: 2001,
    albumCount: 3,
  },
  { name: "The Placeholders", genre: "Rock", startYear: 1999, albumCount: 4 },
  { name: "PRISM CITY", genre: "Electronic", startYear: 2020, albumCount: 2 },
  // Q
  {
    name: "Quentin Lark",
    person: true,
    genre: "Jazz",
    startYear: 1988,
    albumCount: 5,
  },
  // R
  {
    name: "Richard Roe",
    person: true,
    genre: "Folk",
    startYear: 1967,
    albumCount: 3,
  },
  {
    name: "Rosalind Pike",
    person: true,
    genre: "Soundtrack",
    startYear: 2006,
    albumCount: 4,
  },
  {
    name: "The Rust Belt Revival",
    genre: "Rock",
    startYear: 1980,
    albumCount: 8,
  },
  // S
  {
    name: "The Sample Rates",
    genre: "Electronic",
    startYear: 2010,
    albumCount: 3,
  },
  {
    name: "Sebastian Crowe",
    person: true,
    genre: "Rock",
    startYear: 1975,
    albumCount: 15,
  },
  { name: "silver lining", genre: "Pop", startYear: 2019, albumCount: 2 },
  { name: "SOLSTICE", genre: "Ambient", startYear: 1991, albumCount: 6 },
  { name: "Sunday Static", genre: "Rock", startYear: 2025, albumCount: 1 },
  {
    name: "Sylvia Northcott",
    person: true,
    genre: "Jazz",
    startYear: 1982,
    albumCount: 4,
  },
  // T
  {
    name: "Tabitha Greene",
    person: true,
    genre: "Folk",
    startYear: 1998,
    albumCount: 3,
  },
  { name: "Test Pattern", genre: "Electronic", startYear: 2007, albumCount: 5 },
  { name: "The Tin Soldiers", genre: "Rock", startYear: 1965, albumCount: 9 },
  { name: "TUNDRA", genre: "Ambient", startYear: 2018, albumCount: 2 },
  // U
  {
    name: "Una Whitmore",
    person: true,
    genre: "Classical",
    startYear: 1978,
    albumCount: 2,
  },
  // V
  {
    name: "Violet Underhill",
    person: true,
    genre: "Pop",
    startYear: 1994,
    albumCount: 3,
  },
  // W
  {
    name: "Walter Plinge",
    person: true,
    genre: "Soundtrack",
    startYear: 1973,
    albumCount: 5,
  },
  {
    name: "The Wandering Hours",
    genre: "Folk",
    startYear: 2005,
    albumCount: 3,
  },
  { name: "wren & wolf", genre: "Hip Hop", startYear: 2020, albumCount: 1 },
  // X
  { name: "Xyzzy", genre: "Electronic", startYear: 2003, albumCount: 2 },
  // Y
  { name: "Yonder Valley", genre: "Folk", startYear: 1985, albumCount: 4 },
  // Z
  {
    name: "Zebedee Flint",
    person: true,
    genre: "Blues",
    startYear: 1963,
    albumCount: 3,
  },
  // Other (digits and non-Latin scripts)
  { name: "7 Days of Rain", genre: "Rock", startYear: 2011, albumCount: 2 },
  { name: "808 Motel", genre: "Hip Hop", startYear: 2021, albumCount: 2 },
  {
    name: "山田太郎",
    person: true,
    slug: "yamada-taro",
    genre: "Pop",
    startYear: 1996,
    albumCount: 3,
  },
];
