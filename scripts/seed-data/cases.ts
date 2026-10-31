import type { CaseTemplate } from './types';

export const caseTemplates: CaseTemplate[] = [
  // =====================================================================
  // Gastroenterology / chest pain after meals
  // =====================================================================
  {
    diagnosis: 'Gastroesophageal reflux disease (GERD)',
    dept: 'Gastroenterology',
    notes: [
      'c/o burning retrosternal pain after heavy meals x 3 wks, worse with spicy food and late dinners. Sour taste in mouth on waking. No exertional component, no sweating. h/o excess tea, irregular meals. O/E afebrile, BP 124/80, PR 78, abdomen soft, mild epigastric tenderness. ECG: NAD.',
      'Sour regurgitation and chest discomfort when lying down after dinner x 2 months. Sleeps propped on 2 pillows. Occasional dry cough at night and hoarse voice in the mornings. Belching ++. BMI 29. Vitals stable, SpO2 98% RA. No dysphagia, no weight loss, no melena.',
      'Pt reports heartburn rising from upper abdomen to throat 30-60 min after meals, relieved by OTC antacid gel. Bitter fluid comes up into mouth on bending forward. Worse after fasting followed by a large meal. Non-smoker, occasional alcohol. O/E vitals WNL, abdomen soft, non-tender.',
      'Burning sensation behind sternum after oily food and coffee ~4 nights/wk, with lump-in-throat feeling and waterbrash. Wakes at night coughing. Denies exertional chest pain, breathlessness or diaphoresis. BP 130/84, HR 72 regular. Throat mildly congested. ECG normal sinus rhythm.',
    ],
    age_range: [22, 68],
    regimens: [
      [{ name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 28 }],
      [{ name: 'Omeprazole', dosage: '20 mg before meals', frequency: 'BD', duration_days: 28 }],
      [
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 56 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 5 },
      ],
    ],
    labs: [],
    outcomes: ['resolved', 'improving', 'improving', 'resolved', 'unchanged'],
    reasons: [
      'Burning in chest after eating',
      'Acidity and sour burps at night',
      'Heartburn not going away with antacids',
    ],
  },
  {
    diagnosis: 'Peptic ulcer disease',
    dept: 'Gastroenterology',
    notes: [
      'c/o gnawing epigastric pain x 6 wks, typically 2-3 hrs after meals and at night around 2 am, relieved by eating biscuits or milk. h/o self-medication with diclofenac for back pain. Bloating, early satiety. O/E pallor +, epigastric tenderness, no guarding. BP 118/76, PR 88.',
      'Burning pain in upper abdomen radiating to lower chest, worse on an empty stomach, wakes pt from sleep. Two episodes of black sticky stools last week, none since. Smoker 10/day. Vitals: BP 110/70, HR 96. Abdomen soft, tender in epigastrium. UGI endoscopy planned.',
      'Pain in the pit of the stomach soon after food, nausea, loss of appetite and ~3 kg weight loss over 2 months. Takes aspirin daily on own. No haematemesis. O/E afebrile, mild epigastric tenderness, no organomegaly. Urea breath test positive per outside lab.',
    ],
    age_range: [25, 72],
    regimens: [
      [
        { name: 'Pantoprazole', dosage: '40 mg before meals', frequency: 'BD', duration_days: 14 },
        { name: 'Amoxicillin', dosage: '1 g (2 capsules)', frequency: 'BD', duration_days: 14 },
        { name: 'Clarithromycin', dosage: '500 mg', frequency: 'BD', duration_days: 14 },
      ],
      [{ name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 56 }],
    ],
    labs: [
      { test_name: 'Hemoglobin', unit: 'g/dL', ref_range: '12-17', normal: [12.5, 15.5], abnormal: [8.5, 11.2] },
      { test_name: '13C urea breath test', unit: 'DOB per mil', ref_range: '<4', normal: [0.5, 3], abnormal: [9, 30] },
    ],
    outcomes: ['resolved', 'improving', 'improving', 'referred'],
    reasons: [
      'Stomach pain at night that improves after eating',
      'Upper abdominal pain and black stools',
      'Burning pain in stomach for many weeks',
    ],
  },
  {
    diagnosis: 'Gastritis',
    dept: 'General Medicine',
    notes: [
      'Epigastric burning and nausea x 4 days after a wedding feast and 2 nights of alcohol. Vomited twice, non-bilious, no blood. Appetite poor. O/E afebrile, BP 126/82, PR 90, epigastric tenderness, no rebound. Bowel sounds normal.',
      'c/o upper abdominal discomfort and fullness after meals since starting ibuprofen for knee pain 10 days ago. Belching, mild nausea. No melena. Vitals WNL. Abdomen soft, mild tenderness in epigastrium. Advised to stop NSAID.',
      'Pt on night shifts with irregular meals reports gnawing pain in upper belly, worse when hungry, with sour belching and bloating x 2 wks. Drinks 5-6 cups of tea a day. O/E vitals stable, epigastric tenderness, no organomegaly.',
    ],
    age_range: [18, 65],
    regimens: [
      [
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 14 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 3 },
      ],
      [{ name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 28 }],
    ],
    labs: [],
    outcomes: ['resolved', 'resolved', 'improving', 'improving'],
    reasons: [
      'Stomach burning and vomiting after party food',
      'Acidity since taking painkillers',
      'Pain in upper stomach when hungry',
    ],
  },
  {
    diagnosis: 'Cholelithiasis with biliary colic',
    dept: 'Gastroenterology',
    notes: [
      'c/o severe colicky pain in RUQ radiating to right shoulder blade, began ~45 min after a fried dinner, lasted 3 hrs. Two similar episodes in last month. Nausea, vomited once. O/E afebrile, BP 134/86, PR 92, RUQ tenderness, Murphy sign equivocal, no icterus.',
      'Episodes of tight pain under right ribs and lower chest after heavy oily meals, sometimes waking from sleep. Feels bloated and belches a lot. Obese, h/o 3 pregnancies. No fever, no yellow eyes. O/E tender right hypochondrium. USG abdomen advised.',
      'Steady pain in upper abdomen going through to the back after eating mutton biryani, lasted 2 hrs, settled with an injection at local clinic. Similar pain 3 wks back. Afebrile, vitals stable. Abdomen soft, mild RUQ tenderness. LFT and USG ordered.',
    ],
    age_range: [30, 70],
    regimens: [
      [
        { name: 'Drotaverine', dosage: '80 mg', frequency: 'TDS', duration_days: 5 },
        { name: 'Diclofenac', dosage: '50 mg after food', frequency: 'SOS', duration_days: 3 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 3 },
      ],
      [
        { name: 'Drotaverine', dosage: '80 mg', frequency: 'SOS', duration_days: 7 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 14 },
      ],
    ],
    labs: [
      { test_name: 'Total bilirubin', unit: 'mg/dL', ref_range: '0.3-1.2', normal: [0.4, 1.0], abnormal: [1.4, 2.6] },
      { test_name: 'Alkaline phosphatase', unit: 'U/L', ref_range: '44-147', normal: [60, 130], abnormal: [160, 320] },
      { test_name: 'WBC count', unit: 'x10^3/uL', ref_range: '4-11', normal: [5, 9], abnormal: [11.5, 14.5] },
    ],
    outcomes: ['referred', 'referred', 'improving', 'resolved'],
    reasons: [
      'Severe pain on right side of stomach after food',
      'Pain under right ribs going to the shoulder',
      'Gallstone pain again after dinner',
    ],
  },
  {
    diagnosis: 'Irritable bowel syndrome',
    dept: 'Gastroenterology',
    notes: [
      'Recurrent lower abdominal cramping x 1 yr, relieved after passing stools. Alternating loose motions in the morning and constipation. Bloating worse by evening, mucus in stools at times. No blood, no weight loss, no nocturnal symptoms. Exam unremarkable. IT job with high stress.',
      'c/o urgency to pass stools soon after breakfast, 3-4 loose motions/day, gas and abdominal distension. Flares during exams and travel. Stool routine normal x 2. No fever, appetite good, weight stable. Abdomen soft, mild LIF tenderness.',
      'Pt reports incomplete evacuation, hard pellet-like stools, griping pain across lower abdomen eased by defecation, and frequent burping. Symptoms 8 months, waxing and waning. Avoids milk. Vitals WNL, PR exam normal. Baseline CBC and TSH normal.',
    ],
    age_range: [18, 50],
    regimens: [
      [
        { name: 'Drotaverine', dosage: '80 mg', frequency: 'SOS', duration_days: 14 },
        { name: 'Amitriptyline', dosage: '10 mg', frequency: 'HS', duration_days: 60 },
      ],
      [{ name: 'Drotaverine', dosage: '80 mg', frequency: 'BD', duration_days: 14 }],
    ],
    labs: [],
    outcomes: ['improving', 'improving', 'unchanged', 'resolved'],
    reasons: [
      'Stomach cramps and loose motions for months',
      'Bloating and irregular bowel habits',
      'Gas trouble and stomach pain with stress',
    ],
  },
  {
    diagnosis: 'Acute gastroenteritis',
    dept: 'General Medicine',
    notes: [
      'c/o loose watery stools 8-10 episodes since last night after eating street pani puri, vomiting x 4, crampy periumbilical pain. Low-grade fever 99.8 F. O/E dry tongue, PR 104, BP 108/70, abdomen soft, hyperactive bowel sounds. No blood in stools.',
      'Family of 3 with vomiting and diarrhoea after a wedding lunch. Pt has had 6 watery stools and 3 vomits, thirsty and dizzy on standing, little urine since morning. BP 100/64 with postural drop, HR 110. Abdomen diffusely tender, no guarding.',
      'Sudden onset nausea, vomiting and frequent loose motions x 1 day with body ache and chills. Tolerating sips of fluid. Afebrile now. Skin turgor mildly reduced. Vitals: BP 118/76, PR 96, SpO2 99% RA.',
    ],
    age_range: [5, 75],
    regimens: [
      [
        { name: 'Oral rehydration salts', dosage: '200 ml after each loose stool', frequency: 'SOS', duration_days: 3 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'TDS', duration_days: 2 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 3 },
      ],
      [
        { name: 'Sodium chloride 0.9%', dosage: '1000 ml IV over 2 hrs', frequency: 'STAT', duration_days: 1 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 2 },
        { name: 'Oral rehydration salts', dosage: '200 ml after each loose stool', frequency: 'SOS', duration_days: 3 },
      ],
    ],
    labs: [
      { test_name: 'Serum sodium', unit: 'mmol/L', ref_range: '135-145', normal: [136, 143], abnormal: [126, 133] },
      { test_name: 'Serum potassium', unit: 'mmol/L', ref_range: '3.5-5.1', normal: [3.7, 4.8], abnormal: [2.8, 3.4] },
      { test_name: 'Serum creatinine', unit: 'mg/dL', ref_range: '0.6-1.2', normal: [0.7, 1.1], abnormal: [1.3, 1.9] },
    ],
    outcomes: ['resolved', 'resolved', 'resolved', 'improving', 'admitted'],
    reasons: [
      'Loose motions and vomiting since yesterday',
      'Food poisoning after eating outside',
      'Stomach upset with vomiting and weakness',
    ],
  },

  // =====================================================================
  // Cardiology
  // =====================================================================
  {
    diagnosis: 'Stable angina',
    dept: 'Cardiology',
    notes: [
      'c/o heaviness in centre of chest on climbing 2 flights of stairs x 2 months, relieved within 5 min of rest. Also comes on when walking back to office after a heavy lunch. Radiates to left shoulder. k/c/o DM x 8 yrs, smoker. BP 148/90, PR 82, S1S2 normal. Resting ECG: no acute changes.',
      'Pressure-like chest tightness with breathlessness on brisk morning walks, especially in cold weather, settles on standing still. No pain at rest. Father had a heart attack at 52. Lipids high on last check. O/E BP 138/88, BMI 28. ECG: nonspecific T inversion V4-V6. TMT planned.',
      'Retrosternal discomfort and jaw ache when walking fast after meals or carrying vegetables uphill x 6 wks, lasting 3-5 min. Denies sweating or syncope. h/o HTN on amlodipine. Afebrile, HR 76 regular, chest clear. Echo: normal LV function.',
      'Squeezing chest pain on exertion relieved by sublingual tablet given by local GP. Effort tolerance reduced to ~300 m. No orthopnoea, no PND. Ex-smoker. BP 142/86, pulse 70/min regular. TMT: 2 mm ST depression in lateral leads at stage 2.',
    ],
    age_range: [40, 80],
    regimens: [
      [
        { name: 'Aspirin', dosage: '75 mg after lunch', frequency: 'OD', duration_days: 90 },
        { name: 'Atorvastatin', dosage: '40 mg', frequency: 'HS', duration_days: 90 },
        { name: 'Metoprolol', dosage: '25 mg', frequency: 'OD', duration_days: 90 },
        { name: 'Isosorbide mononitrate', dosage: '30 mg morning', frequency: 'OD', duration_days: 90 },
      ],
      [
        { name: 'Aspirin', dosage: '75 mg after lunch', frequency: 'OD', duration_days: 90 },
        { name: 'Atorvastatin', dosage: '40 mg', frequency: 'HS', duration_days: 90 },
        { name: 'Amlodipine', dosage: '5 mg', frequency: 'OD', duration_days: 90 },
        { name: 'Isosorbide mononitrate', dosage: '30 mg morning', frequency: 'OD', duration_days: 30 },
      ],
    ],
    labs: [
      { test_name: 'LDL cholesterol', unit: 'mg/dL', ref_range: '<100', normal: [60, 95], abnormal: [130, 190] },
      { test_name: 'Total cholesterol', unit: 'mg/dL', ref_range: '<200', normal: [140, 190], abnormal: [215, 280] },
    ],
    outcomes: ['improving', 'improving', 'unchanged', 'referred', 'improving'],
    reasons: [
      'Chest pain while climbing stairs',
      'Chest heaviness when walking after meals',
      'Tightness in chest on exertion, relieved by rest',
    ],
  },
  {
    diagnosis: 'Acute myocardial infarction',
    dept: 'Cardiology',
    notes: [
      'Brought by family with crushing central chest pain for 40 min, radiating to left arm and jaw, with profuse sweating and vomiting. k/c/o DM, HTN. O/E anxious, diaphoretic, BP 100/66, PR 108, SpO2 93% RA. ECG: ST elevation in II, III, aVF. Cath lab alerted.',
      'Sudden heavy pressure in chest while at gym, like a weight sitting on the chest, pain going to both arms, cold and clammy, breathless. Pain > 30 min, not relieved by rest. Smoker 20 pack-yrs. BP 150/94, HR 96. ECG: ST elevation V1-V4.',
      'Elderly diabetic c/o uneasiness in upper abdomen and breathlessness since early morning, sweating and extreme fatigue, no typical pain. BP 92/60, PR 118, SpO2 91% RA, bibasal crepts. ECG: new LBBB. Troponin sent STAT.',
      'c/o tight band-like retrosternal pain at rest x 2 hrs, radiating to neck, with nausea and a sense of impending doom. Exertional chest pain over the past week. O/E pale, sweaty, BP 136/88, HR 88. ECG: ST depression V4-V6 with T inversion.',
    ],
    age_range: [40, 85],
    regimens: [
      [
        { name: 'Aspirin', dosage: '75 mg after lunch', frequency: 'OD', duration_days: 180 },
        { name: 'Clopidogrel', dosage: '75 mg', frequency: 'OD', duration_days: 180 },
        { name: 'Atorvastatin', dosage: '80 mg', frequency: 'HS', duration_days: 180 },
        { name: 'Metoprolol', dosage: '25 mg', frequency: 'OD', duration_days: 180 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 90 },
      ],
      [
        { name: 'Aspirin', dosage: '300 mg chewed (loading)', frequency: 'STAT', duration_days: 1 },
        { name: 'Clopidogrel', dosage: '300 mg (loading)', frequency: 'STAT', duration_days: 1 },
        { name: 'Atorvastatin', dosage: '80 mg', frequency: 'STAT', duration_days: 1 },
      ],
    ],
    labs: [
      { test_name: 'Troponin I', unit: 'ng/mL', ref_range: '<0.04', normal: [0.0, 0.03], abnormal: [0.5, 8] },
      { test_name: 'CK-MB', unit: 'U/L', ref_range: '<25', normal: [8, 22], abnormal: [45, 180] },
      { test_name: 'LDL cholesterol', unit: 'mg/dL', ref_range: '<100', normal: [60, 95], abnormal: [130, 190] },
    ],
    outcomes: ['admitted', 'admitted', 'admitted', 'referred'],
    reasons: [
      'Severe chest pain with sweating',
      'Chest pain spreading to left arm',
      'Sudden breathlessness and chest discomfort',
    ],
  },
  {
    diagnosis: 'Essential hypertension',
    dept: 'General Medicine',
    notes: [
      'Routine check: BP 158/98 and 154/96 on two readings, asymptomatic except occasional occipital headache in the mornings. Family h/o high BP. Salty diet with pickles daily, sedentary job. BMI 28. CVS: S1S2 normal, no bruit. Fundus: mild AV nipping.',
      'c/o heaviness of head and dizziness x 1 month, home BP readings 150-165/90-100. Snores at night. Drinks alcohol on weekends. O/E BP 162/100 (R arm), 158/98 (L arm), PR 84 regular, no pedal oedema. Urine dipstick: trace protein.',
      'Follow-up of raised BP noted at pharmacy (148/94). No chest pain, no breathlessness. Works night shifts, high stress, smokes 5/day. Repeat clinic BP 146/92 after 10 min rest. Creatinine, lipid profile and ECG ordered.',
    ],
    age_range: [35, 80],
    regimens: [
      [{ name: 'Amlodipine', dosage: '5 mg', frequency: 'OD', duration_days: 90 }],
      [
        { name: 'Amlodipine', dosage: '5 mg', frequency: 'OD', duration_days: 90 },
        { name: 'Ramipril', dosage: '5 mg', frequency: 'OD', duration_days: 90 },
      ],
    ],
    labs: [
      { test_name: 'Serum creatinine', unit: 'mg/dL', ref_range: '0.6-1.2', normal: [0.7, 1.1], abnormal: [1.3, 1.8] },
      { test_name: 'Urine albumin-creatinine ratio', unit: 'mg/g', ref_range: '<30', normal: [5, 25], abnormal: [40, 200] },
    ],
    outcomes: ['improving', 'improving', 'unchanged', 'improving', 'resolved'],
    reasons: [
      'BP high at pharmacy check',
      'Headache and high BP readings at home',
      'Routine blood pressure follow-up',
    ],
  },
  {
    diagnosis: 'Heart failure',
    dept: 'Cardiology',
    notes: [
      'c/o breathlessness on walking short distances x 3 wks, now needs 3 pillows to sleep and wakes up gasping at night. Swelling of both feet. h/o heart attack 2 yrs ago. O/E JVP raised, bilateral basal crepts, pitting pedal oedema ++. BP 112/76, PR 104, SpO2 92% RA.',
      'Progressive exertional dyspnoea and fatigue, weight up 4 kg in 10 days, abdomen feels full, reduced urine output. Long-standing HTN with poor compliance. O/E tachypnoeic, S3 gallop, tender hepatomegaly, bilateral ankle oedema. CXR: cardiomegaly, upper lobe diversion.',
      'Night-time dry cough and wheeze, cannot lie flat, legs puffy by evening. Known DM and CKD stage 3. BP 138/84, HR 96, SpO2 94% RA, fine crackles at both bases. Echo: EF 30%, dilated LV.',
    ],
    age_range: [50, 85],
    regimens: [
      [
        { name: 'Furosemide', dosage: '40 mg morning', frequency: 'OD', duration_days: 30 },
        { name: 'Ramipril', dosage: '2.5 mg', frequency: 'OD', duration_days: 90 },
        { name: 'Metoprolol', dosage: '25 mg', frequency: 'OD', duration_days: 90 },
        { name: 'Spironolactone', dosage: '25 mg', frequency: 'OD', duration_days: 90 },
      ],
      [
        { name: 'Furosemide', dosage: '40 mg', frequency: 'BD', duration_days: 7 },
        { name: 'Metoprolol', dosage: '25 mg', frequency: 'OD', duration_days: 90 },
        { name: 'Ramipril', dosage: '5 mg', frequency: 'OD', duration_days: 90 },
      ],
    ],
    labs: [
      { test_name: 'NT-proBNP', unit: 'pg/mL', ref_range: '<125', normal: [30, 110], abnormal: [900, 6000] },
      { test_name: 'Serum sodium', unit: 'mmol/L', ref_range: '135-145', normal: [136, 143], abnormal: [126, 133] },
      { test_name: 'Serum creatinine', unit: 'mg/dL', ref_range: '0.6-1.2', normal: [0.7, 1.1], abnormal: [1.3, 2.0] },
    ],
    outcomes: ['admitted', 'improving', 'improving', 'admitted', 'unchanged'],
    reasons: [
      'Breathlessness and swollen legs',
      'Unable to lie flat at night due to breathlessness',
      'Weight gain and puffiness of feet',
    ],
  },
  {
    diagnosis: 'Atrial fibrillation',
    dept: 'Cardiology',
    notes: [
      'c/o fluttering in chest and palpitations on and off x 2 wks, tires easily, mild breathlessness on exertion. k/c/o HTN. O/E pulse irregularly irregular 124/min, apex-pulse deficit 14, BP 136/84. ECG: absent P waves, irregular narrow QRS complexes.',
      'Elderly pt with giddiness and irregular heartbeat noted by family on home BP machine. No chest pain. h/o rheumatic fever in childhood. O/E mid-diastolic murmur at apex, irregular pulse 110/min. Echo: mitral stenosis, dilated left atrium.',
      'Sudden pounding heartbeat after a weekend of heavy drinking, uneasiness, breathless on stairs. BP 128/80, HR 140 irregular, SpO2 97% RA. Chest clear. ECG shows irregular rhythm without P waves. TSH sent.',
    ],
    age_range: [45, 85],
    regimens: [
      [
        { name: 'Metoprolol', dosage: '25 mg', frequency: 'BD', duration_days: 90 },
        { name: 'Apixaban', dosage: '5 mg', frequency: 'BD', duration_days: 180 },
      ],
      [
        { name: 'Metoprolol', dosage: '25 mg', frequency: 'OD', duration_days: 90 },
        { name: 'Warfarin', dosage: '5 mg (adjust as per INR)', frequency: 'OD', duration_days: 90 },
      ],
    ],
    labs: [
      { test_name: 'TSH', unit: 'mIU/L', ref_range: '0.4-4.5', normal: [0.8, 3.5], abnormal: [0.01, 0.2] },
      { test_name: 'INR', unit: 'ratio', ref_range: '0.8-1.2', normal: [0.9, 1.1], abnormal: [2.0, 3.2] },
    ],
    outcomes: ['improving', 'improving', 'admitted', 'referred', 'unchanged'],
    reasons: [
      'Irregular heartbeat and palpitations',
      'Heart racing and giddiness',
      'Follow-up for blood thinner and heart rhythm',
    ],
  },

  // =====================================================================
  // Fevers and infections (General Medicine)
  // =====================================================================
  {
    diagnosis: 'Typhoid fever',
    dept: 'General Medicine',
    notes: [
      'Fever x 7 days in step-ladder pattern, now 103 F in evenings, with headache, malaise, poor appetite and dull abdominal pain. Constipated. Took only paracetamol. O/E coated tongue, relative bradycardia PR 88, mild hepatosplenomegaly, BP 110/70.',
      'c/o continuous fever with chills x 9 days, generalised weakness, loose stools 2-3/day and abdominal discomfort. Lives in a PG and eats outside daily. O/E toxic look, temp 102.4 F, tender RIF, soft spleen tip palpable. Blood culture sent.',
      'Persistent fever x 1 wk not settling with paracetamol, body ache, frontal headache, dry cough and loss of appetite. No rash, no joint pain, no burning micturition. Temp 101.8 F, PR 84, abdomen soft with mild diffuse tenderness.',
    ],
    age_range: [8, 55],
    regimens: [
      [
        { name: 'Cefixime', dosage: '200 mg', frequency: 'BD', duration_days: 14 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 5 },
      ],
      [
        { name: 'Azithromycin', dosage: '500 mg', frequency: 'OD', duration_days: 7 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 5 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 3 },
      ],
      [
        { name: 'Ceftriaxone', dosage: '2 g IV', frequency: 'OD', duration_days: 10 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'TDS', duration_days: 5 },
      ],
    ],
    labs: [
      { test_name: 'WBC count', unit: 'x10^3/uL', ref_range: '4-11', normal: [5, 9], abnormal: [2.8, 3.8] },
      { test_name: 'ALT (SGPT)', unit: 'U/L', ref_range: '7-56', normal: [15, 45], abnormal: [70, 140] },
      { test_name: 'C-reactive protein', unit: 'mg/L', ref_range: '<5', normal: [1, 4], abnormal: [30, 90] },
    ],
    outcomes: ['resolved', 'improving', 'improving', 'admitted', 'resolved'],
    reasons: [
      'Fever for one week not going down',
      'High fever with stomach pain and weakness',
      'Continuous fever and loss of appetite',
    ],
  },
  {
    diagnosis: 'Dengue fever',
    dept: 'General Medicine',
    notes: [
      'High-grade fever 103 F x 3 days with severe headache, pain behind the eyes and body ache all over, like bones breaking. Nausea, no appetite. Neighbours had similar fever. O/E flushed face, temp 102.6 F, PR 102, BP 108/72, tourniquet test positive. No bleeding.',
      'c/o fever with chills x 4 days, intense joint and muscle pain, red blotchy rash on arms and chest since today. Fever subsided this morning but feels weaker, vomited twice. O/E BP 100/68, cold peripheries, mild RUQ tenderness. CBC: platelets 68,000.',
      'Sudden high fever x 2 days, retro-orbital pain, backache, nausea and loss of taste. Lives near a construction site with stagnant water. Took ibuprofen once. Vitals: T 101.8 F, HR 98, SpO2 98% RA. No petechiae. CBC and NS1 antigen sent.',
      'Day 5 of febrile illness, fever settled but now gum bleeding while brushing, pinpoint red spots on legs, abdominal pain and lethargy. BP 96/64, PR 112, capillary refill 3 s. Hct rising from 42 to 48%, platelets 32,000.',
    ],
    age_range: [10, 65],
    regimens: [
      [
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'QID', duration_days: 5 },
        { name: 'Oral rehydration salts', dosage: '200 ml, sip frequently', frequency: 'QID', duration_days: 5 },
      ],
      [
        { name: 'Sodium chloride 0.9%', dosage: '500 ml IV over 1 hr', frequency: 'STAT', duration_days: 1 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'TDS', duration_days: 5 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 3 },
      ],
    ],
    labs: [
      { test_name: 'Platelet count', unit: 'x10^3/uL', ref_range: '150-450', normal: [180, 350], abnormal: [30, 110] },
      { test_name: 'Hematocrit', unit: '%', ref_range: '36-50', normal: [38, 46], abnormal: [51, 56] },
      { test_name: 'WBC count', unit: 'x10^3/uL', ref_range: '4-11', normal: [5, 9], abnormal: [1.8, 3.6] },
    ],
    outcomes: ['resolved', 'improving', 'admitted', 'admitted', 'resolved'],
    reasons: [
      'High fever with body pain and headache',
      'Fever with rash and low platelets',
      'Fever and pain behind the eyes',
    ],
  },
  {
    diagnosis: 'Chikungunya fever',
    dept: 'General Medicine',
    notes: [
      'Abrupt fever 102 F x 2 days with severe pain and swelling of both wrists, fingers and ankles, can barely hold a cup or walk. Itchy red rash over trunk. Several similar cases in the apartment complex. O/E temp 101.6 F, bilateral wrist and ankle tenderness with swelling, maculopapular rash.',
      'c/o fever subsided after 4 days but persistent crippling pains in hands and feet, morning stiffness, walks stooped. Faint rash fading on arms. Vitals stable, afebrile. Symmetric small joint swelling, no deformity.',
      'Sudden high fever with chills, headache and body ache, plus intense pain in knees and ankles since yesterday. Unable to get up from the floor. Nausea, no bleeding. BP 122/80, HR 100, platelets normal on outside CBC.',
    ],
    age_range: [15, 75],
    regimens: [
      [{ name: 'Paracetamol', dosage: '650 mg', frequency: 'QID', duration_days: 7 }],
      [
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'TDS', duration_days: 7 },
        { name: 'Cetirizine', dosage: '10 mg', frequency: 'HS', duration_days: 5 },
      ],
      [
        { name: 'Ibuprofen', dosage: '400 mg after food', frequency: 'BD', duration_days: 7 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 7 },
      ],
    ],
    labs: [
      { test_name: 'C-reactive protein', unit: 'mg/L', ref_range: '<5', normal: [1, 4], abnormal: [20, 60] },
      { test_name: 'ESR', unit: 'mm/hr', ref_range: '0-20', normal: [5, 15], abnormal: [35, 70] },
    ],
    outcomes: ['improving', 'improving', 'unchanged', 'resolved'],
    reasons: [
      'Fever with severe joint pain',
      'Joint swelling and rash after fever',
      'Unable to walk due to joint pain after fever',
    ],
  },
  {
    diagnosis: 'Malaria',
    dept: 'General Medicine',
    notes: [
      'c/o intermittent fever with shaking chills and rigors every alternate day x 6 days, followed by drenching sweats and relief. Headache, body ache. Returned from a work site in Odisha 2 wks ago. O/E pallor, temp 103 F during chills, spleen palpable 2 cm.',
      'Fever with severe chills x 4 days, vomiting, generalised weakness and dark yellow urine. Labourer staying in a site camp. O/E temp 102 F, mild icterus, PR 110, BP 104/70, splenomegaly. Peripheral smear sent.',
      'Recurring evening fever with teeth-chattering cold followed by sweating x 5 days, aching joints, poor appetite. Afebrile between spikes. Travel to coastal district last month. Hb 10.4 g/dL. Rapid antigen test awaited.',
    ],
    age_range: [12, 65],
    regimens: [
      [
        { name: 'Artemether + Lumefantrine', dosage: '1 tablet (80/480) with milk', frequency: 'BD', duration_days: 3 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 3 },
      ],
      [
        { name: 'Artemether + Lumefantrine', dosage: '1 tablet (80/480) with milk', frequency: 'BD', duration_days: 3 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'TDS', duration_days: 3 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 2 },
      ],
    ],
    labs: [
      { test_name: 'Hemoglobin', unit: 'g/dL', ref_range: '12-17', normal: [12.5, 15.5], abnormal: [8, 11] },
      { test_name: 'Platelet count', unit: 'x10^3/uL', ref_range: '150-450', normal: [180, 350], abnormal: [60, 130] },
      { test_name: 'Total bilirubin', unit: 'mg/dL', ref_range: '0.3-1.2', normal: [0.4, 1.0], abnormal: [1.4, 2.8] },
    ],
    outcomes: ['resolved', 'improving', 'admitted', 'resolved'],
    reasons: [
      'Fever with shivering every other day',
      'Fever with chills after travel',
      'High fever with chills and vomiting',
    ],
  },
  {
    diagnosis: 'Urinary tract infection',
    dept: 'General Medicine',
    notes: [
      'c/o burning while passing urine x 3 days, going to toilet every 30 min passing small quantities, lower abdominal heaviness. Urine cloudy and foul smelling. No fever, no flank pain. O/E afebrile, suprapubic tenderness, renal angles non-tender. Dipstick: leucocytes 3+, nitrite positive.',
      'Painful and frequent micturition with urgency since yesterday, noticed pinkish urine once. Drinks little water at office to avoid restroom. Vitals: T 98.8 F, BP 118/76. Mild suprapubic tenderness. Urine microscopy: pus cells 25-30/hpf.',
      'Elderly diabetic c/o dysuria, increased frequency and low-grade fever x 2 days, family noted mild confusion. O/E temp 100.4 F, PR 98, BP 124/78, mild left renal angle tenderness. Urine culture sent.',
    ],
    age_range: [16, 80],
    regimens: [
      [
        { name: 'Nitrofurantoin', dosage: '100 mg after food', frequency: 'BD', duration_days: 5 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 3 },
      ],
      [
        { name: 'Cefixime', dosage: '200 mg', frequency: 'BD', duration_days: 7 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 3 },
      ],
      [{ name: 'Ceftriaxone', dosage: '1 g IV', frequency: 'OD', duration_days: 5 }],
    ],
    labs: [
      { test_name: 'Urine pus cells', unit: '/hpf', ref_range: '0-5', normal: [0, 4], abnormal: [15, 60] },
      { test_name: 'Urine culture colony count', unit: 'CFU/mL', ref_range: '<100000', normal: [0, 10000], abnormal: [120000, 900000] },
    ],
    outcomes: ['resolved', 'resolved', 'improving', 'admitted', 'resolved'],
    reasons: [
      'Burning while passing urine',
      'Frequent urination with pain',
      'Urine infection with mild fever',
    ],
  },
  {
    diagnosis: 'Renal colic (kidney stones)',
    dept: 'General Medicine',
    notes: [
      'Sudden severe colicky pain in left loin radiating to groin for 3 hrs, comes in waves, rolling in bed, unable to sit still. Vomited twice. Reddish urine. O/E restless, afebrile, BP 150/90 (in pain), left renal angle tenderness, abdomen soft. Urine: RBCs numerous.',
      'c/o intermittent stabbing flank pain shooting down to groin and inner thigh, with frequent urge to urinate and burning. Works outdoors in the heat, drinks ~1 L water/day. Passed a small calculus 2 yrs ago. O/E right CVA tenderness.',
      'Excruciating right-sided back pain since early morning with sweating and nausea, cannot find a comfortable position. No fever. Vitals: PR 104, BP 142/88, T 98.6 F. USG KUB: 6 mm right lower ureteric calculus with mild hydronephrosis.',
    ],
    age_range: [20, 65],
    regimens: [
      [
        { name: 'Diclofenac', dosage: '50 mg after food', frequency: 'TDS', duration_days: 5 },
        { name: 'Drotaverine', dosage: '80 mg', frequency: 'TDS', duration_days: 5 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 3 },
      ],
      [
        { name: 'Diclofenac', dosage: '50 mg after food', frequency: 'BD', duration_days: 5 },
        { name: 'Drotaverine', dosage: '80 mg', frequency: 'SOS', duration_days: 5 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 5 },
      ],
    ],
    labs: [
      { test_name: 'Urine RBC', unit: '/hpf', ref_range: '0-2', normal: [0, 2], abnormal: [15, 80] },
      { test_name: 'Serum creatinine', unit: 'mg/dL', ref_range: '0.6-1.2', normal: [0.7, 1.1], abnormal: [1.3, 1.7] },
    ],
    outcomes: ['resolved', 'improving', 'referred', 'resolved', 'admitted'],
    reasons: [
      'Severe pain in side going to groin',
      'Kidney stone pain with vomiting',
      'Back pain with blood in urine',
    ],
  },
  {
    diagnosis: 'Iron-deficiency anemia',
    dept: 'General Medicine',
    notes: [
      'c/o easy fatigability, breathlessness on climbing stairs and palpitations x 3 months. Strict vegetarian with poor intake of greens. Craves chewing ice. O/E marked pallor of conjunctiva and palms, koilonychia, PR 104, soft systolic flow murmur. No organomegaly.',
      'Feels dizzy and weak with hair fall, headaches and poor concentration at work. Walks barefoot on farm, h/o passing worms. O/E pale tongue, angular cheilitis, BP 108/68, HR 98. Stool for ova and cysts advised.',
      'Generalised weakness and breathlessness on exertion, legs feel heavy, cold hands. Long-term painkiller use for back pain, occasional dark stools. O/E severe pallor, SpO2 98% RA. Hb 7.8 g/dL on outside report. Upper GI scopy planned.',
    ],
    age_range: [14, 70],
    regimens: [
      [
        { name: 'Ferrous sulfate', dosage: '200 mg with lemon water', frequency: 'BD', duration_days: 90 },
        { name: 'Folic acid', dosage: '5 mg', frequency: 'OD', duration_days: 90 },
      ],
      [
        { name: 'Ferrous sulfate', dosage: '200 mg', frequency: 'OD', duration_days: 90 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 30 },
      ],
    ],
    labs: [
      { test_name: 'Hemoglobin', unit: 'g/dL', ref_range: '12-17', normal: [12.5, 15.5], abnormal: [6.8, 10.5] },
      { test_name: 'MCV', unit: 'fL', ref_range: '80-100', normal: [83, 95], abnormal: [62, 76] },
      { test_name: 'Serum ferritin', unit: 'ng/mL', ref_range: '15-300', normal: [30, 150], abnormal: [2, 12] },
    ],
    outcomes: ['improving', 'improving', 'improving', 'referred', 'resolved'],
    reasons: [
      'Feeling very weak and tired',
      'Low haemoglobin and breathlessness',
      'Dizziness and hair fall',
    ],
  },
  {
    diagnosis: 'Viral upper respiratory infection (common cold)',
    dept: 'General Medicine',
    notes: [
      'c/o runny nose, sneezing, scratchy throat and mild dry cough x 2 days, low-grade fever 99.6 F and body ache. Colleagues similarly unwell. O/E nasal mucosa congested, pharynx mildly red, chest clear, SpO2 99% RA.',
      'Blocked nose, watery eyes, headache and feverishness since yesterday after getting drenched in the rain. Throat itchy. No breathlessness. Temp 100.2 F, PR 88, lungs clear bilaterally.',
      'Cough and cold x 4 days, clear nasal discharge now slightly thick, mild sore throat and tiredness. Appetite fine. No ear pain, no chest pain. Afebrile today. Exam: mild pharyngeal congestion, no lymphadenopathy, chest clear.',
    ],
    age_range: [3, 70],
    regimens: [
      [
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 3 },
        { name: 'Cetirizine', dosage: '10 mg', frequency: 'HS', duration_days: 5 },
      ],
      [
        { name: 'Paracetamol', dosage: '15 mg/kg per dose', frequency: 'TDS', duration_days: 3 },
        { name: 'Cetirizine', dosage: '5 mg', frequency: 'HS', duration_days: 3 },
      ],
    ],
    labs: [],
    outcomes: ['resolved', 'resolved', 'resolved', 'improving'],
    reasons: [
      'Cold, sneezing and mild fever',
      'Running nose and sore throat',
      'Cough and cold for a few days',
    ],
  },

  // =====================================================================
  // Pulmonology
  // =====================================================================
  {
    diagnosis: 'Pulmonary tuberculosis',
    dept: 'Pulmonology',
    notes: [
      'c/o cough with sputum x 5 wks, occasional streaks of blood, evening rise of temperature, night sweats and ~6 kg weight loss. Brother was on treatment for a lung infection last year. O/E thin built, temp 99.6 F, crepitations in right infraclavicular area. SpO2 96% RA.',
      'Productive cough > 3 wks not responding to 2 courses of antibiotics, loss of appetite, tiredness and low-grade fever at night. Known diabetic, poorly controlled. O/E pallor, BMI 18, bronchial breath sounds left upper zone. CXR: left upper lobe cavity.',
      'Dry cough x 1 month, right-sided chest pain, fatigue and drenching sweats soaking the pillow at night. Works in a garment factory, lives in a crowded hostel. Temp 100.2 F, PR 98, decreased breath sounds at right apex. Sputum CBNAAT sent.',
    ],
    age_range: [16, 75],
    regimens: [
      [
        { name: 'Isoniazid + Rifampicin + Pyrazinamide + Ethambutol', dosage: '4 tablets (wt 55-69 kg)', frequency: 'OD', duration_days: 56 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 5 },
      ],
      [
        { name: 'Isoniazid + Rifampicin + Pyrazinamide + Ethambutol', dosage: '3 tablets (wt 30-54 kg)', frequency: 'OD', duration_days: 56 },
      ],
    ],
    labs: [
      { test_name: 'ESR', unit: 'mm/hr', ref_range: '0-20', normal: [5, 15], abnormal: [45, 90] },
      { test_name: 'Hemoglobin', unit: 'g/dL', ref_range: '12-17', normal: [12.5, 15.5], abnormal: [9, 11.5] },
    ],
    outcomes: ['improving', 'improving', 'improving', 'referred', 'unchanged'],
    reasons: [
      'Cough for more than a month with weight loss',
      'Blood in sputum and night sweats',
      'Persistent cough and evening fever',
    ],
  },
  {
    diagnosis: 'Community-acquired pneumonia',
    dept: 'Pulmonology',
    notes: [
      'c/o fever with chills x 3 days, cough with rusty sputum, right-sided chest pain on deep breathing, breathless on walking. O/E temp 102.2 F, RR 26/min, SpO2 93% RA, PR 108, bronchial breathing and crepts right lower zone. CXR: right lower lobe consolidation.',
      'Elderly pt brought for confusion and poor oral intake since yesterday; family noted cough and fever x 2 days. O/E drowsy but arousable, temp 100.8 F, RR 30, BP 96/60, SpO2 89% RA, crackles at left base. Blood urea elevated.',
      'Productive cough with yellow-green phlegm x 5 days after a viral fever, high temperature, body ache and stabbing left chest pain on coughing. Smoker. Temp 101.4 F, RR 22, SpO2 95% RA, coarse crepts left mid zone.',
    ],
    age_range: [18, 85],
    regimens: [
      [
        { name: 'Amoxicillin', dosage: '1 g (2 capsules)', frequency: 'TDS', duration_days: 7 },
        { name: 'Azithromycin', dosage: '500 mg', frequency: 'OD', duration_days: 5 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 5 },
      ],
      [
        { name: 'Ceftriaxone', dosage: '1 g IV', frequency: 'BD', duration_days: 7 },
        { name: 'Azithromycin', dosage: '500 mg', frequency: 'OD', duration_days: 5 },
      ],
      [
        { name: 'Doxycycline', dosage: '100 mg with full glass water', frequency: 'BD', duration_days: 7 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 5 },
      ],
    ],
    labs: [
      { test_name: 'WBC count', unit: 'x10^3/uL', ref_range: '4-11', normal: [5, 9], abnormal: [13, 22] },
      { test_name: 'C-reactive protein', unit: 'mg/L', ref_range: '<5', normal: [1, 4], abnormal: [60, 220] },
    ],
    outcomes: ['improving', 'resolved', 'admitted', 'improving', 'admitted'],
    reasons: [
      'Fever with cough and chest pain',
      'Breathlessness with high fever',
      'Cough with yellow phlegm and fever',
    ],
  },
  {
    diagnosis: 'Bronchial asthma',
    dept: 'Pulmonology',
    notes: [
      'Recurrent episodes of wheezing and dry cough at night x 3 months, waking at 3-4 am with chest tightness. Worse with dust while cleaning and with cold air. h/o eczema in childhood, mother allergic. O/E bilateral expiratory rhonchi, RR 22, SpO2 95% RA. PEFR 62% of predicted.',
      'c/o breathlessness and whistling sound from chest since last night after exposure to incense smoke. Speaking in phrases. Uses a reliever off and on. O/E RR 26, PR 112, SpO2 92% RA, widespread wheeze, prolonged expiration. Nebulisation given.',
      'Cough worse at night and after sports, noisy breathing whenever a cold starts, frequent absence from college. Allergic sneezing in the mornings. O/E few scattered wheezes, SpO2 97% RA, afebrile. Spirometry: 15% reversibility after bronchodilator.',
      'Episodic chest tightness and breathlessness while jogging and on winter mornings, relieved by puffs borrowed from a friend. Non-smoker. Lungs clear at rest today. Eosinophil count raised on last CBC.',
    ],
    age_range: [15, 60],
    regimens: [
      [
        { name: 'Montelukast', dosage: '10 mg', frequency: 'HS', duration_days: 30 },
        { name: 'Salbutamol', dosage: '4 mg', frequency: 'SOS', duration_days: 30 },
      ],
      [
        { name: 'Prednisolone', dosage: '40 mg after breakfast', frequency: 'OD', duration_days: 5 },
        { name: 'Salbutamol', dosage: '4 mg', frequency: 'TDS', duration_days: 5 },
        { name: 'Montelukast', dosage: '10 mg', frequency: 'HS', duration_days: 30 },
      ],
    ],
    labs: [
      { test_name: 'Absolute eosinophil count', unit: 'cells/uL', ref_range: '40-440', normal: [100, 400], abnormal: [520, 1100] },
      { test_name: 'Serum total IgE', unit: 'IU/mL', ref_range: '<100', normal: [20, 90], abnormal: [250, 900] },
    ],
    outcomes: ['improving', 'improving', 'resolved', 'unchanged', 'admitted'],
    reasons: [
      'Wheezing and cough at night',
      'Breathing difficulty after dust exposure',
      'Chest tightness and breathlessness while exercising',
    ],
  },
  {
    diagnosis: 'Chronic obstructive pulmonary disease (COPD) exacerbation',
    dept: 'Pulmonology',
    notes: [
      'Long-term smoker, 30 pack-yrs, c/o increased breathlessness x 4 days and more cough with thick yellow sputum after a cold. O/E pursed-lip breathing, accessory muscle use, RR 28, SpO2 86% RA, bilateral wheeze, prolonged expiration. ABG: pCO2 52 mmHg.',
      'Pt from rural Kolar who cooked on a firewood stove for 40 yrs c/o worsening cough and breathlessness, now unable to walk to the bathroom. Ankle swelling. O/E barrel chest, wheeze ++, SpO2 88% RA, PR 106.',
      'c/o increased sputum, now greenish, wheeze and breathlessness at rest x 3 days; ran out of inhalers last week. Drowsy in the mornings per family. O/E RR 30, SpO2 85% RA, diffuse rhonchi, no flapping tremor.',
    ],
    age_range: [45, 85],
    regimens: [
      [
        { name: 'Prednisolone', dosage: '40 mg after breakfast', frequency: 'OD', duration_days: 5 },
        { name: 'Azithromycin', dosage: '500 mg', frequency: 'OD', duration_days: 5 },
        { name: 'Salbutamol', dosage: '4 mg', frequency: 'TDS', duration_days: 7 },
      ],
      [
        { name: 'Prednisolone', dosage: '40 mg after breakfast', frequency: 'OD', duration_days: 5 },
        { name: 'Doxycycline', dosage: '100 mg with full glass water', frequency: 'BD', duration_days: 7 },
        { name: 'Salbutamol', dosage: '4 mg', frequency: 'TDS', duration_days: 7 },
      ],
    ],
    labs: [
      { test_name: 'Arterial pCO2', unit: 'mmHg', ref_range: '35-45', normal: [36, 44], abnormal: [48, 64] },
      { test_name: 'WBC count', unit: 'x10^3/uL', ref_range: '4-11', normal: [5, 9], abnormal: [11.5, 16] },
    ],
    outcomes: ['admitted', 'improving', 'improving', 'admitted', 'referred'],
    reasons: [
      'Breathlessness worse than usual with cough',
      'Smoker with increased phlegm and wheeze',
      'Difficulty breathing, needs nebulisation',
    ],
  },

  // =====================================================================
  // Endocrinology
  // =====================================================================
  {
    diagnosis: 'Type 2 diabetes mellitus',
    dept: 'Endocrinology',
    notes: [
      'c/o excessive thirst, passing urine frequently including 3-4 times at night, and tiredness x 2 months. Lost 4 kg despite eating well. Mother on sugar tablets. O/E BMI 29, central obesity, acanthosis nigricans on neck. BP 136/86. RBS 286 mg/dL by glucometer.',
      'Routine health check showed fasting sugar 168 mg/dL. Mostly asymptomatic; occasional tingling and burning in both feet at night and blurred vision. Desk job, no exercise. O/E vitals stable, monofilament sensation reduced over both soles.',
      'Recurrent itchy fungal rash in groin folds and a slow-healing cut on the foot x 3 wks. Feels thirsty, mouth dry, increased appetite. Gradual weight gain over years. RBS 312 mg/dL. No vomiting, no abdominal pain, alert.',
      'On metformin 500 mg BD x 6 yrs, irregular with medicines and diet. Polyuria and fatigue have returned. HbA1c 9.4% on outside report. BP 144/90. Feet: callus over 1st MTP head, pulses felt.',
    ],
    age_range: [30, 80],
    regimens: [
      [{ name: 'Metformin', dosage: '500 mg after meals', frequency: 'BD', duration_days: 90 }],
      [
        { name: 'Metformin', dosage: '1000 mg after meals', frequency: 'BD', duration_days: 90 },
        { name: 'Atorvastatin', dosage: '40 mg', frequency: 'HS', duration_days: 90 },
      ],
      [
        { name: 'Metformin', dosage: '1000 mg after meals', frequency: 'BD', duration_days: 90 },
        { name: 'Insulin Glargine', dosage: '10 units s.c.', frequency: 'HS', duration_days: 90 },
      ],
    ],
    labs: [
      { test_name: 'Fasting blood glucose', unit: 'mg/dL', ref_range: '70-100', normal: [78, 98], abnormal: [135, 240] },
      { test_name: 'HbA1c', unit: '%', ref_range: '4-5.6', normal: [4.6, 5.5], abnormal: [7.2, 10.5] },
    ],
    outcomes: ['improving', 'improving', 'unchanged', 'improving', 'referred'],
    reasons: [
      'Excessive thirst and frequent urination',
      'High sugar in health check',
      'Diabetes follow-up, sugars not controlled',
    ],
  },
  {
    diagnosis: 'Diabetic ketoacidosis',
    dept: 'Endocrinology',
    notes: [
      'Brought with vomiting x 6, diffuse abdominal pain and drowsiness since morning. Excessive thirst and passing large volumes of urine x 3 days. On insulin since age 12, missed doses during a fever. O/E dehydrated, deep sighing respiration, fruity breath, BP 94/60, PR 124. Glucometer reads HI.',
      'c/o extreme thirst, frequent urination, weakness and rapid breathing x 2 days, no previous sugar problem. Lost weight over 1 month. O/E dry mucosa, Kussmaul breathing RR 30, PR 118, BP 100/64, GCS 14. Urine ketones 3+, RBS 486 mg/dL.',
      'On oral sugar tablets, had urinary burning x 4 days, now nausea, vomiting, abdominal pain and confusion. O/E temp 100.6 F, sunken eyes, BP 98/62, RR 28, acetone smell on breath. CBG 410 mg/dL, ABG pH 7.12.',
    ],
    age_range: [14, 60],
    regimens: [
      [
        { name: 'Sodium chloride 0.9%', dosage: '1000 ml IV over 1 hr', frequency: 'STAT', duration_days: 1 },
        { name: 'Insulin Regular', dosage: '0.1 unit/kg/hr IV infusion', frequency: 'STAT', duration_days: 2 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 2 },
      ],
      [
        { name: 'Insulin Glargine', dosage: '16 units s.c.', frequency: 'HS', duration_days: 90 },
        { name: 'Insulin Regular', dosage: '6 units s.c. before meals', frequency: 'TDS', duration_days: 90 },
        { name: 'Potassium chloride', dosage: '15 ml diluted in water', frequency: 'BD', duration_days: 5 },
      ],
    ],
    labs: [
      { test_name: 'Random blood glucose', unit: 'mg/dL', ref_range: '70-140', normal: [85, 130], abnormal: [320, 560] },
      { test_name: 'Serum bicarbonate', unit: 'mmol/L', ref_range: '22-29', normal: [23, 28], abnormal: [8, 15] },
      { test_name: 'Blood beta-hydroxybutyrate', unit: 'mmol/L', ref_range: '<0.6', normal: [0.1, 0.4], abnormal: [3.2, 7] },
    ],
    outcomes: ['admitted', 'admitted', 'admitted', 'referred'],
    reasons: [
      'Vomiting, drowsiness and very high sugar',
      'Extreme thirst and fast breathing',
      'Diabetic with vomiting and stomach pain',
    ],
  },
  {
    diagnosis: 'Hypothyroidism',
    dept: 'Endocrinology',
    notes: [
      'c/o tiredness, weight gain of 6 kg in 6 months, feeling cold when others are comfortable, constipation and hair fall. Skin dry and rough, voice hoarse. O/E puffy face, dry skin, PR 58, delayed relaxation of ankle jerks, diffuse goitre.',
      'Sluggish and sleepy through the day, forgetful at work, low mood, aching muscles. Mother on thyroid tablets. O/E BMI 30, HR 62, BP 132/88, non-pitting oedema over shins. TSH 14.8 on outside report.',
      'Was on thyroxine 25 mcg, stopped 2 months ago. Now cold intolerance, puffiness around eyes in the mornings, constipation and slowed speech. Also taking iron tablets for low Hb. Vitals: HR 56, BP 128/86.',
    ],
    age_range: [20, 75],
    regimens: [
      [{ name: 'Levothyroxine', dosage: '50 mcg empty stomach', frequency: 'OD', duration_days: 90 }],
      [
        { name: 'Levothyroxine', dosage: '75 mcg empty stomach', frequency: 'OD', duration_days: 90 },
        { name: 'Ferrous sulfate', dosage: '200 mg after lunch', frequency: 'OD', duration_days: 90 },
      ],
    ],
    labs: [
      { test_name: 'TSH', unit: 'mIU/L', ref_range: '0.4-4.5', normal: [0.8, 3.5], abnormal: [9, 38] },
      { test_name: 'Free T4', unit: 'ng/dL', ref_range: '0.8-1.8', normal: [0.9, 1.6], abnormal: [0.3, 0.7] },
    ],
    outcomes: ['improving', 'improving', 'resolved', 'unchanged'],
    reasons: [
      'Tiredness and weight gain',
      'Feeling cold and hair fall',
      'Thyroid follow-up and medicine review',
    ],
  },
  {
    diagnosis: 'Hyperthyroidism',
    dept: 'Endocrinology',
    notes: [
      'c/o palpitations, weight loss of 7 kg in 3 months despite eating more, excessive sweating and heat intolerance. Hands shake while writing. Irritable, poor sleep. O/E PR 118 regular, fine tremor, warm moist skin, lid lag, diffuse smooth goitre with bruit.',
      'Frequent loose stools, nervousness and restlessness x 2 months; family says eyes look prominent. Feels hot all the time. BP 142/70, HR 112, brisk reflexes, bilateral proptosis. TSH suppressed on outside report.',
      'Racing heart on climbing stairs, breathless, thigh muscle weakness with difficulty getting up from squatting, tremors. Neck swelling noticed by family. O/E HR 108, tremor present, thyroid diffusely enlarged and non-tender.',
    ],
    age_range: [18, 60],
    regimens: [
      [
        { name: 'Carbimazole', dosage: '10 mg', frequency: 'TDS', duration_days: 42 },
        { name: 'Propranolol', dosage: '40 mg', frequency: 'BD', duration_days: 30 },
      ],
      [
        { name: 'Carbimazole', dosage: '10 mg', frequency: 'BD', duration_days: 60 },
        { name: 'Propranolol', dosage: '20 mg (half tablet)', frequency: 'BD', duration_days: 14 },
      ],
    ],
    labs: [
      { test_name: 'TSH', unit: 'mIU/L', ref_range: '0.4-4.5', normal: [0.8, 3.5], abnormal: [0.005, 0.08] },
      { test_name: 'Free T4', unit: 'ng/dL', ref_range: '0.8-1.8', normal: [0.9, 1.6], abnormal: [2.4, 5.5] },
    ],
    outcomes: ['improving', 'improving', 'unchanged', 'referred'],
    reasons: [
      'Palpitations, weight loss and sweating',
      'Hand tremors and nervousness',
      'Swelling in neck with fast heartbeat',
    ],
  },

  // =====================================================================
  // Neurology
  // =====================================================================
  {
    diagnosis: 'Migraine',
    dept: 'Neurology',
    notes: [
      'c/o recurrent throbbing headache over left temple x 2 yrs, 3-4 episodes/month, each lasting most of the day, with nausea and vomiting. Has to lie in a dark quiet room. Preceded by zigzag lights in vision for 20 min. Neuro exam normal, BP 116/74.',
      'Severe pulsating one-sided headache triggered by skipping lunch, bright sunlight and lack of sleep; sensitive to noise and light, nauseated. Mother has similar headaches. Paracetamol helps partially. Fundus normal, no focal deficit.',
      'Episodic pounding hemicranial pain around exams and after stress, lasting 6-24 hrs, cannot work during attacks. Vomited twice during the last one. Exam: alert, oriented, cranial nerves intact, BP 120/78.',
    ],
    age_range: [14, 55],
    regimens: [
      [
        { name: 'Sumatriptan', dosage: '50 mg at onset', frequency: 'SOS', duration_days: 30 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 30 },
      ],
      [
        { name: 'Paracetamol', dosage: '1 g at onset', frequency: 'SOS', duration_days: 10 },
        { name: 'Propranolol', dosage: '40 mg', frequency: 'BD', duration_days: 90 },
      ],
      [
        { name: 'Ibuprofen', dosage: '400 mg at onset', frequency: 'SOS', duration_days: 10 },
        { name: 'Amitriptyline', dosage: '10 mg', frequency: 'HS', duration_days: 90 },
      ],
    ],
    labs: [],
    outcomes: ['improving', 'improving', 'unchanged', 'resolved'],
    reasons: [
      'Throbbing headache on one side with vomiting',
      'Severe headaches with sensitivity to light',
      'Frequent headaches affecting work',
    ],
  },
  {
    diagnosis: 'Tension-type headache',
    dept: 'Neurology',
    notes: [
      'c/o dull band-like headache around forehead and both temples most afternoons x 2 months, builds through the workday at the laptop. No vomiting, no visual symptoms. Shoulder and scalp muscles tight and tender. Neuro exam normal. BP 122/80.',
      'Pressing bilateral headache like a tight cap, worse during exam preparation and with poor sleep. Uses phone till 2 am, drinks little water. Pericranial muscle tenderness. Fundus normal, neuro exam non-focal.',
      'Daily non-throbbing heaviness at back of head x 3 wks after job change and stress at home. Takes OTC painkillers almost daily. Afebrile, vitals WNL, trapezius muscle tightness, otherwise normal exam.',
    ],
    age_range: [16, 65],
    regimens: [
      [{ name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 10 }],
      [
        { name: 'Ibuprofen', dosage: '400 mg after food', frequency: 'SOS', duration_days: 7 },
        { name: 'Amitriptyline', dosage: '10 mg', frequency: 'HS', duration_days: 60 },
      ],
    ],
    labs: [],
    outcomes: ['resolved', 'improving', 'improving', 'unchanged'],
    reasons: [
      'Headache every evening after work',
      'Tight feeling around head and neck pain',
      'Daily headache due to stress',
    ],
  },
  {
    diagnosis: 'Bacterial meningitis',
    dept: 'Neurology',
    notes: [
      'Brought with severe headache, high fever 104 F and repeated vomiting since 1 day, now drowsy and confused. Neck stiff, unable to touch chin to chest. Photophobia present. O/E GCS 12, Kernig sign positive, PR 120, BP 106/68. No rash.',
      'c/o fever with chills x 2 days, intense headache, vomiting and pain on bending the neck. Had ear discharge last week. O/E temp 103 F, marked neck rigidity, Brudzinski sign positive, irritable. SpO2 96% RA. LP planned after CT head.',
      'Sudden high fever and headache since morning, purplish spots on legs that do not fade on pressing, stiff neck, very sleepy. Hostel resident. BP 90/58, HR 132, cold peripheries. IV antibiotics started in triage after blood culture.',
    ],
    age_range: [5, 75],
    regimens: [
      [
        { name: 'Ceftriaxone', dosage: '2 g IV', frequency: 'BD', duration_days: 10 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 5 },
      ],
      [
        { name: 'Ceftriaxone', dosage: '2 g IV', frequency: 'BD', duration_days: 14 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'TDS', duration_days: 5 },
        { name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 3 },
      ],
    ],
    labs: [
      { test_name: 'CSF WBC count', unit: 'cells/uL', ref_range: '0-5', normal: [0, 4], abnormal: [400, 3000] },
      { test_name: 'CSF glucose', unit: 'mg/dL', ref_range: '40-70', normal: [45, 65], abnormal: [10, 30] },
      { test_name: 'CSF protein', unit: 'mg/dL', ref_range: '15-45', normal: [20, 40], abnormal: [120, 350] },
    ],
    outcomes: ['admitted', 'admitted', 'admitted', 'referred'],
    reasons: [
      'High fever with headache and stiff neck',
      'Fever, vomiting and confusion',
      'Severe headache with fever and drowsiness',
    ],
  },
  {
    diagnosis: 'Ischemic stroke',
    dept: 'Neurology',
    notes: [
      'Sudden onset weakness of right arm and leg with slurring of speech for 2 hrs, noticed at breakfast. Deviation of face. k/c/o HTN, DM, irregular with medicines. O/E BP 186/104, power 2/5 right upper and lower limbs, right UMN facial palsy, expressive aphasia. Acute neuro alert activated, CT head STAT.',
      'Woke up with sudden weakness and numbness of left side of body, dragging left leg, drooping of left corner of mouth. Last seen normal at 11 pm. h/o irregular heartbeat, not on blood thinner. O/E pulse irregular, BP 162/96, left hemiparesis 3/5. CT brain: no bleed.',
      'Family noticed sudden confusion, difficulty finding words and loss of vision to one side while watching TV 90 min ago. Smoker with high cholesterol. O/E right homonymous hemianopia, mild right arm drift, GCS 14. CBG 148 mg/dL.',
    ],
    age_range: [45, 85],
    regimens: [
      [
        { name: 'Aspirin', dosage: '75 mg after lunch', frequency: 'OD', duration_days: 90 },
        { name: 'Clopidogrel', dosage: '75 mg', frequency: 'OD', duration_days: 21 },
        { name: 'Atorvastatin', dosage: '40 mg', frequency: 'HS', duration_days: 180 },
      ],
      [
        { name: 'Aspirin', dosage: '75 mg after lunch', frequency: 'OD', duration_days: 180 },
        { name: 'Atorvastatin', dosage: '80 mg', frequency: 'HS', duration_days: 180 },
        { name: 'Amlodipine', dosage: '5 mg', frequency: 'OD', duration_days: 90 },
      ],
      [
        { name: 'Apixaban', dosage: '5 mg', frequency: 'BD', duration_days: 180 },
        { name: 'Atorvastatin', dosage: '40 mg', frequency: 'HS', duration_days: 180 },
      ],
    ],
    labs: [
      { test_name: 'Random blood glucose', unit: 'mg/dL', ref_range: '70-140', normal: [90, 130], abnormal: [160, 260] },
      { test_name: 'LDL cholesterol', unit: 'mg/dL', ref_range: '<100', normal: [60, 95], abnormal: [130, 180] },
      { test_name: 'HbA1c', unit: '%', ref_range: '4-5.6', normal: [4.8, 5.5], abnormal: [7, 9.5] },
    ],
    outcomes: ['admitted', 'admitted', 'admitted', 'referred'],
    reasons: [
      'Sudden weakness of one side of body',
      'Slurred speech and face drooping',
      'Sudden numbness of arm and leg',
    ],
  },

  // =====================================================================
  // ENT
  // =====================================================================
  {
    diagnosis: 'Benign paroxysmal positional vertigo (BPPV)',
    dept: 'ENT',
    notes: [
      'c/o brief spells of room spinning lasting < 1 min when turning over in bed to the right or getting up in the morning x 5 days, with nausea. No hearing loss, no tinnitus, no headache. Dix-Hallpike positive on right with torsional nystagmus. Neuro exam normal.',
      'Giddiness on looking up to hang clothes and on bending down, short-lived, everything goes round. Afraid to move head. Minor fall at home 2 wks ago. BP 132/84 without postural drop. Hearing normal. Gait steady between episodes.',
      'Recurrent spinning sensation on lying down after a viral cold, vomited once. Feels unsteady for a while after each episode. O/E no nystagmus at rest, positional nystagmus on left Hallpike, no cerebellar signs, hearing normal.',
    ],
    age_range: [35, 80],
    regimens: [
      [{ name: 'Ondansetron', dosage: '4 mg', frequency: 'SOS', duration_days: 5 }],
      [{ name: 'Ondansetron', dosage: '4 mg', frequency: 'TDS', duration_days: 3 }],
    ],
    labs: [],
    outcomes: ['resolved', 'resolved', 'improving', 'unchanged'],
    reasons: [
      'Room spinning when turning in bed',
      'Giddiness on looking up or lying down',
      'Dizziness with nausea on head movement',
    ],
  },
  {
    diagnosis: 'Allergic rhinitis',
    dept: 'ENT',
    notes: [
      'c/o bouts of 15-20 sneezes every morning, watery running nose, itchy eyes and nose x 1 yr, worse while dusting at home and in Feb-Mar. Mouth breathing at night. O/E pale boggy inferior turbinates, clear discharge, allergic shiners.',
      'Blocked nose alternating sides, post-nasal drip with frequent throat clearing, sneezing on exposure to cold air and perfumes. Mild night cough. h/o eczema. O/E hypertrophied turbinates, no polyps, chest clear.',
      'Seasonal itching of eyes and palate, nasal congestion and runny nose since moving near a park with flowering trees. Snores at night. No fever, no facial pain. Anterior rhinoscopy: pale mucosa, watery secretions.',
    ],
    age_range: [12, 60],
    regimens: [
      [{ name: 'Cetirizine', dosage: '10 mg', frequency: 'HS', duration_days: 14 }],
      [
        { name: 'Cetirizine', dosage: '10 mg', frequency: 'HS', duration_days: 30 },
        { name: 'Montelukast', dosage: '10 mg', frequency: 'HS', duration_days: 30 },
      ],
    ],
    labs: [
      { test_name: 'Absolute eosinophil count', unit: 'cells/uL', ref_range: '40-440', normal: [100, 400], abnormal: [500, 900] },
      { test_name: 'Serum total IgE', unit: 'IU/mL', ref_range: '<100', normal: [20, 90], abnormal: [200, 700] },
    ],
    outcomes: ['improving', 'improving', 'unchanged', 'resolved'],
    reasons: [
      'Continuous sneezing and runny nose',
      'Blocked nose and itchy eyes every morning',
      'Dust allergy with sneezing',
    ],
  },
  {
    diagnosis: 'Acute otitis media',
    dept: 'ENT',
    notes: [
      'Brought by parents with right ear pain since last night, crying and tugging at the ear, fever 101.8 F, following a cold x 3 days. Poor feeding. O/E right tympanic membrane congested and bulging, light reflex lost. Throat mildly congested.',
      'Left earache with fever and irritability x 2 days, woke up crying at night. Today yellowish discharge from the ear and pain has eased. O/E pus in left external canal, small central perforation. Afebrile now, no mastoid tenderness.',
      'Fever, decreased hearing and blocked feeling in both ears after a runny nose, attends day care. O/E bilateral bulging erythematous eardrums, temp 100.6 F. Active and playful between fever spikes.',
    ],
    age_range: [2, 8],
    regimens: [
      [
        { name: 'Amoxicillin', dosage: '250 mg (paediatric dose)', frequency: 'TDS', duration_days: 7 },
        { name: 'Paracetamol', dosage: '15 mg/kg per dose', frequency: 'SOS', duration_days: 3 },
      ],
      [
        { name: 'Amoxicillin', dosage: '250 mg (paediatric dose)', frequency: 'TDS', duration_days: 5 },
        { name: 'Ibuprofen', dosage: '10 mg/kg per dose', frequency: 'SOS', duration_days: 3 },
      ],
    ],
    labs: [],
    outcomes: ['resolved', 'resolved', 'improving', 'resolved', 'referred'],
    reasons: [
      'Child has ear pain and fever',
      'Ear discharge after cold',
      'Crying with ear pain at night',
    ],
  },
  {
    diagnosis: 'Acute tonsillitis and pharyngitis',
    dept: 'ENT',
    notes: [
      'c/o sore throat with pain on swallowing x 2 days, high fever 102.8 F, no cough or cold. O/E enlarged congested tonsils with white exudates, tender enlarged jugulodigastric nodes, PR 104. Centor score 4.',
      'Throat pain, difficulty swallowing even liquids, muffled voice and bad breath x 3 days; similar episodes 4-5 times a year. O/E bilateral grade III tonsils with pus points, fever 101 F, cervical lymphadenopathy.',
      'Scratchy painful throat, mild fever, body ache and hoarseness with runny nose and cough since yesterday; siblings unwell too. O/E pharynx congested, grade I tonsils without exudate, no nodes. Temp 99.8 F.',
    ],
    age_range: [5, 35],
    regimens: [
      [
        { name: 'Amoxicillin', dosage: '500 mg', frequency: 'TDS', duration_days: 10 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 5 },
      ],
      [
        { name: 'Azithromycin', dosage: '500 mg', frequency: 'OD', duration_days: 5 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 5 },
      ],
      [
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'TDS', duration_days: 3 },
        { name: 'Cetirizine', dosage: '10 mg', frequency: 'HS', duration_days: 5 },
      ],
    ],
    labs: [
      { test_name: 'ASO titre', unit: 'IU/mL', ref_range: '<200', normal: [50, 180], abnormal: [250, 600] },
      { test_name: 'WBC count', unit: 'x10^3/uL', ref_range: '4-11', normal: [5, 9], abnormal: [12, 19] },
    ],
    outcomes: ['resolved', 'resolved', 'improving', 'resolved'],
    reasons: [
      'Sore throat and fever',
      'Pain while swallowing with swollen tonsils',
      'Throat infection again',
    ],
  },

  // =====================================================================
  // Psychiatry
  // =====================================================================
  {
    diagnosis: 'Major depressive disorder',
    dept: 'Psychiatry',
    notes: [
      'c/o persistent low mood x 2 months, lost interest in work and hobbies, no longer enjoys time with family. Wakes at 4 am and cannot sleep again. Poor appetite, lost 4 kg, feels worthless. Passive death wishes, no plan. MSE: psychomotor slowing, sad affect.',
      'Brought by spouse: withdrawn, stays in room, stopped going to office x 6 wks after job loss. Tired all the time, cannot concentrate, cries easily. Sleeps 12 hrs yet unrefreshed. No suicidal plan. Vitals WNL, TSH normal.',
      'Multiple body aches, headache and fatigue for months with several normal investigations. On probing: feels sad and hopeless, nothing gives pleasure, guilt about being a burden on family. Sleep disturbed, appetite reduced. Denies substance use.',
      'Feeling empty and low since bereavement 3 months ago, cannot sleep, lost interest in everything, poor self-care, thoughts that life is not worth living. MSE: low mood, reduced speech output, insight present. Risk assessment done, family informed.',
    ],
    age_range: [18, 75],
    regimens: [
      [
        { name: 'Sertraline', dosage: '50 mg after breakfast', frequency: 'OD', duration_days: 90 },
        { name: 'Zolpidem', dosage: '5 mg', frequency: 'HS', duration_days: 14 },
      ],
      [
        { name: 'Sertraline', dosage: '50 mg after breakfast', frequency: 'OD', duration_days: 180 },
        { name: 'Clonazepam', dosage: '0.25 mg (half tablet)', frequency: 'HS', duration_days: 14 },
      ],
      [{ name: 'Sertraline', dosage: '100 mg after breakfast', frequency: 'OD', duration_days: 180 }],
    ],
    labs: [],
    outcomes: ['improving', 'improving', 'unchanged', 'improving', 'referred'],
    reasons: [
      'Feeling low and lost interest in everything',
      'Unable to sleep and feeling hopeless',
      'Sadness and tiredness for many weeks',
    ],
  },
  {
    diagnosis: 'Generalized anxiety disorder',
    dept: 'Psychiatry',
    notes: [
      'c/o constant worry about job, finances and family health for > 6 months, cannot switch off. Restless, irritable, muscles tense, takes over an hour to fall asleep. Palpitations and sweaty palms. No discrete attacks. MSE: apprehensive, no depressive cognitions. TSH normal.',
      'Feels on edge all day, startles easily, mind keeps racing with "what if" thoughts. Frequent tension headaches, loose stools before meetings, exhausted by evening. Drinks 6 cups of coffee a day. HR 96, BP 128/84, mild tremor.',
      'Excessive worry about children and own health, repeatedly consults doctors for minor symptoms. Poor concentration, sleep onset > 1 hr. Dry mouth and frequent urination when stressed. Physical exam unremarkable.',
    ],
    age_range: [18, 65],
    regimens: [
      [
        { name: 'Sertraline', dosage: '50 mg after breakfast', frequency: 'OD', duration_days: 180 },
        { name: 'Propranolol', dosage: '20 mg (half tablet)', frequency: 'SOS', duration_days: 30 },
      ],
      [
        { name: 'Sertraline', dosage: '25 mg after breakfast', frequency: 'OD', duration_days: 14 },
        { name: 'Clonazepam', dosage: '0.25 mg (half tablet)', frequency: 'HS', duration_days: 14 },
      ],
    ],
    labs: [],
    outcomes: ['improving', 'improving', 'unchanged', 'resolved'],
    reasons: [
      'Constant worry and restlessness',
      'Nervousness, palpitations and poor sleep',
      'Feeling tense all the time',
    ],
  },
  {
    diagnosis: 'Insomnia',
    dept: 'Psychiatry',
    notes: [
      'c/o difficulty falling asleep, lies awake 2-3 hrs every night x 4 months, wakes tired and irritable at work. Uses phone in bed till late, 3 cups of tea after 6 pm. No snoring per spouse. Mood okay on screening. Vitals WNL.',
      'Elderly pt wakes at 2-3 am and cannot get back to sleep, naps in the afternoon, feels groggy in the day. Nocturia x 1. No low mood, no pain. On BP medicines. Sleep diary advised. MMSE 28/30.',
      'Night-shift worker with broken sleep, manages only 3-4 hrs in the daytime, exhausted and making errors at work. Takes alcohol to fall asleep. No snoring or breathing pauses. BP 130/82, BMI 24.',
    ],
    age_range: [20, 85],
    regimens: [
      [{ name: 'Zolpidem', dosage: '5 mg just before bed', frequency: 'HS', duration_days: 14 }],
      [{ name: 'Clonazepam', dosage: '0.25 mg (half tablet)', frequency: 'HS', duration_days: 10 }],
    ],
    labs: [],
    outcomes: ['improving', 'improving', 'unchanged', 'resolved'],
    reasons: [
      'Cannot sleep at night',
      'Waking up early and not able to sleep again',
      'Sleeping problem due to night shifts',
    ],
  },

  // =====================================================================
  // Orthopedics
  // =====================================================================
  {
    diagnosis: 'Osteoarthritis of the knee',
    dept: 'Orthopedics',
    notes: [
      'c/o pain in both knees x 2 yrs, worse on climbing stairs, squatting and sitting cross-legged for pooja, relieved by rest. Morning stiffness ~10 min. Crackling sound on movement. O/E BMI 31, bilateral crepitus, medial joint line tenderness, mild varus, ROM 0-110.',
      'Right knee pain and swelling after long walks, difficulty getting up from the floor, needs support on stairs. Takes OTC painkillers frequently. O/E mild effusion right knee, quadriceps wasting, crepitus. X-ray: reduced medial joint space, osteophytes.',
      'Gradually worsening knee pain over years, now limiting walking to 500 m, stiffness after sitting for long. No fever, no redness. O/E bony enlargement, painful terminal flexion, no warmth. BP 146/88.',
    ],
    age_range: [45, 85],
    regimens: [
      [{ name: 'Paracetamol', dosage: '650 mg', frequency: 'TDS', duration_days: 30 }],
      [
        { name: 'Diclofenac', dosage: '50 mg after food', frequency: 'BD', duration_days: 10 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 10 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 30 },
      ],
      [
        { name: 'Ibuprofen', dosage: '400 mg after food', frequency: 'BD', duration_days: 10 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 10 },
      ],
    ],
    labs: [
      { test_name: 'Vitamin D (25-OH)', unit: 'ng/mL', ref_range: '30-100', normal: [32, 60], abnormal: [8, 22] },
    ],
    outcomes: ['improving', 'unchanged', 'improving', 'referred', 'unchanged'],
    reasons: [
      'Knee pain while climbing stairs',
      'Pain and swelling in knees',
      'Difficulty walking due to knee pain',
    ],
  },
  {
    diagnosis: 'Lumbar disc herniation with sciatica',
    dept: 'Orthopedics',
    notes: [
      'c/o low back pain x 3 wks after lifting a gas cylinder, now shooting electric-like pain down back of left thigh and calf to the sole. Tingling in left foot. Worse on sitting and coughing. O/E SLR positive at 40 deg left, EHL power 4/5, ankle jerk reduced.',
      'Pain radiating from right buttock down the outer leg to the foot, numbness over dorsum of foot x 10 days. IT professional, sits 10 hrs/day. No bladder or bowel complaints. Paraspinal spasm, lumbar flexion restricted, SLR 50 deg right.',
      'Severe backache with leg pain after a long two-wheeler ride, difficulty standing straight, pain like a current running down the leg on sneezing. No saddle numbness, normal urination. MRI: L5-S1 protrusion compressing S1 root.',
    ],
    age_range: [25, 65],
    regimens: [
      [
        { name: 'Pregabalin', dosage: '75 mg', frequency: 'HS', duration_days: 30 },
        { name: 'Diclofenac', dosage: '50 mg after food', frequency: 'BD', duration_days: 7 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 7 },
      ],
      [
        { name: 'Pregabalin', dosage: '75 mg', frequency: 'BD', duration_days: 30 },
        { name: 'Tramadol', dosage: '50 mg', frequency: 'SOS', duration_days: 7 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'TDS', duration_days: 7 },
      ],
    ],
    labs: [],
    outcomes: ['improving', 'improving', 'unchanged', 'referred'],
    reasons: [
      'Back pain going down the leg',
      'Shooting leg pain and numbness',
      'Lower back pain after lifting weight',
    ],
  },
  {
    diagnosis: 'Rheumatoid arthritis',
    dept: 'Orthopedics',
    notes: [
      'c/o pain and swelling of small joints of both hands and wrists x 4 months, morning stiffness lasting 2 hrs, difficulty buttoning clothes and holding a cup. Fatigue, low-grade fever. O/E symmetric synovitis of MCPs and PIPs, wrist tenderness, weak grip.',
      'Bilateral wrist and ankle pain with swelling, worse in the mornings and better with activity x 6 months. Mother had deformed fingers. O/E boggy swelling MCP 2-3 both hands, MTP squeeze test positive.',
      'Pains in fingers, knees and feet, early morning stiffness > 1 hr, weight loss 3 kg and tiredness. Painless nodule near the elbow. Vitals stable. Early ulnar deviation of right hand fingers.',
    ],
    age_range: [25, 70],
    regimens: [
      [
        { name: 'Methotrexate', dosage: '15 mg weekly, Sunday night only', frequency: 'HS', duration_days: 90 },
        { name: 'Folic acid', dosage: '5 mg (skip methotrexate day)', frequency: 'OD', duration_days: 90 },
        { name: 'Prednisolone', dosage: '5 mg (half tablet)', frequency: 'OD', duration_days: 30 },
      ],
      [
        { name: 'Methotrexate', dosage: '10 mg weekly, Sunday night only', frequency: 'HS', duration_days: 90 },
        { name: 'Folic acid', dosage: '5 mg (skip methotrexate day)', frequency: 'OD', duration_days: 90 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 30 },
      ],
    ],
    labs: [
      { test_name: 'ESR', unit: 'mm/hr', ref_range: '0-20', normal: [5, 15], abnormal: [40, 85] },
      { test_name: 'C-reactive protein', unit: 'mg/L', ref_range: '<5', normal: [1, 4], abnormal: [15, 60] },
      { test_name: 'Rheumatoid factor', unit: 'IU/mL', ref_range: '<14', normal: [3, 12], abnormal: [40, 220] },
    ],
    outcomes: ['improving', 'improving', 'unchanged', 'referred'],
    reasons: [
      'Pain and swelling in finger joints',
      'Morning stiffness in hands and wrists',
      'Joint pain in both hands for months',
    ],
  },
  {
    diagnosis: 'Gout',
    dept: 'Orthopedics',
    notes: [
      'Woke at 3 am with excruciating pain in right big toe, red, hot and swollen, cannot bear even the bedsheet touching it. Party with beer and mutton last night. Similar episode 1 yr ago. O/E 1st MTP joint erythema, warmth, exquisite tenderness, afebrile.',
      'c/o acute painful swelling of left ankle and midfoot x 2 days, limping. On water tablets for BP. O/E swollen joint with shiny red skin over ankle, temp 99.4 F, painful range of motion. Uric acid 9.6 mg/dL.',
      'Recurrent attacks of joint pain in toes and knee, 4 episodes this year, chalky lumps over ear and elbow. Obese, drinks alcohol on weekends. Current flare right knee x 1 day with warm effusion. Joint aspirate: needle-shaped crystals.',
    ],
    age_range: [30, 75],
    regimens: [
      [
        { name: 'Colchicine', dosage: '0.5 mg', frequency: 'TDS', duration_days: 3 },
        { name: 'Ibuprofen', dosage: '400 mg after food', frequency: 'TDS', duration_days: 5 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 5 },
      ],
      [
        { name: 'Diclofenac', dosage: '50 mg after food', frequency: 'TDS', duration_days: 5 },
        { name: 'Pantoprazole', dosage: '40 mg before breakfast', frequency: 'OD', duration_days: 5 },
      ],
      [
        { name: 'Colchicine', dosage: '0.5 mg', frequency: 'BD', duration_days: 7 },
        { name: 'Paracetamol', dosage: '650 mg', frequency: 'SOS', duration_days: 5 },
      ],
    ],
    labs: [
      { test_name: 'Serum uric acid', unit: 'mg/dL', ref_range: '3.5-7.2', normal: [4, 6.8], abnormal: [8, 11.5] },
      { test_name: 'ESR', unit: 'mm/hr', ref_range: '0-20', normal: [5, 15], abnormal: [30, 60] },
    ],
    outcomes: ['resolved', 'resolved', 'improving', 'improving', 'unchanged'],
    reasons: [
      'Sudden severe pain and swelling in big toe',
      'Red swollen ankle, cannot walk',
      'Recurring joint pain attacks',
    ],
  },

  // =====================================================================
  // Dermatology
  // =====================================================================
  {
    diagnosis: 'Atopic dermatitis (eczema)',
    dept: 'Dermatology',
    notes: [
      'c/o intensely itchy, dry, red scaly patches in elbow and knee creases x 3 months, worse at night and disturbing sleep. Scratch marks and oozing in places. h/o wheezing in early years, father has hay fever. O/E lichenified plaques in antecubital fossae, excoriations, generalised xerosis.',
      'Itchy rough patches on both cheeks, neck and wrists, flares in winter and after bathing with hot water and soap. Skin cracks and stings. O/E ill-defined erythematous scaly plaques, dry skin all over, Dennie-Morgan folds.',
      'Recurrent itchy rash on hands and inner arms, worse with sweating, detergents and woollen clothes. Thickened darker skin from scratching. No ring-shaped lesions, KOH negative. Allergic sneezing in the mornings.',
    ],
    age_range: [5, 45],
    regimens: [
      [
        { name: 'Mometasone', dosage: 'thin layer on patches', frequency: 'OD', duration_days: 14 },
        { name: 'Cetirizine', dosage: '10 mg', frequency: 'HS', duration_days: 14 },
      ],
      [
        { name: 'Mometasone', dosage: 'thin layer on patches', frequency: 'OD', duration_days: 7 },
        { name: 'Cetirizine', dosage: '5 mg', frequency: 'HS', duration_days: 14 },
      ],
    ],
    labs: [
      { test_name: 'Absolute eosinophil count', unit: 'cells/uL', ref_range: '40-440', normal: [100, 400], abnormal: [550, 1000] },
      { test_name: 'Serum total IgE', unit: 'IU/mL', ref_range: '<100', normal: [20, 90], abnormal: [300, 1500] },
    ],
    outcomes: ['improving', 'improving', 'resolved', 'unchanged'],
    reasons: [
      'Itchy red patches on skin',
      'Dry itchy skin that keeps coming back',
      'Rash in elbow folds with itching at night',
    ],
  },
  {
    diagnosis: 'Psoriasis',
    dept: 'Dermatology',
    notes: [
      'c/o raised red patches with thick silvery-white scales over both elbows, knees and lower back x 1 yr, mildly itchy, bleed on scratching. Scalp heavily flaky. Worse in winter and with stress. O/E well-demarcated erythematous plaques, Auspitz sign positive, nail pitting.',
      'Itchy scaly plaques along scalp margins and behind ears, dandruff not responding to shampoos, new small red scaly spots on trunk after a throat infection 3 wks ago. O/E multiple drop-like scaly papules on trunk, scalp scaling.',
      'Extensive scaly red plaques on legs, arms and trunk covering ~15% body surface, with painful swelling of fingers and morning joint stiffness. Smoker, drinks daily. Nails thickened with onycholysis. BP 148/92.',
    ],
    age_range: [18, 70],
    regimens: [
      [
        { name: 'Mometasone', dosage: 'thin layer on plaques', frequency: 'OD', duration_days: 21 },
        { name: 'Cetirizine', dosage: '10 mg', frequency: 'HS', duration_days: 14 },
      ],
      [
        { name: 'Methotrexate', dosage: '10 mg weekly, Sunday night only', frequency: 'HS', duration_days: 90 },
        { name: 'Folic acid', dosage: '5 mg (skip methotrexate day)', frequency: 'OD', duration_days: 90 },
        { name: 'Mometasone', dosage: 'thin layer on plaques', frequency: 'OD', duration_days: 28 },
      ],
    ],
    labs: [],
    outcomes: ['improving', 'unchanged', 'improving', 'referred'],
    reasons: [
      'Scaly red patches on elbows and knees',
      'Flaky scalp and itchy plaques',
      'Skin patches spreading with joint pain',
    ],
  },
  {
    diagnosis: 'Tinea (fungal skin infection)',
    dept: 'Dermatology',
    notes: [
      'c/o itchy red circular patches in groin and inner thighs x 2 months, spreading outward with clearing centre. Used a steroid combination cream from pharmacy, temporary relief then worse. Spouse also itching. O/E annular plaques with raised scaly active border. KOH: hyphae seen.',
      'Intensely itchy round patches over waistband area and buttocks, worse with sweating, wears tight jeans in hot weather. Gym-goer, shares towels. O/E multiple annular erythematous scaly lesions with satellite papules. Diabetes screen advised.',
      'Red itchy rash in skin folds of abdomen and armpits x 6 wks, burns with sweat, family members with similar rash. O/E well-defined scaly plaques with peripheral activity, lichenification from scratching.',
    ],
    age_range: [10, 70],
    regimens: [
      [
        { name: 'Clotrimazole', dosage: 'apply on patch and 2 cm around', frequency: 'BD', duration_days: 28 },
        { name: 'Cetirizine', dosage: '10 mg', frequency: 'HS', duration_days: 14 },
      ],
      [
        { name: 'Clotrimazole', dosage: 'apply on patch and 2 cm around', frequency: 'BD', duration_days: 42 },
        { name: 'Cetirizine', dosage: '10 mg', frequency: 'HS', duration_days: 21 },
      ],
    ],
    labs: [],
    outcomes: ['improving', 'improving', 'unchanged', 'resolved', 'unchanged'],
    reasons: [
      'Itchy ring-shaped rash in groin',
      'Fungal infection not going with creams',
      'Itchy red patches on waist',
    ],
  },
];
