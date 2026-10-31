import type { MedicationSeed } from './types';

export const medications: MedicationSeed[] = [
  // ---- Gastrointestinal ----
  {
    name: 'Pantoprazole',
    form: 'tablet',
    strength: '40 mg',
    unit_price: 6.5,
    stock_qty: 820,
    drug_class: 'Proton pump inhibitor',
    description:
      'Acid-reducing medicine for acid reflux, heartburn, burning chest pain after meals, gastritis and stomach or duodenal ulcers; also protects the stomach while on painkillers or blood thinners. Take before breakfast. Long-term use can lower magnesium and vitamin B12 levels.',
  },
  {
    name: 'Omeprazole',
    form: 'capsule',
    strength: '20 mg',
    unit_price: 4,
    stock_qty: 460,
    drug_class: 'Proton pump inhibitor',
    description:
      'Antacid capsule that switches off stomach acid production, used for acidity, reflux (GERD), indigestion and peptic ulcers and in H. pylori eradication. Take 30 minutes before food. Avoid with clopidogrel because it weakens the anti-clotting effect.',
  },
  {
    name: 'Ondansetron',
    form: 'tablet',
    strength: '4 mg',
    unit_price: 5.5,
    stock_qty: 540,
    drug_class: 'Antiemetic (5-HT3 antagonist)',
    description:
      'Anti-vomiting medicine for nausea and vomiting from stomach infections, food poisoning, migraine, dizziness or after chemotherapy and surgery. Mouth-dissolving tablet works without water. Can cause constipation and headache; use with caution in people with heart rhythm problems (QT prolongation).',
  },
  {
    name: 'Drotaverine',
    form: 'tablet',
    strength: '80 mg',
    unit_price: 8,
    stock_qty: 380,
    drug_class: 'Antispasmodic',
    description:
      'Relieves cramping, colicky abdominal pain caused by spasm of smooth muscle, such as gallstone pain, kidney stone colic, irritable bowel cramps and period pain. May cause dizziness, low blood pressure or palpitations; avoid in severe liver, kidney or heart failure.',
  },
  {
    name: 'Oral rehydration salts',
    form: 'syrup',
    strength: '200 ml (WHO low-osmolarity)',
    unit_price: 25,
    stock_qty: 650,
    drug_class: 'Electrolyte replacement',
    description:
      'Ready-to-drink ORS solution of glucose, sodium and potassium salts to replace fluids lost through loose motions, vomiting, heavy sweating or high fever such as dengue. Sip small amounts frequently. Seek care if unable to keep fluids down or urine output drops.',
  },

  // ---- Cardiovascular and antithrombotic ----
  {
    name: 'Aspirin',
    form: 'tablet',
    strength: '75 mg',
    unit_price: 1,
    stock_qty: 900,
    drug_class: 'Antiplatelet',
    description:
      'Low-dose blood thinner (antiplatelet) that prevents clots in people with angina, previous heart attack, stent or ischaemic stroke; a 300 mg loading dose is chewed during a suspected heart attack. Can cause stomach bleeding and ulcers; avoid in dengue and with other anticoagulants unless prescribed.',
  },
  {
    name: 'Clopidogrel',
    form: 'tablet',
    strength: '75 mg',
    unit_price: 6,
    stock_qty: 610,
    drug_class: 'Antiplatelet (P2Y12 inhibitor)',
    description:
      'Antiplatelet blood thinner given with aspirin after a heart attack, coronary stent or stroke to stop clots forming. Do not stop suddenly without the cardiologist. Increases bleeding and bruising; omeprazole reduces its effect, so pantoprazole is the preferred stomach protector.',
  },
  {
    name: 'Atorvastatin',
    form: 'tablet',
    strength: '40 mg',
    unit_price: 9,
    stock_qty: 780,
    drug_class: 'Statin (HMG-CoA reductase inhibitor)',
    description:
      'Cholesterol-lowering statin that reduces LDL and the risk of heart attack and stroke in people with coronary disease, diabetes or high cholesterol. Taken once daily, often at night. Report unexplained muscle pain or weakness; clarithromycin and some antifungals raise statin levels dangerously.',
  },
  {
    name: 'Metoprolol',
    form: 'tablet',
    strength: '25 mg (succinate ER)',
    unit_price: 7,
    stock_qty: 560,
    drug_class: 'Beta blocker',
    description:
      'Beta blocker that slows a fast heart rate and lowers blood pressure, used in angina, after a heart attack, heart failure, palpitations and atrial fibrillation. Do not stop suddenly. May cause tiredness, cold hands and a slow pulse; use cautiously in asthma.',
  },
  {
    name: 'Isosorbide mononitrate',
    form: 'tablet',
    strength: '30 mg (SR)',
    unit_price: 5,
    stock_qty: 300,
    drug_class: 'Long-acting nitrate',
    description:
      'Nitrate that widens heart arteries to prevent angina chest pain on exertion such as climbing stairs or walking briskly. Headache and light-headedness are common at first. Never combine with sildenafil or tadalafil, as blood pressure can crash dangerously.',
  },
  {
    name: 'Amlodipine',
    form: 'tablet',
    strength: '5 mg',
    unit_price: 3,
    stock_qty: 880,
    drug_class: 'Calcium channel blocker',
    description:
      'First-line once-daily medicine for high blood pressure (hypertension) and for preventing angina. Works by relaxing blood vessels. Common side effects are ankle swelling, flushing and headache. Continue even when BP readings become normal unless the doctor advises otherwise.',
  },
  {
    name: 'Ramipril',
    form: 'capsule',
    strength: '5 mg',
    unit_price: 9,
    stock_qty: 420,
    drug_class: 'ACE inhibitor',
    description:
      'ACE inhibitor for high blood pressure, heart failure, after a heart attack and to protect the kidneys in diabetes. A dry tickly cough is common. Check kidney function and potassium; combining with spironolactone or potassium supplements can raise potassium. Not for use in pregnancy.',
  },
  {
    name: 'Furosemide',
    form: 'tablet',
    strength: '40 mg',
    unit_price: 1.5,
    stock_qty: 500,
    drug_class: 'Loop diuretic',
    description:
      'Strong water tablet (diuretic) that removes extra fluid in heart failure, swollen legs, fluid on the lungs and some kidney or liver diseases, easing breathlessness. Causes frequent urination; can lower potassium and sodium and cause dehydration or dizziness, so blood tests are needed.',
  },
  {
    name: 'Spironolactone',
    form: 'tablet',
    strength: '25 mg',
    unit_price: 3.5,
    stock_qty: 340,
    drug_class: 'Potassium-sparing diuretic (MRA)',
    description:
      'Potassium-sparing water tablet that improves survival in heart failure and treats fluid retention from liver cirrhosis and resistant high blood pressure. It can push potassium dangerously high, especially with potassium supplements, ACE inhibitors or kidney problems. May cause breast tenderness in men.',
  },
  {
    name: 'Apixaban',
    form: 'tablet',
    strength: '5 mg',
    unit_price: 55,
    stock_qty: 24,
    drug_class: 'Direct oral anticoagulant (factor Xa inhibitor)',
    description:
      'Modern blood thinner (anticoagulant) that prevents stroke in atrial fibrillation and treats or prevents clots in the legs (DVT) and lungs (pulmonary embolism). No routine INR tests needed. Watch for black stools, blood in urine or unusual bruising; never double up with warfarin.',
  },
  {
    name: 'Warfarin',
    form: 'tablet',
    strength: '5 mg',
    unit_price: 4,
    stock_qty: 260,
    drug_class: 'Vitamin K antagonist anticoagulant',
    description:
      'Traditional blood thinner (anticoagulant) for atrial fibrillation, mechanical heart valves, DVT and pulmonary embolism. Needs regular INR blood tests. Many drugs and painkillers such as aspirin, ibuprofen and some antibiotics increase bleeding risk; keep green leafy vegetable intake consistent.',
  },

  // ---- Endocrine ----
  {
    name: 'Metformin',
    form: 'tablet',
    strength: '500 mg',
    unit_price: 2,
    stock_qty: 900,
    drug_class: 'Biguanide antidiabetic',
    description:
      'First-choice tablet for type 2 diabetes that lowers high blood sugar without causing weight gain; also used in prediabetes and PCOS. Take with meals to reduce gas, loose stools and nausea. Stop temporarily before contrast scans, surgery or if severely dehydrated or kidney function falls.',
  },
  {
    name: 'Insulin Glargine',
    form: 'injection',
    strength: '100 IU/ml (3 ml pen)',
    unit_price: 780,
    stock_qty: 18,
    drug_class: 'Long-acting basal insulin',
    description:
      'Once-daily long-acting insulin injection that controls high blood sugar round the clock in type 1 and uncontrolled type 2 diabetes. Inject under the skin at the same time daily. Can cause low sugar (hypoglycaemia): sweating, shaking, confusion; keep glucose handy.',
  },
  {
    name: 'Insulin Regular',
    form: 'injection',
    strength: '100 IU/ml (10 ml vial)',
    unit_price: 165,
    stock_qty: 60,
    drug_class: 'Short-acting human insulin',
    description:
      'Fast-acting human insulin used before meals for high sugar spikes and as an intravenous infusion in hospital for diabetic ketoacidosis and very high blood glucose. Requires frequent sugar monitoring; risk of hypoglycaemia and low potassium during treatment.',
  },
  {
    name: 'Levothyroxine',
    form: 'tablet',
    strength: '50 mcg',
    unit_price: 1.8,
    stock_qty: 720,
    drug_class: 'Thyroid hormone replacement',
    description:
      'Thyroid hormone tablet for an underactive thyroid (hypothyroidism) causing tiredness, weight gain, feeling cold, hair fall and constipation. Take on an empty stomach early morning, 4 hours apart from iron or calcium tablets. Too high a dose causes palpitations and weight loss.',
  },
  {
    name: 'Carbimazole',
    form: 'tablet',
    strength: '10 mg',
    unit_price: 3,
    stock_qty: 210,
    drug_class: 'Antithyroid agent',
    description:
      'Antithyroid medicine for an overactive thyroid (hyperthyroidism, Graves disease) with weight loss, tremor, palpitations and heat intolerance. Report sore throat, mouth ulcers or fever immediately, as it can rarely wipe out white blood cells (agranulocytosis). Avoid in early pregnancy.',
  },
  {
    name: 'Propranolol',
    form: 'tablet',
    strength: '40 mg',
    unit_price: 2.5,
    stock_qty: 330,
    drug_class: 'Non-selective beta blocker',
    description:
      'Beta blocker that calms a racing heart, tremor and physical symptoms of anxiety or stage fright, controls symptoms of overactive thyroid and prevents frequent migraine attacks. Do not use in asthma or wheezing. May cause tiredness, vivid dreams and a slow pulse.',
  },

  // ---- Respiratory ----
  {
    name: 'Salbutamol',
    form: 'tablet',
    strength: '4 mg',
    unit_price: 0.8,
    stock_qty: 14,
    drug_class: 'Short-acting beta-2 agonist bronchodilator',
    description:
      'Bronchodilator that opens tight airways to relieve wheezing, chest tightness, breathlessness and night-time cough in asthma, COPD and wheezy bronchitis. Can cause tremor, palpitations and low potassium. Worsening breathlessness despite regular use needs urgent review.',
  },
  {
    name: 'Montelukast',
    form: 'tablet',
    strength: '10 mg',
    unit_price: 12,
    stock_qty: 480,
    drug_class: 'Leukotriene receptor antagonist',
    description:
      'Once-nightly anti-allergy tablet that prevents asthma attacks, night cough, exercise-induced wheeze and allergic rhinitis with sneezing and blocked nose. Not for relief during an acute attack. Rarely causes mood changes, nightmares or behaviour changes; report these promptly.',
  },
  {
    name: 'Prednisolone',
    form: 'tablet',
    strength: '10 mg',
    unit_price: 1.5,
    stock_qty: 430,
    drug_class: 'Oral corticosteroid',
    description:
      'Steroid tablet that rapidly reduces inflammation in asthma or COPD flare-ups, severe allergies, rheumatoid arthritis flares and autoimmune disease. Take after breakfast. Raises blood sugar and blood pressure, causes acidity and weight gain; long courses must be tapered, not stopped suddenly.',
  },

  // ---- Anti-infectives ----
  {
    name: 'Amoxicillin',
    form: 'capsule',
    strength: '500 mg',
    unit_price: 5,
    stock_qty: 640,
    drug_class: 'Penicillin antibiotic',
    description:
      'Penicillin antibiotic for bacterial throat infection, tonsillitis, ear infection, sinusitis, chest infection (pneumonia) and as part of H. pylori ulcer treatment. Complete the full course. Do not take if allergic to penicillin; may cause rash and loose stools.',
  },
  {
    name: 'Azithromycin',
    form: 'tablet',
    strength: '500 mg',
    unit_price: 22,
    stock_qty: 520,
    drug_class: 'Macrolide antibiotic',
    description:
      'Short-course macrolide antibiotic for chest infection and pneumonia, bronchitis, typhoid fever, throat infection in penicillin-allergic patients and COPD flare-ups. Usually once daily for 3 to 5 days. May cause stomach upset and, rarely, irregular heartbeat (QT prolongation).',
  },
  {
    name: 'Clarithromycin',
    form: 'tablet',
    strength: '500 mg',
    unit_price: 35,
    stock_qty: 180,
    drug_class: 'Macrolide antibiotic',
    description:
      'Macrolide antibiotic used with amoxicillin and a PPI to eradicate H. pylori in stomach ulcers, and for chest and sinus infections. Strong enzyme blocker: dangerous with atorvastatin or simvastatin (muscle breakdown) and colchicine; causes metallic taste and nausea.',
  },
  {
    name: 'Doxycycline',
    form: 'capsule',
    strength: '100 mg',
    unit_price: 4,
    stock_qty: 470,
    drug_class: 'Tetracycline antibiotic',
    description:
      'Broad-spectrum antibiotic for chest infections and atypical pneumonia, scrub typhus, leptospirosis, acne and some sexually transmitted infections. Swallow with a full glass of water while upright to avoid throat ulcers. Causes sun sensitivity; not for pregnant women or children under 8.',
  },
  {
    name: 'Ceftriaxone',
    form: 'injection',
    strength: '1 g vial',
    unit_price: 55,
    stock_qty: 31,
    drug_class: 'Third-generation cephalosporin antibiotic',
    description:
      'Powerful injectable antibiotic given in hospital for serious infections such as meningitis, severe pneumonia, complicated typhoid, kidney infection and sepsis. Given IV or IM once or twice daily. Avoid if severe penicillin or cephalosporin allergy; may cause diarrhoea.',
  },
  {
    name: 'Cefixime',
    form: 'tablet',
    strength: '200 mg',
    unit_price: 11,
    stock_qty: 560,
    drug_class: 'Oral third-generation cephalosporin',
    description:
      'Oral antibiotic commonly used for uncomplicated typhoid (enteric fever), urinary tract infections with burning urination, and some throat and ear infections. Complete the full course even after fever settles. May cause loose stools; avoid if allergic to cephalosporins.',
  },
  {
    name: 'Nitrofurantoin',
    form: 'capsule',
    strength: '100 mg (SR)',
    unit_price: 7,
    stock_qty: 290,
    drug_class: 'Urinary antibacterial',
    description:
      'Antibiotic specifically for bladder infections (cystitis) causing burning while passing urine, frequent urge to urinate and lower abdominal discomfort. Take with food; turns urine dark yellow-brown. Not effective for kidney infection and avoided when kidney function is poor.',
  },
  {
    name: 'Isoniazid + Rifampicin + Pyrazinamide + Ethambutol',
    form: 'tablet',
    strength: '75/150/400/275 mg',
    unit_price: 6,
    stock_qty: 350,
    drug_class: 'Anti-tubercular fixed-dose combination',
    description:
      'Four-drug fixed-dose combination for the intensive phase of tuberculosis treatment under the national TB programme, taken daily by body weight. Turns urine and tears orange-red. Report jaundice, vomiting or vision changes; it reduces the effect of contraceptive pills and warfarin.',
  },
  {
    name: 'Artemether + Lumefantrine',
    form: 'tablet',
    strength: '80/480 mg',
    unit_price: 30,
    stock_qty: 120,
    drug_class: 'Artemisinin-based combination antimalarial',
    description:
      'Artemisinin combination therapy for malaria with fever, chills and rigors, including falciparum malaria, given as six doses over three days. Take with fatty food or milk for absorption. Not for severe malaria, which needs injectable treatment in hospital.',
  },
  {
    name: 'Ivermectin',
    form: 'tablet',
    strength: '12 mg',
    unit_price: 25,
    stock_qty: 150,
    drug_class: 'Antiparasitic',
    description:
      'Antiparasitic tablet for scabies with intense night-time itching, head lice, strongyloides and other worm infestations; usually a single dose repeated after one or two weeks. Take on an empty stomach. Not for children under 15 kg or during pregnancy.',
  },

  // ---- Dermatology ----
  {
    name: 'Clotrimazole',
    form: 'ointment',
    strength: '1% w/w (15 g tube)',
    unit_price: 60,
    stock_qty: 240,
    drug_class: 'Topical azole antifungal',
    description:
      'Antifungal cream for ringworm (tinea), jock itch in the groin, athlete foot, fungal rashes under the breasts and candida skin infections. Apply twice daily and continue two weeks after the rash clears. Do not mix with steroid creams, which make fungal infections worse.',
  },
  {
    name: 'Mometasone',
    form: 'ointment',
    strength: '0.1% w/w (10 g tube)',
    unit_price: 140,
    stock_qty: 190,
    drug_class: 'Topical corticosteroid (moderate potency)',
    description:
      'Steroid cream that calms itchy, red, inflamed skin in eczema, contact dermatitis and psoriasis plaques. Apply a thin layer once daily for short courses. Prolonged use thins the skin; avoid on the face and on fungal infections or ringworm.',
  },
  {
    name: 'Methotrexate',
    form: 'tablet',
    strength: '7.5 mg',
    unit_price: 5,
    stock_qty: 160,
    drug_class: 'DMARD / antimetabolite',
    description:
      'Disease-modifying medicine taken ONCE A WEEK (never daily) for rheumatoid arthritis and severe psoriasis. Take folic acid alongside. Needs regular blood counts and liver tests; avoid alcohol and painkillers like diclofenac or ibuprofen without advice; strictly avoid in pregnancy.',
  },
  {
    name: 'Folic acid',
    form: 'tablet',
    strength: '5 mg',
    unit_price: 1,
    stock_qty: 850,
    drug_class: 'Vitamin B9 supplement',
    description:
      'Vitamin supplement for folate-deficiency and nutritional anaemia, in pregnancy planning, and to reduce mouth ulcers, nausea and liver side effects in patients on weekly methotrexate. Generally very safe; vitamin B12 deficiency should be excluded first in anaemia.',
  },
  {
    name: 'Cetirizine',
    form: 'tablet',
    strength: '10 mg',
    unit_price: 1.5,
    stock_qty: 870,
    drug_class: 'Second-generation antihistamine',
    description:
      'Anti-allergy tablet for sneezing, runny nose and itchy watery eyes in allergic rhinitis and colds, and for itchy skin rashes, hives and eczema itch. Taken once daily, preferably at night. Can cause drowsiness; avoid driving if sleepy and limit alcohol.',
  },

  // ---- Neurology and psychiatry ----
  {
    name: 'Sumatriptan',
    form: 'tablet',
    strength: '50 mg',
    unit_price: 45,
    stock_qty: 9,
    drug_class: 'Triptan (5-HT1B/1D agonist)',
    description:
      'Migraine attack reliever that stops a throbbing one-sided headache with nausea and light sensitivity when taken early in the attack. Not a preventer. Avoid in heart disease, uncontrolled blood pressure or stroke; caution with SSRIs such as sertraline (serotonin excess).',
  },
  {
    name: 'Amitriptyline',
    form: 'tablet',
    strength: '10 mg',
    unit_price: 2,
    stock_qty: 410,
    drug_class: 'Tricyclic antidepressant (low dose)',
    description:
      'Low-dose bedtime tablet for preventing chronic tension headaches and migraine, nerve pain, irritable bowel pain and poor sleep due to pain. Causes dry mouth, drowsiness, constipation and weight gain. Dangerous in overdose; avoid in recent heart attack or glaucoma.',
  },
  {
    name: 'Pregabalin',
    form: 'capsule',
    strength: '75 mg',
    unit_price: 14,
    stock_qty: 360,
    drug_class: 'Gabapentinoid (neuropathic pain agent)',
    description:
      'Nerve pain medicine for shooting leg pain in sciatica, diabetic burning feet, nerve compression and fibromyalgia. Causes dizziness, sleepiness and weight gain; start low and increase slowly. Can be habit forming; avoid alcohol and do not stop abruptly.',
  },
  {
    name: 'Tramadol',
    form: 'capsule',
    strength: '50 mg',
    unit_price: 6,
    stock_qty: 220,
    drug_class: 'Opioid analgesic',
    description:
      'Strong painkiller for moderate to severe pain such as acute back pain with sciatica, fracture or post-operative pain, when paracetamol is not enough. Causes nausea, dizziness and constipation; can be habit forming. Risk of seizures and serotonin syndrome with SSRI antidepressants.',
  },
  {
    name: 'Sertraline',
    form: 'tablet',
    strength: '50 mg',
    unit_price: 9,
    stock_qty: 400,
    drug_class: 'SSRI antidepressant',
    description:
      'Antidepressant (SSRI) for depression with persistent low mood and loss of interest, anxiety disorders, panic attacks and OCD. Takes 2 to 4 weeks to work. Early nausea, poor sleep and restlessness are common; never combine with tramadol and report any suicidal thoughts.',
  },
  {
    name: 'Clonazepam',
    form: 'tablet',
    strength: '0.5 mg',
    unit_price: 3.5,
    stock_qty: 190,
    drug_class: 'Benzodiazepine',
    description:
      'Calming sedative for short-term relief of severe anxiety, panic attacks and agitation, and in some seizure disorders. Habit forming; use only for a few weeks and taper slowly. Causes drowsiness and unsteadiness; never combine with alcohol, opioids like tramadol or other sleeping pills.',
  },
  {
    name: 'Zolpidem',
    form: 'tablet',
    strength: '5 mg',
    unit_price: 8,
    stock_qty: 150,
    drug_class: 'Non-benzodiazepine hypnotic',
    description:
      'Short-term sleeping tablet for insomnia, trouble falling asleep or staying asleep. Take just before bed when 7 to 8 hours of sleep are possible. Can cause next-morning drowsiness, sleepwalking and dependence; avoid alcohol, driving and combining with other sedatives.',
  },

  // ---- Analgesics and musculoskeletal ----
  {
    name: 'Paracetamol',
    form: 'tablet',
    strength: '650 mg',
    unit_price: 1.5,
    stock_qty: 900,
    drug_class: 'Analgesic and antipyretic',
    description:
      'Common fever reducer and mild painkiller for fever, headache, body ache, viral fever, dengue and joint pain; safest option for fever in dengue. Maximum 4 g per day in adults, less in liver disease or heavy alcohol use; overdose causes serious liver damage.',
  },
  {
    name: 'Ibuprofen',
    form: 'tablet',
    strength: '400 mg',
    unit_price: 1.2,
    stock_qty: 760,
    drug_class: 'NSAID',
    description:
      'Anti-inflammatory painkiller for headache, toothache, period pain, muscle sprains, arthritis pain, fever and pericarditis chest pain. Take after food. Can cause acidity, stomach ulcers and kidney strain; avoid in dengue, with blood thinners like warfarin and in uncontrolled blood pressure.',
  },
  {
    name: 'Diclofenac',
    form: 'tablet',
    strength: '50 mg',
    unit_price: 2,
    stock_qty: 680,
    drug_class: 'NSAID',
    description:
      'Strong anti-inflammatory painkiller for kidney stone colic, gallbladder pain, back pain, gout flares, arthritis and sprains. Take with food and for the shortest time. Risk of stomach bleeding, kidney injury and heart events; avoid in heart disease, with methotrexate or blood thinners.',
  },
  {
    name: 'Colchicine',
    form: 'tablet',
    strength: '0.5 mg',
    unit_price: 5,
    stock_qty: 140,
    drug_class: 'Anti-gout anti-inflammatory',
    description:
      'Anti-inflammatory for acute gout attacks with a hot, red, swollen big toe or joint, and for recurrent pericarditis. Start early in the flare at low dose. Diarrhoea is the first sign of toxicity; dangerous with clarithromycin and in kidney failure.',
  },

  // ---- Haematinic, fluids and miscellaneous ----
  {
    name: 'Ferrous sulfate',
    form: 'tablet',
    strength: '200 mg (65 mg elemental iron)',
    unit_price: 2,
    stock_qty: 820,
    drug_class: 'Oral iron supplement',
    description:
      'Iron tablet for iron-deficiency anaemia causing tiredness, weakness, breathlessness, pale skin and hair fall, common with heavy periods or pregnancy. Take with vitamin C or lemon water, away from tea and antacids. Turns stools black and may cause constipation.',
  },
  {
    name: 'Sodium chloride 0.9%',
    form: 'injection',
    strength: '500 ml IV bottle',
    unit_price: 32,
    stock_qty: 300,
    drug_class: 'Intravenous crystalloid fluid',
    description:
      'Normal saline drip given intravenously to correct dehydration, low blood pressure and fluid loss from severe vomiting, diarrhoea, dengue with warning signs, diabetic ketoacidosis and pancreatitis. Monitor for fluid overload, breathlessness and swelling in heart or kidney failure.',
  },
  {
    name: 'Sildenafil',
    form: 'tablet',
    strength: '50 mg',
    unit_price: 30,
    stock_qty: 70,
    drug_class: 'PDE-5 inhibitor',
    description:
      'Used for erectile dysfunction and, at lower doses, for pulmonary arterial hypertension. Take about an hour before activity. Causes headache, flushing and nasal stuffiness. Absolutely never take with nitrates such as isosorbide mononitrate or nitroglycerin, as blood pressure can fall dangerously.',
  },
  {
    name: 'Potassium chloride',
    form: 'syrup',
    strength: '1.5 g/15 ml (200 ml bottle)',
    unit_price: 95,
    stock_qty: 45,
    drug_class: 'Potassium supplement',
    description:
      'Oral potassium supplement to correct low potassium (hypokalaemia) caused by diuretics, vomiting, diarrhoea or insulin treatment, which can cause muscle weakness, cramps and irregular heartbeat. Dilute in water and take after food. Dangerous with spironolactone or kidney failure (high potassium).',
  },
];
