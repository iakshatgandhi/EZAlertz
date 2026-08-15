export function formatUnknownError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "object" && error !== null) {
    try {
      return { ...(error as Record<string, unknown>) };
    } catch {
      return { value: String(error) };
    }
  }

  return { value: String(error) };
}
