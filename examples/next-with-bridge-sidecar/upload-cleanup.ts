export function createIdempotentUploadCleanup(
  cleanup: () => Promise<void> | void,
  options: { onError?: (error: unknown) => void } = {},
) {
  let cleanupPromise: Promise<void> | undefined;
  return () => {
    cleanupPromise ??= Promise.resolve()
      .then(cleanup)
      .catch((error: unknown) => {
        cleanupPromise = undefined;
        options.onError?.(error);
      });
    return cleanupPromise;
  };
}
