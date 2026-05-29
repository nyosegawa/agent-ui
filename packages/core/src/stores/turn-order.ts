import type { TurnId } from "../state";

export function mergeOrderedTurnIds(
  existingIds: readonly TurnId[],
  incomingIds: readonly TurnId[],
): TurnId[] {
  const result = [...existingIds];

  for (const incomingId of incomingIds) {
    if (result.includes(incomingId)) continue;

    const incomingIndex = incomingIds.indexOf(incomingId);
    const nextAnchor = incomingIds
      .slice(incomingIndex + 1)
      .find((id) => result.includes(id));
    if (nextAnchor !== undefined) {
      result.splice(result.indexOf(nextAnchor), 0, incomingId);
      continue;
    }

    const previousAnchor = incomingIds
      .slice(0, incomingIndex)
      .reverse()
      .find((id) => result.includes(id));
    if (previousAnchor !== undefined) {
      result.splice(result.indexOf(previousAnchor) + 1, 0, incomingId);
      continue;
    }

    result.push(incomingId);
  }

  return result;
}
