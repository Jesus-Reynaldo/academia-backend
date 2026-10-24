export type RemovalOutcome<T> =
  | { kind: 'deactivated'; entity: T }
  | { kind: 'deleted' };

/**
 * Shared decision: entities with dependent records are deactivated
 * (logical delete) instead of physically removed, to preserve academic
 * history as required by the requirements document.
 */
export async function removeOrDeactivate<T>(options: {
  hasDependents: () => Promise<boolean>;
  deactivate: () => Promise<T>;
  hardDelete: () => Promise<unknown>;
}): Promise<RemovalOutcome<T>> {
  const hasDependents = await options.hasDependents();

  if (hasDependents) {
    const entity = await options.deactivate();
    return { kind: 'deactivated', entity };
  }

  await options.hardDelete();
  return { kind: 'deleted' };
}
