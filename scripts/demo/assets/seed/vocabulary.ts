import type { DemoGenre } from "../types.ts";

/** Adjectives for album and track titles. */
export const ADJECTIVES = [
  "Amber",
  "Hollow",
  "Quiet",
  "Electric",
  "Golden",
  "Paper",
  "Silver",
  "Midnight",
  "Distant",
  "Velvet",
  "Broken",
  "Wild",
  "Slow",
  "Northern",
  "Southern",
  "Crimson",
  "Blue",
  "Violet",
  "Gentle",
  "Restless",
  "Borrowed",
  "Hidden",
  "Painted",
  "Empty",
  "Burning",
  "Frozen",
  "Lonely",
  "Secret",
  "Wandering",
  "Faded",
  "Neon",
  "Crooked",
  "Sleepless",
  "Open",
  "Lost",
  "Bright",
  "Heavy",
  "Little",
  "Last",
  "Endless",
  "Familiar",
  "Strange",
  "Sudden",
  "Winter",
  "Summer",
  "Autumn",
  "Early",
  "Late",
  "Half",
  "Plain",
] as const;

/** Nouns for album and track titles. */
export const NOUNS = [
  "River",
  "Lantern",
  "Garden",
  "Mirror",
  "Harbor",
  "Window",
  "Machine",
  "Letter",
  "Shadow",
  "Engine",
  "Meadow",
  "Signal",
  "Compass",
  "Thunder",
  "Feather",
  "Station",
  "Horizon",
  "Orchard",
  "Tide",
  "Ember",
  "Avenue",
  "Carousel",
  "Atlas",
  "Satellite",
  "Echo",
  "Parade",
  "Canyon",
  "Lighthouse",
  "Telegram",
  "Postcard",
  "Rooftop",
  "Sparrow",
  "Tunnel",
  "Bridge",
  "Morning",
  "Evening",
  "Motel",
  "Highway",
  "Ocean",
  "Desert",
  "Forest",
  "Mountain",
  "Island",
  "Kingdom",
  "Theatre",
  "Balcony",
  "Staircase",
  "Ballroom",
  "Diary",
  "Map",
  "Clock",
  "Radio",
  "Camera",
  "Telescope",
  "Umbrella",
  "Bicycle",
  "Kite",
  "Candle",
  "Anchor",
  "Comet",
  "Circuit",
  "Glacier",
  "Valley",
  "Almanac",
  "Blueprint",
  "Daydream",
  "Weather",
  "Static",
  "Season",
  "Sunday",
] as const;

/** Leading verbs for track titles such as "Chasing the River". */
export const VERBS = [
  "Chasing",
  "Waiting for",
  "Leaving",
  "Counting",
  "Painting",
  "Following",
  "Burning",
  "Building",
  "Finding",
  "Losing",
  "Holding",
  "Calling",
] as const;

/** Trailing phrases for track titles such as "Lantern in the Rain". */
export const SETTINGS = [
  "in the Rain",
  "in the Dark",
  "in Slow Motion",
  "in Reverse",
  "in June",
  "in October",
  "at Dawn",
  "at Dusk",
  "by the Sea",
  "on Fire",
] as const;

/** Venues for live album titles such as "Live at Harbor Hall". */
export const VENUES = [
  "Harbor Hall",
  "the Lantern Room",
  "Maple Street",
  "the Old Mill",
  "the Corner Club",
  "Juniper Hall",
  "the Blue Door",
  "Station Nine",
  "the Grand Arcade",
] as const;

/** Album titles of orchestral releases. */
export const CLASSICAL_ALBUMS = [
  "Symphonies Nos. 2 & 5",
  "Piano Concertos",
  "String Quartets, Vol. 1",
  "String Quartets, Vol. 2",
  "Nocturnes",
  "Chamber Works",
  "Preludes & Fugues",
  "Suites for Orchestra",
  "Serenades",
  "Sonatas for Violin",
  "Overtures",
  "Dances & Variations",
  "The Late Sonatas",
  "Concertos for Strings",
] as const;

/** Work names for classical track titles. */
export const CLASSICAL_WORKS = [
  "Symphony",
  "Piano Concerto",
  "String Quartet",
  "Suite",
  "Sonata",
  "Serenade",
  "Concerto for Strings",
] as const;

/** Keys for classical track titles. */
export const CLASSICAL_KEYS = [
  "C major",
  "D minor",
  "E-flat major",
  "F major",
  "G minor",
  "A major",
  "B-flat major",
  "C-sharp minor",
] as const;

/** Tempo markings for classical movements. */
export const CLASSICAL_TEMPOS = [
  "Allegro",
  "Adagio",
  "Andante",
  "Presto",
  "Largo",
  "Scherzo",
  "Allegretto",
  "Vivace",
  "Moderato",
] as const;

/** Roman numerals for classical movements. */
export const ROMAN_NUMERALS = ["I", "II", "III", "IV"] as const;

/** Japanese album titles for the artist with a Japanese name. */
export const JAPANESE_ALBUMS = ["はじまりの歌", "四季", "日々のうた"] as const;

/** Japanese track titles for the artist with a Japanese name. */
export const JAPANESE_TRACKS = [
  "春の足音",
  "夏の終わり",
  "秋桜",
  "冬の星座",
  "帰り道",
  "雨上がり",
  "夜明け前",
  "遠い街",
  "手紙",
  "約束",
  "風の歌",
  "海へ",
  "月明かり",
  "影法師",
  "花火",
  "坂道",
  "窓辺",
  "旅立ち",
  "灯り",
  "波の音",
  "朝焼け",
  "夕暮れ",
  "星屑",
  "紙飛行機",
  "忘れもの",
  "駅",
  "川沿い",
  "口笛",
  "ひとりごと",
  "おやすみ",
  "木漏れ日",
  "通り雨",
  "追伸",
  "陽だまり",
  "砂時計",
  "路地裏",
  "屋上",
  "自転車",
  "待ち合わせ",
  "寄り道",
  "深呼吸",
  "交差点",
] as const;

/** First names of the made-up people in the credits. */
export const FIRST_NAMES = [
  "Ada",
  "Basil",
  "Cora",
  "Desmond",
  "Elsie",
  "Fergus",
  "Greta",
  "Hugo",
  "Iris",
  "Jasper",
  "Kit",
  "Lena",
  "Magnus",
  "Nell",
  "Otis",
  "Pearl",
  "Rufus",
  "Sadie",
  "Theo",
  "Willa",
] as const;

/** Last names of the made-up people in the credits. */
export const LAST_NAMES = [
  "Abernathy",
  "Blackwood",
  "Carmichael",
  "Dunmore",
  "Everly",
  "Fenwick",
  "Garrow",
  "Hollis",
  "Ives",
  "Kettering",
  "Lockhart",
  "Merriweather",
  "Nightingale",
  "Oakes",
  "Pemberton",
  "Rowntree",
  "Sinclair",
  "Thackeray",
  "Underwood",
  "Winslow",
] as const;

/** Made-up record labels for the publisher credit. */
export const PUBLISHERS = [
  "Acme Records",
  "Placeholder Music",
  "Lorem Label",
  "Foobar Sound",
  "Example Recordings",
  "Sample House",
  "Dummy Disc",
  "Null Records",
] as const;

/** Per-genre ranges the generator draws track values from. */
export type GenreProfile = {
  /** Track count of a regular album, inclusive `[min, max]`. */
  readonly tracks: readonly [number, number];
  /** Track length in seconds, inclusive `[min, max]`. */
  readonly seconds: readonly [number, number];
  /** Beats per minute, inclusive `[min, max]`. */
  readonly bpm: readonly [number, number];
  /** Whether tracks have a lyricist. */
  readonly vocal: boolean;
  /** Whether albums credit a conductor. */
  readonly conducted: boolean;
  /** Chance of a track crediting a guest artist, `[0, 1]`. */
  readonly guestChance: number;
};

/** Value ranges per genre. */
export const GENRE_PROFILES: Readonly<Record<DemoGenre, GenreProfile>> = {
  Rock: {
    tracks: [9, 13],
    seconds: [170, 330],
    bpm: [100, 170],
    vocal: true,
    conducted: false,
    guestChance: 0,
  },
  Pop: {
    tracks: [9, 13],
    seconds: [150, 260],
    bpm: [90, 130],
    vocal: true,
    conducted: false,
    guestChance: 0.06,
  },
  Jazz: {
    tracks: [6, 10],
    seconds: [240, 560],
    bpm: [80, 180],
    vocal: false,
    conducted: false,
    guestChance: 0,
  },
  Electronic: {
    tracks: [8, 12],
    seconds: [200, 420],
    bpm: [110, 140],
    vocal: false,
    conducted: false,
    guestChance: 0.05,
  },
  Classical: {
    tracks: [8, 12],
    seconds: [150, 840],
    bpm: [60, 140],
    vocal: false,
    conducted: true,
    guestChance: 0,
  },
  Folk: {
    tracks: [9, 12],
    seconds: [150, 280],
    bpm: [70, 120],
    vocal: true,
    conducted: false,
    guestChance: 0,
  },
  "Hip Hop": {
    tracks: [11, 16],
    seconds: [140, 270],
    bpm: [80, 110],
    vocal: true,
    conducted: false,
    guestChance: 0.12,
  },
  Blues: {
    tracks: [9, 12],
    seconds: [180, 360],
    bpm: [60, 120],
    vocal: true,
    conducted: false,
    guestChance: 0,
  },
  Ambient: {
    tracks: [5, 9],
    seconds: [240, 720],
    bpm: [60, 90],
    vocal: false,
    conducted: false,
    guestChance: 0,
  },
  Soundtrack: {
    tracks: [12, 20],
    seconds: [60, 300],
    bpm: [60, 140],
    vocal: false,
    conducted: true,
    guestChance: 0,
  },
};
