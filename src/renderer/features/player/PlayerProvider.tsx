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
import type { PlaybackSnapshot } from "../audio/types";
import { createAudioEngine } from "../audio/WebAudioEngine";
import { nextOf, previousOf } from "./derive";
import { createEngineHost, type EngineHost } from "./engineHost";
import { toMediaStreamUrl } from "./mediaStreamUrl";
import { isNaturalEnd } from "./naturalEnd";
import { type PlayerAction, playerReducer } from "./playerReducer";
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
  /** Start a track, replacing the queue with the view's list. */
  readonly playMusic: (
    music: Music,
    queue: readonly Music[],
    source: QueueSource,
  ) => Promise<void>;
  readonly playNext: () => Promise<void>;
  readonly playPrevious: () => Promise<void>;
  readonly togglePlayPause: () => void;
  readonly stop: () => void;
  readonly seek: (timeSec: number) => void;
  /** Set the app volume (`[0, 1]`); survives across tracks. */
  readonly setVolume: (volume: number) => void;
  /** Replace the queue, keeping the current track and playback running. */
  readonly replaceQueue: (queue: readonly Music[], source: QueueSource) => void;
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
      if (advanced || !isNaturalEnd(engine.getSnapshot())) {
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
    void engine.play(); // Failures surface via snapshot.error; no auto-skip.
  };

  const commands: PlayerCommands = {
    playMusic: async (music, queue, source) => {
      startEngine(music);
      dispatch({ type: "played", music, queue, source });
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
  };

  return commands;
};

/**
 * Provide player state, commands, and the engine host to the app.
 */
export const PlayerProvider = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(playerReducer, INITIAL_PLAYER_STATE);

  // Commands read the latest state through this ref (a dispatch cannot
  // return state); assigning during render keeps it in sync.
  const stateRef = useRef(state);
  stateRef.current = state;

  const [host] = useState(() => createEngineHost());
  const [commands] = useState(() => createCommands(host, stateRef, dispatch));

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
