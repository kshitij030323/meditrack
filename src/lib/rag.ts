import { query, toVector } from './db';

/**
 * Retrieval for the RAG features. Each retrieved record gets a short key
 * ([K1] knowledge base, [C1] past case, [M1] medication, [V1] visit) that the
 * model cites and the UI turns into clickable source chips.
 */

export type SourceKind = 'condition' | 'case' | 'medication' | 'visit';

export interface RagSource {
  key: string;
  kind: SourceKind;
  id: number;
  title: string;
  subtitle: string;
  similarity: number | null;
  snippet: string;
}

export interface ConditionHit {
  condition_id: number;
  name: string;
  description: string;
  red_flags: string | null;
  similarity: number | null;
  keyword_rank: number | null;
  semantic_rank: number | null;
  score: number;
}

export interface CaseHit {
  visit_id: number;
  visit_date: string;
  symptom_note: string;
  diagnosis: string | null;
  outcome: string | null;
  patient_age: number;
  patient_gender: string;
  department: string;
  treatment: string | null;
  labs: string | null;
  abnormal_labs: number;
  similarity: number;
}

export interface MedicationHit {
  medication_id: number;
  name: string;
  form: string;
  strength: string | null;
  drug_class: string | null;
  description: string | null;
  stock_qty: number;
  similarity: number | null;
  keyword_rank: number | null;
  score: number;
  interactions: string | null;
}

export type SearchMode = 'hybrid' | 'semantic' | 'keyword';

export function searchConditions(embedding: number[] | null, text: string, mode: SearchMode, k: number) {
  return query<ConditionHit>(
    `SELECT c.condition_id, c.name, c.description, c.red_flags,
            s.similarity, s.keyword_rank, s.semantic_rank, s.score
       FROM fn_search_conditions($1::vector, $2, $3, $4) s
       JOIN conditions_kb c USING (condition_id)
      ORDER BY s.score DESC, s.similarity DESC NULLS LAST`,
    [embedding ? toVector(embedding) : null, text, mode, k],
  );
}

export function searchMedications(embedding: number[] | null, text: string, mode: SearchMode, k: number) {
  return query<MedicationHit>(
    `SELECT m.medication_id, m.name, m.form, m.strength, m.drug_class, m.description, m.stock_qty,
            s.similarity, s.keyword_rank, s.score,
            (SELECT string_agg(other.name || ' (' || di.severity || '): ' || di.description, ' | '
                               ORDER BY di.severity DESC)
               FROM drug_interactions di
               JOIN medications other
                 ON other.medication_id = CASE WHEN di.medication_a_id = m.medication_id
                                               THEN di.medication_b_id ELSE di.medication_a_id END
              WHERE m.medication_id IN (di.medication_a_id, di.medication_b_id)) AS interactions
       FROM fn_search_medications($1::vector, $2, $3, $4) s
       JOIN medications m USING (medication_id)
      ORDER BY s.score DESC, s.similarity DESC NULLS LAST`,
    [embedding ? toVector(embedding) : null, text, mode, k],
  );
}

export function similarCases(embedding: number[], k: number, excludeVisit: number | null = null) {
  return query<CaseHit>(
    `SELECT cl.visit_id, cl.visit_date, cl.symptom_note, cl.diagnosis, cl.outcome, cl.patient_age,
            cl.patient_gender, cl.department, cl.treatment, cl.labs, cl.abnormal_labs, s.similarity
       FROM fn_similar_cases($1::vector, $2, $3) s
       JOIN v_case_library cl USING (visit_id)
      ORDER BY s.similarity DESC`,
    [toVector(embedding), k, excludeVisit],
  );
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

export function conditionSources(hits: ConditionHit[]): RagSource[] {
  return hits.map((c, i) => ({
    key: `K${i + 1}`,
    kind: 'condition',
    id: c.condition_id,
    title: c.name,
    subtitle: 'Knowledge base',
    similarity: c.similarity,
    snippet: c.description,
  }));
}

export function caseSources(hits: CaseHit[]): RagSource[] {
  return hits.map((c, i) => ({
    key: `C${i + 1}`,
    kind: 'case',
    id: c.visit_id,
    title: c.diagnosis ?? 'Undiagnosed visit',
    subtitle: `${c.patient_age} y ${c.patient_gender}, ${c.department}, ${fmtDate(c.visit_date)}`,
    similarity: c.similarity,
    snippet: c.symptom_note,
  }));
}

export function medicationSources(hits: MedicationHit[]): RagSource[] {
  return hits.map((m, i) => ({
    key: `M${i + 1}`,
    kind: 'medication',
    id: m.medication_id,
    title: `${m.name}${m.strength ? ` ${m.strength}` : ''}`,
    subtitle: [m.drug_class, m.form].filter(Boolean).join(', '),
    similarity: m.similarity,
    snippet: m.description ?? '',
  }));
}

export function conditionContext(hits: ConditionHit[]): string {
  return hits
    .map(
      (c, i) =>
        `[K${i + 1}] Condition: ${c.name}\nDescription: ${c.description}\nRed flags: ${c.red_flags ?? 'none recorded'}`,
    )
    .join('\n\n');
}

export function caseContext(hits: CaseHit[]): string {
  return hits
    .map(
      (c, i) =>
        `[C${i + 1}] Past case (${c.patient_age}-year-old ${c.patient_gender}, ${c.department}, ${fmtDate(c.visit_date)}; similarity ${c.similarity.toFixed(2)})\n` +
        `Presenting note: ${c.symptom_note}\n` +
        `Diagnosis: ${c.diagnosis ?? 'not recorded'} | Outcome: ${c.outcome ?? 'not recorded'}\n` +
        `Treatment: ${c.treatment ?? 'none prescribed'}\n` +
        `Labs: ${c.labs ?? 'none'}`,
    )
    .join('\n\n');
}

export function medicationContext(hits: MedicationHit[]): string {
  return hits
    .map(
      (m, i) =>
        `[M${i + 1}] Medication: ${m.name}${m.strength ? ` ${m.strength}` : ''} ${m.form} (${m.drug_class ?? 'unclassified'}); in stock: ${m.stock_qty}\n` +
        `Use: ${m.description ?? 'n/a'}\n` +
        `Known interactions: ${m.interactions ?? 'none recorded'}`,
    )
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export const ASSISTANT_SYSTEM = `You are MediTrack Assist, a clinical decision-support assistant for doctors at a multi-specialty hospital in Bangalore.
Each question arrives with a <context> block retrieved from the hospital's own database: condition knowledge-base entries [K#], de-identified past cases [C#] and formulary medications [M#].

- Base every clinical statement on the context and cite the record keys right after it, each key in its own brackets, for example "worse after meals [K2][C4]".
- If the context does not cover the question, say so plainly and suggest what to check. Never invent doses, statistics or facts that are not in the context.
- Call out red flags that need urgent escalation.
- Keep answers under 250 words, using short paragraphs or bullets.
- You support the doctor's judgment; you do not replace it.`;

export const TRIAGE_SYSTEM = `You are MediTrack Triage, helping a doctor review a new patient's symptom note.
Use only the knowledge-base entries [K#] and similar past cases [C#] in the <context> block. Reply in Markdown with exactly these sections:

### Urgency
**Emergency**, **Urgent** or **Routine**, then one sentence explaining why.

### Differential considerations
Up to 4 numbered items, most likely first, each with a one-line rationale and citations.

### Red flags to check now
Short bullets.

### Suggested next steps
Investigations and immediate management to consider. No drug doses.

### What similar past cases show
1-3 bullets on the diagnoses, treatments and outcomes of the closest cases.

Cite record keys after each claim, each key in its own brackets, like [K2][C5]. Only cite a record for what it actually says. If the evidence is thin, say so. Do not state a definitive diagnosis.`;

export const SUMMARY_SYSTEM = `You summarise a patient's hospital record for the treating doctor.
Use only the record in the <context> block and cite visit keys like [V2]. Reply in Markdown with these bold headings: **Snapshot** (2 sentences), **Key problems**, **Recent medications**, **Notable labs** (note trends when a test repeats), **Follow-ups due**.
Stay under 220 words and do not speculate beyond the record.`;

// ---------------------------------------------------------------------------
// Extractive fallbacks (used when no language model is reachable)
// ---------------------------------------------------------------------------

export function extractiveAnswer(conds: ConditionHit[], cases: CaseHit[], meds: MedicationHit[]): string {
  const lines: string[] = ['No language model is connected, so these are the most relevant records MediTrack retrieved.'];
  if (conds.length) {
    lines.push('', '**Conditions**');
    conds.slice(0, 4).forEach((c, i) => lines.push(`- ${c.name} [K${i + 1}]${c.red_flags ? `. Red flags: ${c.red_flags}` : ''}`));
  }
  if (cases.length) {
    lines.push('', '**Similar past cases**');
    cases.slice(0, 3).forEach((c, i) =>
      lines.push(`- ${c.diagnosis ?? 'Undiagnosed'} (${c.outcome ?? 'outcome not recorded'}): ${c.treatment ?? 'no prescription'} [C${i + 1}]`),
    );
  }
  if (meds.length) {
    lines.push('', '**Medications**');
    meds.slice(0, 4).forEach((m, i) => lines.push(`- ${m.name}: ${m.description ?? ''} [M${i + 1}]`));
  }
  return lines.join('\n');
}

export function extractiveTriage(conds: ConditionHit[], cases: CaseHit[]): string {
  const counts = new Map<string, number>();
  for (const c of cases) if (c.diagnosis) counts.set(c.diagnosis, (counts.get(c.diagnosis) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return [
    '### Urgency',
    'Not assessed: no language model is connected. Review the red flags below.',
    '',
    '### Differential considerations',
    ...conds.slice(0, 4).map((c, i) => `${i + 1}. ${c.name} [K${i + 1}]`),
    '',
    '### Red flags to check now',
    ...conds.slice(0, 3).filter((c) => c.red_flags).map((c, i) => `- ${c.name}: ${c.red_flags} [K${i + 1}]`),
    '',
    '### What similar past cases show',
    ...top.slice(0, 3).map(([dx, n]) => `- ${n} of ${cases.length} closest cases were diagnosed as ${dx}.`),
  ].join('\n');
}
