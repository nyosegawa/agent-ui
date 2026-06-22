import {
  previewRoutes,
  type VisualQaRouteCategory,
} from "./visual-qa-manifest";

export type FixtureScenario =
  | "default"
  | "empty"
  | "unauth"
  | "bridge-error"
  | "host-workflow"
  | "rich-transcript";

export type FixtureGroup = "core" | "states" | "primitives";

export interface FixtureState {
  description: string;
  group: FixtureGroup;
  href: string;
  meta: string;
  title: string;
}

const fixtureGroupByCategory: Record<VisualQaRouteCategory, FixtureGroup | null> = {
  "component-closeups": null,
  "host-reference": "primitives",
  "primitive-composition": "primitives",
  "protocol-lifecycle": "core",
};

export const visualQaStates: FixtureState[] = previewRoutes.map((route) => {
  const group =
    route.path.startsWith("/?state=") ? "states" : fixtureGroupByCategory[route.category];
  if (!group) {
    throw new Error(`Route ${route.id} cannot be rendered as a fixture preview`);
  }
  return {
    description: route.description,
    group,
    href: route.path,
    meta: route.meta,
    title: route.title,
  };
});

export const fixtureGroupLabels: Record<FixtureGroup, string> = {
  core: "Preset surfaces",
  primitives: "Primitive compositions",
  states: "Lifecycle states",
};

export function groupFixtures(states: FixtureState[]) {
  return Object.entries(
    states.reduce<Record<FixtureGroup, FixtureState[]>>(
      (groups, state) => {
        groups[state.group].push(state);
        return groups;
      },
      { core: [], primitives: [], states: [] },
    ),
  ).map(([group, fixtures]) => ({
    group: group as FixtureGroup,
    states: fixtures,
  }));
}
