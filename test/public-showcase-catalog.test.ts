import { describe, expect, it } from "vitest";
import * as reactExports from "../packages/react/src";
import * as headlessExports from "../packages/react/src/headless";
import * as primitiveExports from "../packages/react/src/primitives";
import {
  deprecatedPublicShowcaseTerms,
  publicApiCatalog,
  publicComponentCatalog,
  publicComponentCoverage,
  publicStartCatalog,
} from "../examples/local-react-vite/src/fixtures/public-component-catalog";
import { publicShowcaseRoutes } from "../examples/local-react-vite/src/fixtures/visual-qa-manifest";
import { requiredVisualPrimitiveExports } from "../examples/local-react-vite/src/closeups/component-closeup-catalog";

describe("public showcase component catalog", () => {
  it("classifies every required visual primitive for the user-facing catalog", () => {
    const coveredComponents = new Set(
      publicComponentCoverage.map((entry) => entry.component),
    );
    const missing = requiredVisualPrimitiveExports.filter(
      (component) => !coveredComponents.has(component),
    );
    expect(missing).toEqual([]);

    const requiredComponents = new Set(requiredVisualPrimitiveExports);
    const unknown = publicComponentCoverage
      .map((entry) => entry.component)
      .filter((component) => !requiredComponents.has(component));
    expect(unknown).toEqual([]);
  });

  it("links catalog entries only to public showcase routes", () => {
    const publicRouteIds = new Set(publicShowcaseRoutes.map((route) => route.id));
    const publicRoutePaths = new Set(publicShowcaseRoutes.map((route) => route.path));
    for (const entry of publicComponentCatalog) {
      expect(publicRoutePaths.has(entry.href), entry.title).toBe(true);
      for (const routeId of entry.routeIds) {
        expect(publicRouteIds.has(routeId), `${entry.title} -> ${routeId}`).toBe(true);
        expect(routeId, entry.title).not.toBe("showcase");
      }
    }
  });

  it("keeps every public catalog entry copyable and anchored", () => {
    const anchors = new Set<string>();
    for (const entry of publicComponentCatalog) {
      const anchor = entry.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      expect(anchors.has(anchor), entry.title).toBe(false);
      anchors.add(anchor);
      expect(entry.copyCode.trim().length, entry.title).toBeGreaterThan(80);
      expect(entry.copyCode, entry.title).toContain("@nyosegawa/agent-ui-react");
      expect(entry.codeApi.length, entry.title).toBeGreaterThan(0);
      expect(entry.coveredComponents.length, entry.title).toBeGreaterThan(0);
      for (const apiName of entry.codeApi) {
        expect(entry.copyCode, `${entry.title} -> ${apiName}`).toContain(apiName);
      }
      expect(entry.whenToUse.trim().length, entry.title).toBeGreaterThan(20);
      expect(entry.ownership.trim().length, entry.title).toBeGreaterThan(40);
    }
  });

  it("points user-facing starting points at normal showcase routes, not edge probes", () => {
    expect(publicStartCatalog.map((entry) => entry.title)).toEqual([
      "Default chat preset",
      "Composable chat preset",
      "Composed shell",
      "Composer slot",
      "Transcript pane",
      "Review rail",
    ]);
    expect(
      Object.fromEntries(publicComponentCatalog.map((entry) => [entry.title, entry.href])),
    ).toMatchObject({
      "Composed shell": "/showcase/composed-shell",
      "Composer slot": "/showcase/composer-primitives",
      "Review rail": "/showcase/approvals-status",
      "Thread navigation": "/showcase/thread-navigation",
      "Transcript pane": "/showcase/transcript-content",
    });
  });

  it("builds the public API catalog from snippet-facing APIs only", () => {
    const codeApis = new Set(publicComponentCatalog.flatMap((entry) => entry.codeApi));
    const coveredOnlyComponents = new Set(
      publicComponentCatalog
        .flatMap((entry) => entry.coveredComponents)
        .filter((component) => !codeApis.has(component)),
    );
    expect(new Set(publicApiCatalog.map((entry) => entry.name))).toEqual(codeApis);
    for (const api of publicApiCatalog) {
      expect(coveredOnlyComponents.has(api.name), api.name).toBe(false);
      const packageExports =
        api.packageName === "@nyosegawa/agent-ui-react"
          ? reactExports
          : api.packageName === "@nyosegawa/agent-ui-react/headless"
            ? headlessExports
          : primitiveExports;
      expect(
        Object.prototype.hasOwnProperty.call(packageExports, api.name),
        `${api.packageName} -> ${api.name}`,
      ).toBe(true);
      expect(api.usedBy.length, api.name).toBeGreaterThan(0);
      expect(api.packageName, api.name).toMatch(/^@nyosegawa\/agent-ui-react/);
    }
  });

  it("classifies public APIs into stable catalog groups", () => {
    expect(
      Object.fromEntries(publicApiCatalog.map((entry) => [entry.name, entry.group])),
    ).toMatchObject({
      AgentFirstRun: "Onboarding and controls",
      AgentLocaleSelect: "Onboarding and controls",
      AgentProvider: "Setup",
      AgentThemeToggle: "Onboarding and controls",
    });
  });

  it("keeps obsolete or maintainer-only concepts out of the public catalog", () => {
    const publicText = JSON.stringify({
      catalog: publicComponentCatalog,
      routes: publicShowcaseRoutes,
    });
    for (const term of deprecatedPublicShowcaseTerms) {
      expect(publicText.includes(term), term).toBe(false);
    }
    expect(publicShowcaseRoutes.every((route) => route.audience === "public")).toBe(
      true,
    );
    expect(publicShowcaseRoutes.some((route) => route.path === "/showcase")).toBe(
      true,
    );
  });
});
