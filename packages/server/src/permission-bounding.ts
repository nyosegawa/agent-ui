export function boundedFileSystemPermission(
  granted: unknown,
  requested: unknown,
): unknown {
  if (granted === undefined || granted === null || requested === undefined) return undefined;
  if (typeof requested === "string") {
    if (granted === requested) return granted;
    if (isRecord(granted) && granted.mode === requested) return granted;
    return undefined;
  }
  if (!isRecord(requested)) return boundedGenericPermission(granted, requested);
  if (!isRecord(granted)) return undefined;
  if (
    typeof requested.mode === "string" &&
    typeof granted.mode === "string" &&
    granted.mode !== requested.mode
  ) {
    return undefined;
  }
  if (Array.isArray(requested.paths)) {
    if (!Array.isArray(granted.paths)) return undefined;
    const requestedPaths = new Set(requested.paths.filter((path) => typeof path === "string"));
    if (!granted.paths.every((path) => typeof path === "string" && requestedPaths.has(path))) {
      return undefined;
    }
    return granted;
  }
  return boundedProtocolFileSystemPermission(granted, requested);
}

export function boundedGenericPermission(
  granted: unknown,
  requested: unknown,
): unknown {
  if (granted === undefined || granted === null || requested === undefined) return undefined;
  return JSON.stringify(granted) === JSON.stringify(requested) ? granted : undefined;
}

function boundedProtocolFileSystemPermission(
  granted: Record<string, unknown>,
  requested: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const read = boundedPathArrayPermission(granted.read, requested.read);
  const write = boundedPathArrayPermission(granted.write, requested.write);
  const entries = boundedEntriesPermission(granted.entries, requested.entries);
  const globScanMaxDepth = boundedMaxDepthPermission(
    granted.globScanMaxDepth,
    requested.globScanMaxDepth,
  );
  const bounded = {
    ...(read !== undefined ? { read } : {}),
    ...(write !== undefined ? { write } : {}),
    ...(entries !== undefined ? { entries } : {}),
    ...(globScanMaxDepth !== undefined ? { globScanMaxDepth } : {}),
  };
  return Object.keys(bounded).length > 0 ? bounded : undefined;
}

function boundedPathArrayPermission(granted: unknown, requested: unknown): unknown {
  if (granted === undefined || granted === null) return undefined;
  if (!Array.isArray(granted) || !Array.isArray(requested)) return undefined;
  const requestedPaths = new Set(requested.filter((path) => typeof path === "string"));
  if (!granted.every((path) => typeof path === "string" && requestedPaths.has(path))) {
    return undefined;
  }
  return granted;
}

function boundedEntriesPermission(granted: unknown, requested: unknown): unknown {
  if (granted === undefined || granted === null) return undefined;
  if (!Array.isArray(granted) || !Array.isArray(requested)) return undefined;
  const requestedEntries = new Set(requested.map(permissionEntryKey).filter(Boolean));
  if (
    !granted.every((entry) => {
      const key = permissionEntryKey(entry);
      return key !== undefined && requestedEntries.has(key);
    })
  ) {
    return undefined;
  }
  return granted;
}

function permissionEntryKey(entry: unknown): string | undefined {
  if (!isRecord(entry)) return undefined;
  return JSON.stringify({
    access: entry.access,
    path: entry.path,
  });
}

function boundedMaxDepthPermission(granted: unknown, requested: unknown): unknown {
  if (granted === undefined || granted === null) return undefined;
  if (typeof granted !== "number" || typeof requested !== "number") return undefined;
  return granted <= requested ? granted : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
