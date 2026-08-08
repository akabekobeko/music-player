import type { ReadStream } from "node:fs";

/**
 * Convert a Node `ReadStream` into a web `ReadableStream` with backpressure.
 *
 * Ported from audio-player's `fetchLocalFileStream`: the file stream starts
 * paused, `pull()` resumes it when the consumer wants data, and each `data`
 * event re-pauses once `desiredSize` reports a full internal queue. Without
 * this, a large FLAC would be read into memory as fast as disk allows while
 * the `<audio>` element consumes it slowly.
 *
 * @param fileStream - Node stream of the local file (typically range-bound).
 * @returns A web stream suitable for the `Response` body.
 */
export const fileStreamToWebStream = (
  fileStream: ReadStream,
): ReadableStream<Uint8Array> => {
  fileStream.pause();

  return new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => {
        controller.enqueue(
          Buffer.isBuffer(chunk)
            ? new Uint8Array(chunk)
            : new TextEncoder().encode(chunk),
        );

        // Wait until the consumer is ready for more data.
        if (controller.desiredSize === null || controller.desiredSize <= 0) {
          fileStream.pause();
        }
      });

      fileStream.on("end", () => {
        controller.close();
      });

      fileStream.on("error", (error) => {
        controller.error(error);
      });
    },
    pull() {
      fileStream.resume();
    },
    cancel() {
      fileStream.destroy();
    },
  });
};
