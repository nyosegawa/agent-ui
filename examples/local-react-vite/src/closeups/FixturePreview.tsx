import { useState } from "react";
import type { FixtureState } from "../fixtures/gallery";

export function FixturePreview({ state }: { state: FixtureState }) {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <article className="aui-fixture-preview">
      <header>
        <div>
          <strong>{state.title}</strong>
          <span>{state.description}</span>
        </div>
        <div className="aui-fixture-preview-actions">
          <button onClick={() => setReloadKey((key) => key + 1)} type="button">
            Reload preview
          </button>
          <a aria-label={`${state.title} ${state.href}`} href={state.href}>
            {state.href}
          </a>
        </div>
      </header>
      <div className="aui-fixture-preview-frames">
        {(["desktop", "mobile"] as const).map((size) => (
          <FixturePreviewFrame
            key={`${state.href}:${size}:${reloadKey}`}
            meta={state.meta}
            size={size}
            state={state}
          />
        ))}
      </div>
    </article>
  );
}

function FixturePreviewFrame({
  meta,
  size,
  state,
}: {
  meta: string;
  size: "desktop" | "mobile";
  state: FixtureState;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <figure data-size={size}>
      <figcaption>
        <span>{size === "desktop" ? "Desktop · 1280 × 900" : "Mobile · 390 × 900"}</span>
        <span>{meta}</span>
      </figcaption>
      <div className="aui-fixture-frame-shell">
        {!loaded ? (
          <span className="aui-fixture-frame-status">Loading {size} preview</span>
        ) : null}
        <iframe
          onLoad={() => setLoaded(true)}
          src={state.href}
          title={`${state.title} ${size}`}
        />
      </div>
    </figure>
  );
}
