/** A photograph on Wikimedia Commons used as an artist picture. */
export type DemoArtistPhoto = {
  /**
   * Page title of the file on Wikimedia Commons (`File:...`). Must be a
   * JPEG file.
   */
  readonly title: string;
  /**
   * Part of the photograph to keep when cropping it to a square: the start
   * (left or top) or the end (right or bottom). The middle when omitted.
   */
  readonly align?: "start" | "end";
};

/**
 * Photograph per artist name. Every file must be published under CC0 on
 * Wikimedia Commons; `pnpm demo:photos` verifies that before downloading.
 * Pick photographs without identifiable people, logos or artworks.
 */
export const DEMO_ARTIST_PHOTOS: Readonly<Record<string, DemoArtistPhoto>> = {
  "Abigail Thorne": {
    title:
      "File:Fender California Series Acoustic Guitar (serial no. CSC10001615) (2018-04-26 13.21.46 Piqsels.com id olkmb).jpg",
  },
  "Acme Philharmonic": {
    title: "File:St Andrews Cathedral pipe organ.jpg",
  },
  "Alice & Bob": {
    title: "File:Designs for Two Chairs MET DP804599.jpg",
  },
  ALMANAC: {
    title: "File:Old Books 01.JPG",
  },
  "The Amber Arcade": {
    title: "File:Ancestral Gallery (Münchner Residenz).jpg",
  },
  "aurora club": {
    title: "File:Lofoten, Norway (Unsplash).jpg",
  },
  "Bartholomew Quince": {
    title: "File:Alto saxophone in E-flat MET DP338623.jpg",
  },
  "Beatrix Vale": {
    title: "File:Spring Tulips (153795123).jpeg",
  },
  "birdsong radio": {
    title: "File:Antique Simple AM Radio.jpg",
  },
  "The Blue Lanterns": {
    title: "File:Paper lanterns at Tongdosa Temple 01.jpg",
  },
  BRASSWORKS: {
    title: "File:Natural Trumpet MET DP220762.jpg",
  },
  "Bruno Halloway": {
    title: "File:Harmonica MET 202637.jpg",
  },
  "Carol & Dave": {
    title: "File:Banjo MET DP317374.jpg",
  },
  "The Cardboard Kings": {
    title: "File:Gold-Silver Chess Set.jpg",
  },
  "Cedric Moon": {
    title: "File:Full moon on the view from sea.jpg",
  },
  CITRUS: {
    title: "File:Sliced orange citrus fruits-943632.jpg",
  },
  "Clementine Hart": {
    title: "File:Keys-piano-sh.jpg",
  },
  "Daisy Calloway": {
    title: "File:Flor rara-daisy flower 25.4.2026.jpg",
  },
  "DELTA NINE": {
    title: "File:Platte River aerial 2026.jpg",
  },
  "Dolor Sit Amet": {
    title: 'File:Ex "Kurtz" Violin MET DP302645.jpg',
  },
  "The Driftwood Choir": {
    title: "File:Driftwood at the sand beach (Unsplash).jpg",
  },
  "Edgar Finch": {
    title: "File:Male-House-Finch-at-Bird-Feeder.jpg",
  },
  "ember & ash": {
    title: "File:Campfire 20221029 180021.jpg",
  },
  "Example Orchestra": {
    title:
      "File:Canabas (French, 1715-1797) - Music Stand - 1942.41 - Cleveland Museum of Art.jpg",
  },
  "Felix Harrow": {
    title:
      "File:Portable HMV LP - gramophone- phonograph- record player encased in wooden box.jpg",
  },
  FJORD: {
    title: "File:Road along the fjord (Unsplash).jpg",
  },
  "The Foobars": {
    title: "File:Boben-snare-zgornji del.jpg",
  },
  "Gideon Marsh": {
    title:
      "File:View of Severn Estuary Through Reeds From Newport Wetlands RSPB Reserve.JPG",
  },
  "glass harbor": {
    title:
      "File:View towards Harbor East at dusk from West Shore Promenade, Inner Harbor, Baltimore, MD 21201 (49052641811).jpg",
  },
  "The Golden Hours": {
    title: "File:Mountain village during golden hour (Unsplash).jpg",
  },
  "Hazel Whitlock": {
    title: "File:Naruko Gorge - Naruko6275.jpg",
  },
  "Hello World": {
    title: "File:Person holding world globe.jpg",
  },
  "The Hollow Pines": {
    title: "File:Evergreen forest wreathed in fog (Unsplash).jpg",
  },
  "Ingrid Solberg": {
    title: "File:Violoncello MET DT7705.jpg",
  },
  "IRON LANTERN": {
    title: "File:Wrought iron door rhodes.jpg",
  },
  "Jane Doe": {
    title: "File:Shure SM61 Microphone.jpg",
  },
  "John Doe Trio": {
    title: "File:Double Bass MET DP217155.jpg",
  },
  "juniper lane": {
    title: "File:On the road again, greeted by a slanted tree.jpg",
  },
  Kestrel: {
    title:
      "File:Kestrel on the wall of Salle de l'Échiquier, Château de Caen 2025-03-28.jpg",
  },
  "The Kite Makers": {
    title: "File:Nopple sky 2.jpg",
  },
  "The Lamplighters": {
    title: "File:Lamp (1).jpg",
  },
  "Lorem Ipsum": {
    title:
      "File:SZ Shenzhen Longgang JiHua 18 Ganli Road Gankeng Ancient Town Museum printing n metal movable types April 2025 R12S 04.jpg",
    // Keeps the date stamp in the lower right corner out of the picture.
    align: "start",
  },
  "Lucille Fairweather": {
    title: "File:Guitar.Focus.Stacking.Composition.jpg",
  },
  LUMEN: {
    title: "File:Light bulb and keys on table.jpg",
  },
  "Mallory Quinn": {
    title: "File:Philips D8444 (1).jpg",
  },
  "The Marigold Tapes": {
    title: "File:Orange marigold flower petals.jpg",
  },
  MERIDIAN: {
    title: "File:Sundial MET 238354.jpg",
  },
  "Milo Ashgrove": {
    title:
      "File:Schmidt Eightvoice Polyphonic Synthesizer - right angled (2016-04-07 13.17.24 by kpr2) Synthesizer-1515574.jpg",
  },
  "Mock Turtle Society": {
    title:
      "File:Kop en schotel Kop, beschilderd met een fries van rozetten, BK-1981-71-A.jpg",
  },
  "moss & mirror": {
    title: "File:Moss@branch(bugPoV)byPJRVS.jpg",
  },
  "Nadia Brooks": {
    title: "File:Oirase Mountain Stream - Towada, Aomori - DSC01258.jpg",
  },
  "The Null Pointers": {
    title: "File:Etched circuit board after cleaning.jpg",
  },
  "Oliver Stagg": {
    title: "File:Two Red Stag.jpg",
  },
  opal: {
    title: "File:Opal (GeoDIL number - 710).jpg",
  },
  "Penelope Wren": {
    title: "File:Harp in the Rocca of Montestaffoli, San Gimignano, Italy.jpg",
    align: "end",
  },
  "The Placeholders": {
    title: "File:Frame MET 45186.jpg",
  },
  "PRISM CITY": {
    title: "File:Price Building illuminated at night in Quebec City.jpg",
  },
  "Quentin Lark": {
    title: "File:Clarinet in C MET 262382.jpg",
  },
  "Richard Roe": {
    title: "File:Window on a barn in Färlev.jpg",
  },
  "Rosalind Pike": {
    title:
      "File:Bell & Howell film projector Recreation Hall The Retreat Hospital Aug25 01.jpg",
  },
  "The Rust Belt Revival": {
    title: "File:Abandoned factory in Conover.jpg",
  },
  "The Sample Rates": {
    title: "File:Mixing console (Unsplash).jpg",
  },
  "Sebastian Crowe": {
    title: "File:Crow bird and beach 37.jpg",
  },
  "silver lining": {
    title: "File:Sky Sun Blue Dark Clouds Rays Weather.jpg",
  },
  SOLSTICE: {
    title: "File:Pegeia, Cyprus, sunset at sea caves.jpg",
  },
  "Sunday Static": {
    title: "File:Old Philips television set, pic4.JPG",
  },
  "Sylvia Northcott": {
    title: "File:Grand Piano MET DP300905.jpg",
  },
  "Tabitha Greene": {
    title: "File:Meadow in Niederfinow 2021-07-17 25.jpg",
  },
  "Test Pattern": {
    title:
      "File:Triangular wave and square wave on oscilloscope screen (cropped).jpg",
  },
  "The Tin Soldiers": {
    title: "File:Tin soldiers 2 - Royal Ontario Museum - DSC04478.JPG",
  },
  TUNDRA: {
    title: "File:Fall River Road, August 2024.jpg",
  },
  "Una Whitmore": {
    title: "File:Transverse Flute MET midp2000.67.jpg",
  },
  "Violet Underhill": {
    title: "File:Violet -Aster A.jpg",
  },
  "Walter Plinge": {
    title: "File:Curtain-939464.jpg",
  },
  "The Wandering Hours": {
    title: "File:Lip pocket watch.jpg",
  },
  "wren & wolf": {
    title: "File:Grey Wolf grooming.jpg",
  },
  Xyzzy: {
    title: "File:Gruta da sacristia, Maricá, Rio de Janeiro, Brazil.jpg",
  },
  "Yonder Valley": {
    title: "File:San Juan Valley.jpg",
  },
  "Zebedee Flint": {
    title: "File:Vinyl collection at a record store (Unsplash).jpg",
  },
  "7 Days of Rain": {
    title: "File:Rain on window (Unsplash).jpg",
  },
  "808 Motel": {
    title: "File:Night lights in Loyola, California.jpg",
  },
  山田太郎: {
    title: "File:Mt Hiei with Cherry Blossom.JPG",
  },
};
