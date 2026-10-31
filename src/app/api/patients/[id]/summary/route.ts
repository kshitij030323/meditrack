import { idParam, requireActor, route, sse, type IdParams } from '@/lib/api';
import { resolveLlm, streamChat } from '@/lib/llm';
import { SUMMARY_SYSTEM } from '@/lib/rag';
import { getPatientRecord, recordContext } from '@/lib/records';

interface Profile {
  full_name: string;
  age: number;
  gender: string;
  blood_group: string | null;
}

// RAG over one patient's structured record: the context is the chart itself.
export const POST = route<IdParams>(async (_req, ctx) => {
  await requireActor('doctor');
  const patientId = await idParam(ctx);
  const record = await getPatientRecord(patientId);
  const profile = record.profile as unknown as Profile;
  const visits = record.visits.slice(0, 12);
  const llm = await resolveLlm();

  return sse(async (send) => {
    send('meta', { llm });
    send('sources', visits.map((v, i) => ({
      key: `V${i + 1}`, kind: 'visit', id: v.visit_id, title: v.diagnosis ?? 'Visit',
      subtitle: `${new Date(v.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}, ${v.doctor_name}`,
      similarity: null, snippet: v.symptom_note,
    })));
    if (visits.length === 0) {
      send('delta', { text: 'This patient has no recorded visits yet.' });
      return;
    }
    if (llm.provider === 'none') {
      const dx = [...new Set(visits.map((v) => v.diagnosis).filter(Boolean))];
      const abnormal = visits.flatMap((v) => v.labs.filter((l) => l.status !== 'normal').map((l) => `${l.test_name} ${l.result_value} (${l.status})`));
      send('delta', { text: [
        `**Snapshot** ${profile.full_name}, ${profile.age} y ${profile.gender}, ${visits.length} recorded visits.`,
        `**Key problems** ${dx.join(', ') || 'none recorded'}`,
        `**Notable labs** ${abnormal.slice(0, 6).join('; ') || 'all within range'}`,
        `_No language model is connected, so this summary is assembled directly from the record._`,
      ].join('\n\n') });
      return;
    }
    const context = `Patient: ${profile.full_name}, ${profile.age}-year-old ${profile.gender}, blood group ${profile.blood_group ?? 'unknown'}.\n\n${recordContext(visits)}`;
    for await (const text of streamChat(llm, SUMMARY_SYSTEM, [
      { role: 'user', content: `<context>\n${context}\n</context>\n\nSummarise this patient's record.` },
    ])) send('delta', { text });
  });
});
