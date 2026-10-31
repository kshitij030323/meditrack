import type { InteractionSeed } from './types';

export const interactions: InteractionSeed[] = [
  // ---- Severe ----
  {
    a: 'Warfarin',
    b: 'Aspirin',
    severity: 'severe',
    description:
      'Aspirin adds antiplatelet action and gastric mucosal injury to warfarin anticoagulation, sharply raising the risk of major gastrointestinal and intracranial bleeding. Avoid unless a cardiologist specifically indicates it; monitor INR closely and add PPI cover.',
  },
  {
    a: 'Warfarin',
    b: 'Ibuprofen',
    severity: 'severe',
    description:
      'NSAIDs inhibit platelets, injure the gastric lining and may displace warfarin from protein binding, causing serious bleeding and GI haemorrhage. Avoid the combination; use paracetamol for pain and check INR if exposure occurred.',
  },
  {
    a: 'Apixaban',
    b: 'Warfarin',
    severity: 'severe',
    description:
      'Two anticoagulants together cause additive anticoagulation and a high risk of life-threatening bleeding. Never co-prescribe; when switching from warfarin, start apixaban only once INR has fallen below 2.0.',
  },
  {
    a: 'Sertraline',
    b: 'Tramadol',
    severity: 'severe',
    description:
      'Both increase serotonin, and sertraline also blocks tramadol metabolism, risking serotonin syndrome (agitation, fever, tremor, clonus) and seizures. Avoid together; choose a non-serotonergic analgesic such as paracetamol or an NSAID.',
  },
  {
    a: 'Clonazepam',
    b: 'Tramadol',
    severity: 'severe',
    description:
      'Benzodiazepine plus opioid causes additive central nervous system and respiratory depression, with risk of profound sedation, coma and death. Avoid concurrent use; if unavoidable, use lowest doses and warn patient and family.',
  },
  {
    a: 'Clarithromycin',
    b: 'Atorvastatin',
    severity: 'severe',
    description:
      'Clarithromycin strongly inhibits CYP3A4, multiplying atorvastatin levels and the risk of myopathy and rhabdomyolysis with kidney injury. Withhold atorvastatin for the antibiotic course or choose azithromycin instead.',
  },
  {
    a: 'Clarithromycin',
    b: 'Colchicine',
    severity: 'severe',
    description:
      'Clarithromycin blocks CYP3A4 and P-glycoprotein, causing colchicine accumulation with fatal toxicity: diarrhoea, bone marrow suppression, muscle damage and multi-organ failure. Contraindicated, especially in kidney or liver impairment.',
  },
  {
    a: 'Sildenafil',
    b: 'Isosorbide mononitrate',
    severity: 'severe',
    description:
      'Both raise nitric oxide-cGMP signalling, producing a profound, potentially fatal drop in blood pressure with fainting or myocardial ischaemia. Absolutely contraindicated; no nitrate within 24 hours of sildenafil.',
  },
  {
    a: 'Spironolactone',
    b: 'Potassium chloride',
    severity: 'severe',
    description:
      'Spironolactone retains potassium; adding potassium supplements can cause severe hyperkalaemia with dangerous heart rhythm disturbances or cardiac arrest, especially with kidney impairment. Avoid unless potassium is closely monitored.',
  },
  {
    a: 'Methotrexate',
    b: 'Diclofenac',
    severity: 'severe',
    description:
      'NSAIDs reduce renal clearance of methotrexate, raising its levels and causing bone marrow suppression, mouth ulcers and kidney toxicity. Avoid regular diclofenac with methotrexate; use paracetamol and monitor blood counts and creatinine.',
  },
  {
    a: 'Propranolol',
    b: 'Salbutamol',
    severity: 'severe',
    description:
      'Non-selective beta blockade antagonises salbutamol and can trigger severe bronchospasm in asthma or COPD. Avoid propranolol in patients needing bronchodilators; if a beta blocker is essential, use a cardioselective agent cautiously.',
  },

  // ---- Moderate ----
  {
    a: 'Clopidogrel',
    b: 'Omeprazole',
    severity: 'moderate',
    description:
      'Omeprazole inhibits CYP2C19, reducing conversion of clopidogrel to its active form and weakening platelet inhibition, with possible stent thrombosis. Prefer pantoprazole when gastric protection is needed.',
  },
  {
    a: 'Levothyroxine',
    b: 'Ferrous sulfate',
    severity: 'moderate',
    description:
      'Iron binds levothyroxine in the gut and reduces its absorption, leading to under-treated hypothyroidism and raised TSH. Take levothyroxine on an empty stomach and iron at least 4 hours later.',
  },
  {
    a: 'Spironolactone',
    b: 'Ramipril',
    severity: 'moderate',
    description:
      'Both raise serum potassium; the combination is beneficial in heart failure but can cause hyperkalaemia and worsening kidney function. Check potassium and creatinine within one week and periodically thereafter.',
  },
  {
    a: 'Aspirin',
    b: 'Clopidogrel',
    severity: 'moderate',
    description:
      'Intentional dual antiplatelet therapy after heart attack, stent or minor stroke, but bleeding risk increases. Limit to the recommended duration, add pantoprazole for stomach protection and watch for black stools or bruising.',
  },
  {
    a: 'Sertraline',
    b: 'Sumatriptan',
    severity: 'moderate',
    description:
      'Combining an SSRI with a triptan slightly increases serotonin syndrome risk. Usually acceptable for occasional migraine attacks; counsel the patient on agitation, tremor, sweating or fever and seek help if they occur.',
  },
  {
    a: 'Azithromycin',
    b: 'Ondansetron',
    severity: 'moderate',
    description:
      'Both prolong the QT interval, adding to the risk of dangerous ventricular arrhythmias, particularly with low potassium or magnesium or existing heart disease. Correct electrolytes and consider an ECG in high-risk patients.',
  },
  {
    a: 'Doxycycline',
    b: 'Ferrous sulfate',
    severity: 'moderate',
    description:
      'Iron chelates doxycycline in the gut, markedly reducing antibiotic absorption and risking treatment failure. Separate doses by at least 2 to 3 hours, or pause iron during the antibiotic course.',
  },
  {
    a: 'Ibuprofen',
    b: 'Ramipril',
    severity: 'moderate',
    description:
      'NSAIDs blunt the blood pressure lowering effect of ACE inhibitors and, with dehydration or diuretics, can precipitate acute kidney injury and hyperkalaemia. Use the shortest course and monitor BP and renal function.',
  },
  {
    a: 'Pregabalin',
    b: 'Tramadol',
    severity: 'moderate',
    description:
      'Additive central nervous system depression causes drowsiness, dizziness, falls and, rarely, breathing suppression, especially in the elderly. Start low, avoid alcohol and advise against driving until the response is known.',
  },
  {
    a: 'Prednisolone',
    b: 'Metformin',
    severity: 'moderate',
    description:
      'Corticosteroids raise blood glucose and oppose the effect of antidiabetic medicines, worsening sugar control during steroid courses. Increase glucose monitoring and adjust diabetes therapy until the steroid is stopped.',
  },
  {
    a: 'Methotrexate',
    b: 'Amoxicillin',
    severity: 'moderate',
    description:
      'Penicillins reduce renal tubular secretion of methotrexate, raising its levels and toxicity risk. With low weekly doses monitor blood counts during the antibiotic course; prefer an alternative antibiotic with high-dose methotrexate.',
  },

  // ---- Minor ----
  {
    a: 'Warfarin',
    b: 'Paracetamol',
    severity: 'minor',
    description:
      'Regular paracetamol above 2 g daily for several days can modestly raise INR. Occasional use is the preferred analgesic with warfarin; recheck INR if taken regularly for more than a few days.',
  },
  {
    a: 'Amlodipine',
    b: 'Atorvastatin',
    severity: 'minor',
    description:
      'Amlodipine mildly inhibits CYP3A4 and slightly increases atorvastatin exposure. Commonly co-prescribed safely; ask the patient to report unexplained muscle pain or weakness.',
  },
  {
    a: 'Ferrous sulfate',
    b: 'Pantoprazole',
    severity: 'minor',
    description:
      'Acid suppression reduces conversion of dietary and supplemental iron to its absorbable form, slowing correction of anaemia. Take iron with vitamin C and recheck haemoglobin if the response is poor.',
  },
  {
    a: 'Cetirizine',
    b: 'Zolpidem',
    severity: 'minor',
    description:
      'Both can cause sedation, so next-day drowsiness and slowed reactions may increase. Usually safe at standard doses; advise caution with driving or operating machinery.',
  },
  {
    a: 'Metoprolol',
    b: 'Salbutamol',
    severity: 'minor',
    description:
      'Cardioselective beta blockers may slightly reduce the bronchodilator response to salbutamol. Generally acceptable in COPD with cardiac disease; monitor for increased wheeze or breathlessness.',
  },
];
