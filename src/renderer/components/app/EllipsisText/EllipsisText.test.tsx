import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { EllipsisText } from "./EllipsisText";

it("renders the text inside a truncated span", () => {
  const html = renderToStaticMarkup(<EllipsisText text="Very Long Name" />);
  expect(html).toContain("Very Long Name");
  expect(html).toContain("truncate");
});

it("renders children as the display content when provided", () => {
  const html = renderToStaticMarkup(
    <EllipsisText text="Title / Artist">
      <span className="font-medium">Title</span>
    </EllipsisText>,
  );
  expect(html).toContain('<span class="font-medium">Title</span>');
  expect(html).not.toContain("Title / Artist");
});

it("merges the given className into the trigger span", () => {
  const html = renderToStaticMarkup(
    <EllipsisText className="text-sm" text="Name" />,
  );
  expect(html).toMatch(/class="[^"]*text-sm[^"]*"/);
});
