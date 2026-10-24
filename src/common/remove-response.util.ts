import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { RemovalOutcome } from './soft-delete.util.js';

/**
 * Shared HTTP response for the soft-delete/hard-delete pattern: 200 with the
 * deactivated entity when dependents exist, 204 with no body when the
 * record was physically removed.
 */
export function sendRemovalResponse<T>(
  res: Response,
  outcome: RemovalOutcome<T>,
): void {
  if (outcome.kind === 'deactivated') {
    res.status(HttpStatus.OK).json(outcome.entity);
    return;
  }
  res.status(HttpStatus.NO_CONTENT).send();
}
