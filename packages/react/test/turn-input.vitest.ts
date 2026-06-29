import { describe, expect, it } from "vitest";
import { normalizeTurnInput } from "../src/hooks/turn-input";

describe("turn input normalization", () => {
  it("maps image input url directly to Codex user input", () => {
    expect(
      normalizeTurnInput([
        {
          type: "image",
          url: "https://example.test/image.png",
        },
      ]),
    ).toEqual([
      {
        type: "image",
        url: "https://example.test/image.png",
      },
    ]);
  });

  it("rejects image input without a url", () => {
    expect(() =>
      normalizeTurnInput([
        {
          image_url: "https://example.test/image.png",
          type: "image",
        } as never,
      ]),
    ).toThrow("Codex image input requires url");
  });
});
