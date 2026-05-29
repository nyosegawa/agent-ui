export interface UploadCleanupTarget {
  cleanup(): Promise<void>;
}

export function createIdempotentUploadCleanup(
  target: UploadCleanupTarget,
  onError: (error: unknown) => void = console.error,
): () => Promise<void> {
  let cleanupPromise: Promise<void> | undefined;
  return () => {
    cleanupPromise ??= target.cleanup().catch((error: unknown) => {
      onError(error);
    });
    return cleanupPromise;
  };
}
