import { requireActor, route } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { assertCanReadPatient, getPatientRecord } from '@/lib/records';

// /api/patients/me resolves to the signed-in patient.
export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const actor = await requireActor();
  const { id } = await ctx.params;
  const patientId = id === 'me' ? actor.id : Number(id);
  if (!Number.isInteger(patientId) || patientId <= 0) throw new ApiError(400, 'Invalid id.');
  assertCanReadPatient(actor, patientId);
  return getPatientRecord(patientId);
});
