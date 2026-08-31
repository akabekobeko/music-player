import type { SVGAttributes } from "react";

type Props = SVGAttributes<SVGSVGElement>;

/**
 * Equalizer bars (lucide `audio-lines`) pulsing while mounted — the
 * playing-track indicator. The bar shapes and timings come from
 * lucide-animated (https://lucide-animated.com/, MIT), reimplemented as the
 * pure-CSS `audio-line-*` keyframes in `App.css` so no animation library is
 * needed; the `d` attributes double as the resting state. Decorative —
 * `aria-hidden` is baked in.
 */
export const AudioLinesIcon = ({ className, ...props }: Props) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M2 10v3" />
    <path
      className="[animation:audio-line-2_1.5s_ease-in-out_infinite]"
      d="M6 6v11"
    />
    <path
      className="[animation:audio-line-3_1s_ease-in-out_infinite]"
      d="M10 3v18"
    />
    <path
      className="[animation:audio-line-4_0.8s_ease-in-out_infinite]"
      d="M14 8v7"
    />
    <path
      className="[animation:audio-line-5_1.5s_ease-in-out_infinite]"
      d="M18 5v13"
    />
    <path d="M22 10v3" />
  </svg>
);
