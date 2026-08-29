import type { Music } from "@mp/ipc";
import {
  createContext,
  type ReactNode,
  useContext,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toMediaStreamUrl } from "@/libs/toMediaStreamUrl";
import { createAudioEngine } from "../audio/createAudioEngine";
import type { PlaybackSnapshot } from "../audio/types";
import { createEngineHost, type EngineHost } from "./engineHost";
import { registerMediaSessionHandlers } from "./mediaSession/registerMediaSessionHandlers";
import { syncMediaSessionPlayback } from "./mediaSession/syncMediaSessionPlayback";
import { updateMediaSessionMetadata } from "./mediaSession/updateMediaSessionMetadata";
import { isNaturalEnd } from "./naturalEnd";
import { nextOf } from "./nextOf";
import { setActivePlayer } from "./playerBridge";
import { type PlayerAction, playerReducer } from "./playerReducer";
import { previousOf } from "./previousOf";
import { shuffle } from "./shuffle";
import {
  INITIAL_PLAYER_STATE,
  type PlayerState,
  type QueueSource,
} from "./types";

/**
 * Queue / current-track state and the playback commands
 * (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * No async actions: commands are plain async functions doing the side
 * effects (engine swap, engine calls) and dispatching pure notifications to
 * the reducer. State and Commands live in separate contexts so command-only
 * consumers never re-render on state changes; the Commands object is
 * created exactly once (useState initializer) and stays referentially
 * stable without useCallback.
 */

/** Commands exposed by the provider. */
export type PlayerCommands = {
  /**
   * Start a track, replacing the queue with the view's list. While shuffle
   * mode is on the track plays first and the rest follows shuffled.
   */
  readonly playMusic: (
    music: Music,
    queue: readonly Music[],
    source: QueueSource,
  ) => Promise<void>;
  /**
   * Turn shuffle mode on and play the view's list in a shuffled order
   * (the headers' shuffle play).
   */
  readonly playShuffled: (
    queue: readonly Music[],
    source: QueueSource,
  ) => Promise<void>;
  /**
   * Toggle shuffle mode: on reshuffles the current queue (current track
   * first), off restores the view order. Playback keeps running.
   */
  readonly toggleShuffle: () => void;
  readonly playNext: () => Promise<void>;
  readonly playPrevious: () => Promise<void>;
  readonly togglePlayPause: () => void;
  readonly stop: () => void;
  readonly seek: (timeSec: number) => void;
  /** Set the app volume (`[0, 1]`); survives across tracks. */
  readonly setVolume: (volume: number) => void;
  /** Replace the queue, keeping the current track and playback running. */
  readonly replaceQueue: (queue: readonly Music[], source: QueueSource) => void;
  /** Insert tracks right after the current one ("Play next"). */
  readonly insertNext: (musics: readonly Music[]) => void;
  /** Append tracks to the queue tail ("Add to queue"). */
  readonly appendToQueue: (musics: readonly Music[]) => void;
};

const PlayerStateContext = createContext<PlayerState | null>(null);
const PlayerCommandsContext = createContext<PlayerCommands | null>(null);
const EngineHostContext = createContext<EngineHost | null>(null);

/**
 * Build the stable Commands object.
 *
 * @param host - Engine host (owns the active engine + volume).
 * @param stateRef - Always-current player state (updated during render).
 * @param dispatch - The reducer dispatch.
 * @returns The commands; created once per provider mount.
 */
const createCommands = (
  host: EngineHost,
  stateRef: { readonly current: PlayerState },
  dispatch: (action: PlayerAction) => void,
): PlayerCommands => {
  /**
   * Swap the engine to a new track and start playback.
   *
   * The `ended` follow-up (advance or stop at the tail) is registered here,
   * in the command that creates the engine — never via useEffect watching
   * `current` (`docs/specs/v1.0/renderer/state-management.md`).
   */
  const startEngine = (music: Music): void => {
    const engine = createAudioEngine(toMediaStreamUrl(music.filePath), {
      volume: host.getVolume(),
    });
    let advanced = false;
    engine.subscribe(() => {
      const snapshot = engine.getSnapshot();
      // OS media controls follow every snapshot change without passing
      // through React rendering (docs/specs/v1.0/features/player-ui.md).
      syncMediaSessionPlayback(snapshot);
      if (advanced || !isNaturalEnd(snapshot)) {
        return;
      }

      advanced = true;
      const next = nextOf(stateRef.current.queue, stateRef.current.current);
      if (next !== null) {
        void commands.playMusic(
          next,
          stateRef.current.queue,
          stateRef.current.queueSource,
        );
      } else {
        // Queue tail: rewind to 0:00 / stopped, keep the current track
        // (repeat is v1.x).
        engine.stop();
      }
    });
    host.set(engine); // Closes the previous engine.
    updateMediaSessionMetadata(music);
    syncMediaSessionPlayback(engine.getSnapshot());
    void engine.play(); // Failures surface via snapshot.error; no auto-skip.
  };

  const commands: PlayerCommands = {
    playMusic: async (music, queue, source) => {
      const shuffling = stateRef.current.shuffle;
      const playQueue = shuffling
        ? [music, ...shuffle(queue.filter((entry) => entry.id !== music.id))]
        : queue;
      startEngine(music);
      dispatch({
        type: "played",
        music,
        queue: playQueue,
        orderedQueue: queue,
        source,
        shuffle: shuffling,
      });
    },

    playShuffled: async (queue, source) => {
      const shuffled = shuffle(queue);
      const first = shuffled[0];
      if (first === undefined) {
        return;
      }

      startEngine(first);
      dispatch({
        type: "played",
        music: first,
        queue: shuffled,
        orderedQueue: queue,
        source,
        shuffle: true,
      });
    },

    toggleShuffle: () => {
      const { shuffle: enabled, orderedQueue, current } = stateRef.current;
      if (enabled) {
        dispatch({
          type: "shuffleChanged",
          shuffle: false,
          queue: orderedQueue,
        });
        return;
      }

      // The current track leads the shuffled order so playback continues
      // seamlessly; a current outside the queue (replacement policy) just
      // shuffles the whole list.
      const queue =
        current !== null &&
        orderedQueue.some((entry) => entry.id === current.id)
          ? [
              current,
              ...shuffle(
                orderedQueue.filter((entry) => entry.id !== current.id),
              ),
            ]
          : shuffle(orderedQueue);
      dispatch({ type: "shuffleChanged", shuffle: true, queue });
    },

    playNext: async () => {
      const next = nextOf(stateRef.current.queue, stateRef.current.current);
      if (next === null) {
        return;
      }

      startEngine(next);
      dispatch({ type: "currentChanged", music: next });
    },

    playPrevious: async () => {
      const previous = previousOf(
        stateRef.current.queue,
        stateRef.current.current,
      );
      if (previous === null) {
        return;
      }

      startEngine(previous);
      dispatch({ type: "currentChanged", music: previous });
    },

    togglePlayPause: () => {
      const engine = host.get();
      if (engine === null) {
        return;
      }

      if (engine.getSnapshot().state === "playing") {
        engine.pause();
      } else {
        void engine.play();
      }
    },

    stop: () => {
      host.get()?.stop();
    },

    seek: (timeSec) => {
      host.get()?.seek(timeSec);
    },

    setVolume: (volume) => {
      host.setVolume(volume);
    },

    replaceQueue: (queue, source) => {
      dispatch({ type: "queueReplaced", queue, source });
    },

    insertNext: (musics) => {
      dispatch({ type: "queueInsertedNext", musics });
    },

    appendToQueue: (musics) => {
      dispatch({ type: "queueAppended", musics });
    },
  };

  return commands;
};

type Props = {
  readonly children: ReactNode;
};

/**
 * Provide player state, commands, and the engine host to the app.
 */
export const PlayerProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(playerReducer, INITIAL_PLAYER_STATE);

  // Commands read the latest state through this ref (a dispatch cannot
  // return state); assigning during render keeps it in sync.
  const stateRef = useRef(state);
  stateRef.current = state;

  const [host] = useState(() => {
    const created = createEngineHost();
    // Keep the native menu's playback state in sync (mp:menu:setState).
    // Deduplicated here because snapshots also tick on currentTime updates.
    let lastIsPlaying = false;
    let lastHasTrack = false;
    created.subscribe(() => {
      const isPlaying = created.getSnapshot().state === "playing";
      // An engine exists exactly while a current track is loaded.
      const hasTrack = created.get() !== null;
      if (isPlaying !== lastIsPlaying || hasTrack !== lastHasTrack) {
        lastIsPlaying = isPlaying;
        lastHasTrack = hasTrack;
        window.mp.menu.setState({ isPlaying, hasTrack });
      }
    });
    return created;
  });
  const [commands] = useState(() => createCommands(host, stateRef, dispatch));

  // Publish for React-external listeners (hotkeys, MediaSession handlers).
  // Idempotent pointer assignment — safe under StrictMode double-render.
  setActivePlayer({ commands, getSnapshot: host.getSnapshot });
  // One-shot (internally guarded); handlers reach the commands through the
  // bridge above, so they never go stale.
  registerMediaSessionHandlers();

  return (
    <PlayerStateContext.Provider value={state}>
      <PlayerCommandsContext.Provider value={commands}>
        <EngineHostContext.Provider value={host}>
          {children}
        </EngineHostContext.Provider>
      </PlayerCommandsContext.Provider>
    </PlayerStateContext.Provider>
  );
};

/**
 * Read the queue / current-track state.
 *
 * @returns The player state.
 */
export const usePlayerState = (): PlayerState => {
  const state = useContext(PlayerStateContext);
  if (state === null) {
    throw new Error("usePlayerState must be used within PlayerProvider");
  }

  return state;
};

/**
 * Read the playback commands (stable reference — consumers never re-render
 * on state changes).
 *
 * @returns The commands object.
 */
export const usePlayerCommands = (): PlayerCommands => {
  const commands = useContext(PlayerCommandsContext);
  if (commands === null) {
    throw new Error("usePlayerCommands must be used within PlayerProvider");
  }

  return commands;
};

/**
 * Subscribe to the active engine's playback snapshot.
 *
 * The host survives engine swaps, so the subscription registered here stays
 * valid across track changes (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * @returns The current playback snapshot (idle before the first track).
 */
export const useAudioPlayer = (): PlaybackSnapshot => {
  const host = useContext(EngineHostContext);
  if (host === null) {
    throw new Error("useAudioPlayer must be used within PlayerProvider");
  }

  return useSyncExternalStore(host.subscribe, host.getSnapshot);
};

/**
 * Subscribe to the playback state alone (a primitive), so consumers that
 * only need playing / paused — e.g. the track-row highlight — do not
 * re-render on every 250ms `currentTime` tick.
 *
 * @returns The current engine state.
 */
export const usePlaybackState = (): PlaybackSnapshot["state"] => {
  const host = useContext(EngineHostContext);
  if (host === null) {
    throw new Error("usePlaybackState must be used within PlayerProvider");
  }

  return useSyncExternalStore(host.subscribe, () => host.getSnapshot().state);
};
