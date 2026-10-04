/**
 * Escape text for use inside SVG markup.
 *
 * @param text - Raw text such as an album title.
 * @returns The text with the XML special characters replaced by entities.
 */
export const escapeXml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
