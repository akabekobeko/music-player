import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Slider } from "./slider";

it("renders a single thumb for a scalar value", () => {
  const html = renderToStaticMarkup(
    <Slider aria-label="Seek" min={0} max={100} step={1} value={30} />,
  );
  expect(html.match(/data-slot="slider-thumb"/g)?.length).toBe(1);
});

it("renders two thumbs for a range value", () => {
  const html = renderToStaticMarkup(
    <Slider aria-label="Range" min={0} max={100} value={[20, 80]} />,
  );
  expect(html.match(/data-slot="slider-thumb"/g)?.length).toBe(2);
});
