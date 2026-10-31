import type { ConditionSeed } from './types';

export const conditions: ConditionSeed[] = [
  // ---------------- Gastrointestinal and chest pain mimics ----------------
  {
    name: 'Gastroesophageal reflux disease (GERD)',
    description:
      'Burning feeling in the chest (heartburn) or upper abdomen after eating, especially after heavy, spicy or oily meals, with sour or bitter fluid coming up into the mouth (regurgitation). Symptoms worsen when lying down after dinner or bending forward and may cause night-time cough, hoarseness, belching and a lump-in-the-throat sensation. Common in adults with obesity, smoking, excess tea or coffee, late meals and pregnancy. Retrosternal burning chest pain after meals can mimic angina. Management: lifestyle changes (smaller early dinners, raising the head end of the bed, weight loss) with a proton pump inhibitor such as pantoprazole for 4 to 8 weeks.',
    red_flags:
      'Difficulty or pain swallowing, food sticking, vomiting blood or black stools, unintended weight loss, anaemia, new onset after age 50, or exertional chest pain with sweating that may be cardiac.',
  },
  {
    name: 'Peptic ulcer disease',
    description:
      'Gnawing or burning pain in the upper abdomen or lower chest, coming on after meals with a gastric ulcer, or on an empty stomach and at night with a duodenal ulcer, often relieved by food or antacids. Associated with bloating, nausea, early fullness and loss of appetite. The main causes are Helicobacter pylori infection and painkiller (NSAID) or aspirin use; smoking and alcohol add risk. Diagnosed by upper GI endoscopy or H. pylori testing. Treatment is a proton pump inhibitor with H. pylori eradication therapy (amoxicillin plus clarithromycin) and stopping NSAIDs.',
    red_flags:
      'Vomiting blood or coffee-ground material, black tarry stools, fainting, sudden severe abdominal pain with a rigid board-like abdomen suggesting perforation, persistent vomiting, or weight loss.',
  },
  {
    name: 'Gastritis',
    description:
      'Inflammation of the stomach lining causing upper abdominal burning, gnawing discomfort or fullness after meals, nausea, occasional vomiting, belching and loss of appetite. Often triggered by painkillers such as ibuprofen or diclofenac, alcohol binges, spicy food, irregular meals, stress, steroid use or H. pylori infection. Pain is usually mild to moderate and epigastric, may be worse when fasting, and the abdomen is tender without guarding. Management: avoid the trigger, take small regular bland meals, and use a proton pump inhibitor such as pantoprazole with an antiemetic for 2 to 4 weeks.',
    red_flags:
      'Vomiting blood, black stools, severe or persistent pain, signs of dehydration, dizziness or fainting, weight loss, or symptoms continuing despite four weeks of treatment.',
  },
  {
    name: 'Cholelithiasis with biliary colic',
    description:
      'Gallstones causing attacks of severe, steady, cramping pain in the upper right abdomen or lower chest after meals, typically starting 30 to 60 minutes after a fatty, fried or heavy meal and lasting from 30 minutes to several hours. Pain often spreads to the right shoulder blade or back, with nausea and vomiting. Classically affects overweight women over 40, after pregnancy or rapid weight loss. Abdominal ultrasound shows stones in the gallbladder. Treatment is pain relief with diclofenac and antispasmodics, a low-fat diet, and elective laparoscopic cholecystectomy.',
    red_flags:
      'Fever with chills, yellow eyes or skin (jaundice), dark urine, pain lasting more than 6 hours, persistent vomiting, or severe pain boring into the back suggesting pancreatitis.',
  },
  {
    name: 'Acute pancreatitis',
    description:
      'Sudden severe, constant pain in the upper abdomen that bores through to the back, often after heavy alcohol intake or a large fatty meal, or caused by gallstones. Pain eases slightly on leaning forward and comes with repeated vomiting, abdominal distension, fever and a fast pulse. Serum lipase or amylase is raised more than three times normal; triglycerides and calcium should be checked. Management is hospital admission with aggressive intravenous fluids, pain control, antiemetics, early oral feeding as tolerated, and treating the cause such as gallstone removal or stopping alcohol.',
    red_flags:
      'Low blood pressure, rapid breathing or low oxygen, reduced urine output, confusion, bluish flank discolouration, rising creatinine, or organ failure persisting beyond 48 hours.',
  },
  {
    name: 'Esophageal spasm',
    description:
      'Uncoordinated contractions of the food pipe causing sudden squeezing chest pain behind the breastbone, often while eating or drinking very hot or cold liquids, together with difficulty swallowing both solids and liquids and a feeling of food sticking. The pain can closely mimic a heart attack or angina and may even be relieved by nitrates. Associated with acid reflux, stress and anxiety in middle-aged adults. Diagnosis is by barium swallow or oesophageal manometry after cardiac causes are excluded. Treatment: acid suppression, avoiding temperature extremes, calcium channel blockers or low-dose antidepressants.',
    red_flags:
      'Progressive difficulty swallowing, weight loss, vomiting blood, a food bolus stuck with inability to swallow saliva, or chest pain with sweating or on exertion needing cardiac work-up.',
  },
  {
    name: 'Hiatal hernia',
    description:
      'Part of the stomach slides up through the diaphragm into the chest, weakening the barrier against acid and causing heartburn, burning chest pain after big meals, belching, sour regurgitation, a feeling of fullness behind the breastbone and night-time reflux when lying flat. Common in older adults, obese people and after pregnancy; large hernias can cause breathlessness after eating or difficulty swallowing. Detected on endoscopy or barium study. Management: small frequent meals, weight loss, not lying down after eating, raising the bed head and proton pump inhibitors, with surgery for large or complicated hernias.',
    red_flags:
      'Severe chest or upper abdominal pain with retching but inability to vomit, vomiting blood, black stools, difficulty swallowing, or breathlessness suggesting strangulation or volvulus.',
  },
  {
    name: 'Functional dyspepsia',
    description:
      'Recurrent upper abdominal discomfort, burning, bloating, early fullness after a few bites and uncomfortable heaviness after meals, without any ulcer or structural cause on endoscopy. Symptoms often fluctuate with stress, irregular meal timings, oily food and anxiety, and are common in young and middle-aged adults. Belching and nausea occur, but weight is maintained and blood tests are normal. Management: reassurance, regular small meals, test-and-treat for H. pylori, a trial of a proton pump inhibitor, prokinetics, and low-dose amitriptyline for persistent symptoms.',
    red_flags:
      'Age over 55 with new symptoms, weight loss, persistent vomiting, difficulty swallowing, anaemia, black stools, or a palpable abdominal mass.',
  },
  {
    name: 'Irritable bowel syndrome',
    description:
      'Long-standing crampy lower abdominal pain linked to bowel movements, with bloating, gas, a feeling of incomplete emptying, mucus in stools, and alternating loose motions and constipation. Pain often eases after passing stool and flares with stress, anxiety, spicy food, milk or irregular meals. Most common in young adults and women; examination and blood tests are normal. Management: reassurance, regular meals, adequate water and soluble fibre, reducing trigger foods, antispasmodics such as drotaverine for cramps and low-dose amitriptyline for persistent pain.',
    red_flags:
      'Blood in stools, weight loss, night-time diarrhoea that wakes the patient, anaemia, fever, onset after age 50, or family history of bowel cancer or inflammatory bowel disease.',
  },
  {
    name: 'Acute gastroenteritis',
    description:
      'Sudden onset of loose watery stools, vomiting, abdominal cramps and sometimes fever, usually after contaminated food or water, street food or a family outbreak; viral and bacterial causes are both common during the monsoon. Patients may feel weak, thirsty and dizzy with a dry mouth and reduced urine. Most cases settle within 3 to 5 days. Treatment centres on oral rehydration salts in small frequent sips, continued light feeding, antiemetics such as ondansetron and paracetamol for fever; antibiotics only for bloody diarrhoea or suspected cholera.',
    red_flags:
      'Signs of severe dehydration (sunken eyes, no urine for 8 hours, drowsiness, low BP), blood in stools, high fever, persistent vomiting preventing fluids, or illness in infants and the elderly.',
  },
  {
    name: 'Acute viral hepatitis',
    description:
      'Liver inflammation, usually from hepatitis A or E spread through contaminated water and food, causing loss of appetite, nausea, vomiting, aversion to food, low-grade fever, fatigue and a dull ache under the right ribs, followed by yellow eyes and skin (jaundice), dark tea-coloured urine and pale stools. Common during monsoon outbreaks. Liver enzymes (ALT, AST) are markedly raised with high bilirubin. Most cases recover within 4 to 8 weeks. Management: rest, adequate fluids and calories, avoiding alcohol and unnecessary medicines, and monitoring liver function.',
    red_flags:
      'Confusion, drowsiness or behaviour change, bleeding tendency or prolonged INR, persistent vomiting, rapidly deepening jaundice, or hepatitis E in pregnancy with risk of acute liver failure.',
  },

  // ---------------- Cardiovascular ----------------
  {
    name: 'Stable angina',
    description:
      'Chest pain, tightness, heaviness or pressure behind the breastbone that comes on with exertion such as climbing stairs, brisk walking, emotional stress, cold weather or walking after a heavy meal, and settles within 5 to 10 minutes of rest or a nitrate. Pain may spread to the left arm, jaw or back, with breathlessness. Caused by narrowed coronary arteries; risk factors are diabetes, hypertension, smoking, high cholesterol and family history, and it is common in Indian men over 45. ECG, treadmill test and echo guide evaluation. Treatment: aspirin, statin, beta blocker and nitrates, with risk-factor control.',
    red_flags:
      'Chest pain at rest or lasting over 15 minutes, pain with sweating, vomiting or fainting, new or rapidly worsening angina (unstable angina), or breathlessness at rest.',
  },
  {
    name: 'Acute myocardial infarction',
    description:
      'Heart attack: sudden crushing, squeezing or heavy pain in the centre of the chest, spreading to the left arm, shoulder, jaw or back, lasting more than 20 minutes and not relieved by rest, with profuse cold sweating, breathlessness, nausea, vomiting, light-headedness and a feeling of impending doom. Elderly people, women and diabetics may have only breathlessness, upper abdominal discomfort or sweating. Caused by a clot blocking a coronary artery. ECG shows ST elevation or new changes and troponin rises. Emergency care: chewed aspirin, clopidogrel, a high-dose statin, anticoagulation and urgent angioplasty or thrombolysis.',
    red_flags:
      'Ongoing chest pain, low blood pressure, cold clammy skin, irregular or very slow pulse, fainting, breathlessness with frothy sputum, or confusion: activate the emergency cath-lab pathway immediately.',
  },
  {
    name: 'Acute pericarditis',
    description:
      'Inflammation of the sac around the heart causing sharp, stabbing central chest pain that worsens on lying flat, deep breathing or coughing and improves on sitting up and leaning forward. It often follows a viral fever or cold in young adults; tuberculosis is an important cause in India. A pericardial friction rub may be heard and ECG shows widespread ST elevation with PR depression. Low-grade fever and a raised CRP are common. Treatment is high-dose ibuprofen or aspirin with colchicine for three months, gastric protection and restricted exertion.',
    red_flags:
      'Low blood pressure, distended neck veins, muffled heart sounds or fainting (cardiac tamponade), high fever, raised troponin, or no response to anti-inflammatory therapy within one week.',
  },
  {
    name: 'Costochondritis',
    description:
      'Inflammation of the cartilage joining the ribs to the breastbone, causing sharp or aching chest wall pain beside the breastbone that is reproduced by pressing on the rib joints and worsens with twisting, deep breathing, coughing or lifting. Common after a viral cough, heavy gym exercise, carrying loads or minor injury, in young and middle-aged adults. Vital signs, ECG and oxygen levels are normal. It is benign and settles over a few weeks. Management: reassurance, avoiding strain, local heat and simple painkillers such as paracetamol or a short NSAID course.',
    red_flags:
      'Chest pain on exertion or with sweating, breathlessness, an abnormal ECG, fever with swelling or redness over the joint, or known heart disease requiring cardiac evaluation.',
  },
  {
    name: 'Essential hypertension',
    description:
      'Persistently raised blood pressure of 140/90 mmHg or more without a secondary cause, usually silent but sometimes causing morning headache at the back of the head, dizziness, heaviness in the head, palpitations or nosebleeds. Risk rises with age, family history, salty diet and pickles, obesity, stress, alcohol and inactivity, and it is a major cause of heart attack, stroke and kidney damage. Diagnosed on repeated clinic or home readings. Management: salt restriction, weight loss, exercise and medicines such as amlodipine or an ACE inhibitor, targeting below 130/80 in most adults.',
    red_flags:
      'BP above 180/120 with chest pain, breathlessness, severe headache, confusion, blurred vision, weakness on one side or reduced urine output (hypertensive emergency).',
  },
  {
    name: 'Heart failure',
    description:
      'The heart cannot pump enough blood, causing breathlessness on exertion that progresses to breathlessness on lying flat, waking at night gasping for air, needing extra pillows, night-time cough or wheeze, swollen feet and ankles, rapid weight gain from fluid, fatigue and reduced exercise capacity. Common after heart attacks, long-standing hypertension, valve disease or diabetes. Examination shows raised neck veins, basal crackles and pitting oedema; BNP is raised and echo shows reduced ejection fraction. Treatment: diuretics such as furosemide, an ACE inhibitor, beta blocker and spironolactone, with salt and fluid restriction.',
    red_flags:
      'Breathlessness at rest, frothy pink sputum, SpO2 below 90%, chest pain, fainting, low blood pressure, very low urine output, or weight gain over 2 kg in 3 days.',
  },
  {
    name: 'Atrial fibrillation',
    description:
      'Irregular, often fast heart rhythm causing a fluttering or pounding sensation in the chest (palpitations), breathlessness, tiredness, dizziness and reduced exercise tolerance; some people notice nothing. The pulse is irregularly irregular and the ECG shows absent P waves. Common in the elderly and with hypertension, heart failure, rheumatic valve disease, an overactive thyroid and alcohol. It increases stroke risk about five-fold because clots form in the heart. Management: rate control with metoprolol, anticoagulation with apixaban or warfarin according to stroke risk score, and treating the underlying cause.',
    red_flags:
      'Heart rate over 150, chest pain, fainting, low blood pressure, breathlessness at rest, or sudden facial droop, slurred speech or limb weakness suggesting a stroke.',
  },
  {
    name: 'Pulmonary embolism',
    description:
      'A blood clot travelling to the lungs, causing sudden breathlessness, sharp chest pain that worsens on deep breathing, a fast heart rate, cough sometimes with blood, and light-headedness or fainting. It often follows a deep vein thrombosis with a swollen, painful calf. Risk factors include recent surgery, long journeys or bed rest, fractures, cancer, pregnancy, oral contraceptive use and previous clots. Oxygen saturation drops, D-dimer is raised and CT pulmonary angiography confirms the diagnosis. Treatment: anticoagulation with enoxaparin followed by apixaban, and thrombolysis if the patient is unstable.',
    red_flags:
      'Low blood pressure, fainting, severe hypoxia, heart rate over 120, signs of right heart strain on ECG or echo, or coughing up significant blood.',
  },

  // ---------------- Infections and fevers ----------------
  {
    name: 'Typhoid fever',
    description:
      'Enteric fever caused by Salmonella Typhi spread through contaminated food and water, common in India. Fever rises step-wise over a week to 102-104 F with headache, malaise, loss of appetite, abdominal pain, constipation or diarrhoea, and a coated tongue. The pulse may be relatively slow for the fever and the liver or spleen may be enlarged; rose spots are rare. Blood culture confirms it, while the Widal test is less reliable. Treatment: oral cefixime or azithromycin for uncomplicated cases, intravenous ceftriaxone if severe, with fluids and paracetamol.',
    red_flags:
      'Severe abdominal pain or distension suggesting perforation, black stools or bleeding, confusion or drowsiness, high fever persisting beyond 5 days of antibiotics, or low blood pressure.',
  },
  {
    name: 'Dengue fever',
    description:
      'Mosquito-borne viral fever spread by Aedes mosquitoes, peaking during and after the monsoon. Sudden high fever with severe headache, pain behind the eyes, joint pain, muscle and bone pain (break-bone fever) and a red skin rash, with nausea and loss of appetite; a pin-point rash may appear as the fever settles. Platelet count and white cells fall and haematocrit may rise. The critical phase is days 3 to 7 when the fever drops. Management: paracetamol only (no aspirin or ibuprofen), plenty of oral fluids or ORS, daily platelet and haematocrit monitoring, and admission for warning signs.',
    red_flags:
      'Severe abdominal pain, persistent vomiting, bleeding gums or nose, black stools, restlessness or lethargy, cold hands and feet, low urine output, or rising haematocrit with falling platelets.',
  },
  {
    name: 'Chikungunya fever',
    description:
      'Viral fever transmitted by Aedes mosquitoes causing abrupt high fever with severe, often disabling joint pain and swelling in the hands, wrists, ankles and feet, making patients walk bent over. A red itchy rash on the trunk and limbs, headache, muscle aches and fatigue are common. Joint pain and stiffness may persist for weeks to months, especially in older adults. Platelets are usually normal. Management: rest, fluids, paracetamol during the acute phase (NSAIDs only after dengue is ruled out) and physiotherapy for persistent arthritis.',
    red_flags:
      'Bleeding, severe abdominal pain or persistent vomiting suggesting dengue co-infection, confusion or seizures, breathlessness, or illness in newborns, pregnant women and the frail elderly.',
  },
  {
    name: 'Malaria',
    description:
      'Mosquito-borne parasitic infection with episodes of high fever preceded by shaking chills and rigors and followed by profuse sweating, often recurring every one to three days. Headache, body ache, vomiting, fatigue and, later, anaemia and an enlarged spleen occur. Plasmodium vivax and falciparum are both seen in India, especially after travel to endemic districts during the monsoon. Diagnosis is by peripheral blood smear or rapid antigen test. Treatment: artemisinin combination therapy for falciparum, chloroquine plus primaquine for vivax, and paracetamol for fever.',
    red_flags:
      'Confusion, seizures or drowsiness, jaundice, dark cola-coloured urine, breathlessness, very low urine output, severe anaemia, low blood sugar, or inability to keep medicines down (severe malaria).',
  },
  {
    name: 'Pulmonary tuberculosis',
    description:
      'Chronic bacterial lung infection with cough lasting more than two weeks, often with sputum or blood-streaked sputum, evening low-grade fever, drenching night sweats, loss of appetite and gradual weight loss. Chest pain and breathlessness occur in advanced disease. More common with malnutrition, diabetes, HIV, smoking, crowded living conditions or contact with a TB patient. Diagnosed by sputum CBNAAT (GeneXpert) and a chest X-ray showing upper lobe infiltrates or cavities. Treatment under the national programme is six months of isoniazid, rifampicin, pyrazinamide and ethambutol with observed adherence.',
    red_flags:
      'Coughing large amounts of blood, severe breathlessness, low oxygen, confusion or neck stiffness suggesting TB meningitis, jaundice on treatment, or suspected drug resistance.',
  },
  {
    name: 'Community-acquired pneumonia',
    description:
      'Lung infection acquired outside hospital, causing fever with chills, productive cough with yellow, green or rusty sputum, breathlessness and sharp chest pain on deep breathing. Older adults may present only with confusion or a fall. Examination shows fast breathing, crackles and bronchial breath sounds over the affected area, with reduced oxygen saturation. Chest X-ray shows consolidation, and white cell count and CRP are raised. Common after influenza and in smokers, diabetics and the elderly. Treatment: oral amoxicillin with azithromycin or doxycycline, or IV ceftriaxone if moderate or severe.',
    red_flags:
      'Confusion, respiratory rate over 30, SpO2 below 92%, systolic BP under 90, age over 65 with comorbidities, or involvement of multiple lobes (high CURB-65 score).',
  },
  {
    name: 'Bacterial meningitis',
    description:
      'Serious infection of the membranes around the brain and spinal cord. The typical picture is high fever with a severe headache and a stiff, painful neck that resists bending forward, plus vomiting, intolerance to light and progressive drowsiness or confusion; seizures and a purplish non-blanching rash may occur. Infants show irritability, poor feeding and a bulging fontanelle. Kernig and Brudzinski signs may be positive. Lumbar puncture shows turbid CSF with high neutrophils, high protein and low glucose. This is a medical emergency: give intravenous ceftriaxone and dexamethasone immediately after blood cultures, without waiting for imaging.',
    red_flags:
      'Altered consciousness, seizures, a spreading purpuric rash, low blood pressure, focal weakness, or rapid deterioration: start antibiotics without delay and admit to ICU.',
  },
  {
    name: 'Urinary tract infection',
    description:
      'Bacterial infection of the bladder causing burning or pain while passing urine, a frequent urge to urinate passing only small amounts, lower abdominal discomfort, cloudy or foul-smelling urine and sometimes blood in the urine. Much more common in women, during pregnancy, in diabetics and with low water intake or holding urine. Urine dipstick shows leucocytes and nitrites and microscopy shows pus cells. Upper tract infection causes fever, chills, vomiting and flank pain. Treatment: increased fluids and nitrofurantoin for 5 days for cystitis, or cefixime guided by urine culture.',
    red_flags:
      'Fever with chills, flank or back pain, vomiting, confusion in the elderly, pregnancy, a male patient or catheter, or low blood pressure suggesting pyelonephritis or urosepsis.',
  },
  {
    name: 'Cellulitis',
    description:
      'Spreading bacterial infection of the deeper skin causing a hot, red, swollen, tender area, usually on the lower leg, with poorly defined edges that expand over a day or two, often with fever, chills and tender swollen lymph nodes. Bacteria enter through cracks between the toes, fungal infection, insect bites, cuts or wounds. Common in diabetics, the obese and people with leg swelling or poor circulation. Management: elevate the limb, mark the border, give oral antibiotics such as amoxicillin-clavulanate or cephalexin, treat toe-web fungal infection, and use IV ceftriaxone if severe.',
    red_flags:
      'Rapidly spreading redness, severe pain out of proportion, blisters, blackened skin, crackling under the skin, low blood pressure, confusion, or high fever suggesting necrotising infection or sepsis.',
  },

  // ---------------- Respiratory ----------------
  {
    name: 'Bronchial asthma',
    description:
      'Chronic airway inflammation with recurrent episodes of wheezing, chest tightness, breathlessness and dry cough, typically worse at night or early morning. Attacks are triggered by dust, pollen, cold air, smoke, viral colds, exercise and strong smells. It often begins in childhood with a personal or family history of allergy or eczema. During an attack there is wheeze, prolonged expiration and reduced peak flow that reverses after a bronchodilator. Management: inhaled reliever and preventer therapy, montelukast, trigger avoidance and short oral prednisolone courses for flare-ups.',
    red_flags:
      'Unable to complete sentences, SpO2 below 92%, a silent chest, drowsiness or confusion, bluish lips, peak flow below 50% of best, or no relief from repeated reliever doses.',
  },
  {
    name: 'Chronic obstructive pulmonary disease (COPD) exacerbation',
    description:
      'Sudden worsening of breathlessness, cough and sputum volume or purulence in a person with COPD, usually a long-term smoker or someone exposed to biomass cooking smoke for years. Triggered by chest infections, air pollution or stopping inhalers. Patients have wheeze, use their neck muscles to breathe, purse their lips and may have low oxygen levels and ankle swelling. Spirometry shows fixed airflow obstruction. Management: increased bronchodilators by nebuliser, a 5-day course of oral prednisolone, antibiotics such as azithromycin or doxycycline for purulent sputum, and controlled oxygen.',
    red_flags:
      'Drowsiness or confusion from carbon dioxide retention, SpO2 below 88% despite oxygen, bluish lips, breathing rate over 30, chest pain, or a new irregular heartbeat.',
  },
  {
    name: 'Allergic rhinitis',
    description:
      'Recurrent bouts of sneezing, a runny watery nose, blocked nose and itchy nose, eyes and palate, worse in the morning and on exposure to dust, pollen, pets, cold air or strong smells. Many patients have dark circles under the eyes, mouth breathing, post-nasal drip with throat clearing, and associated asthma or eczema. It may be seasonal or year-round. The nasal lining appears pale and swollen. Management: allergen avoidance, saline rinses, intranasal steroid sprays, non-sedating antihistamines such as cetirizine, and montelukast when asthma coexists.',
    red_flags:
      'One-sided blocked nose with bleeding, facial swelling or pain with fever, loss of smell with nasal polyps, or wheezing and breathlessness suggesting uncontrolled asthma.',
  },
  {
    name: 'Acute sinusitis',
    description:
      'Inflammation of the sinuses, usually after a cold, causing a blocked nose, thick yellow-green nasal discharge, facial pain and pressure over the cheeks or forehead that worsens on bending forward, upper toothache, reduced smell, post-nasal drip and mild fever. Bacterial infection is likely when symptoms last more than 10 days or worsen after initial improvement. Tenderness over the sinuses may be found on examination. Management: steam inhalation, saline nasal rinses, decongestant drops for a few days, paracetamol, and amoxicillin or amoxicillin-clavulanate when bacterial sinusitis is suspected.',
    red_flags:
      'Swelling or redness around the eye, double or reduced vision, severe headache with neck stiffness, confusion, or swelling of the forehead.',
  },
  {
    name: 'Acute otitis media',
    description:
      'Middle ear infection, very common in young children after a cold, causing ear pain, tugging or rubbing at the ear, fever, irritability, crying at night, poor feeding and reduced hearing. The eardrum appears red and bulging on otoscopy, and if it perforates the pain eases with a discharge of pus. Risk factors include bottle feeding while lying down, passive smoking and day care. Management: pain relief with paracetamol or ibuprofen, and amoxicillin for 5 to 7 days in young children, bilateral disease or ear discharge.',
    red_flags:
      'Swelling, redness or tenderness behind the ear pushing it forward (mastoiditis), facial weakness, severe headache, neck stiffness, drowsiness, or ear discharge persisting beyond two weeks.',
  },
  {
    name: 'Acute tonsillitis and pharyngitis',
    description:
      'Infection of the throat and tonsils causing sore throat, pain on swallowing, fever, swollen red tonsils sometimes with white patches or pus, tender swollen neck glands, bad breath and a muffled voice. Viral infections are most common and come with cough and runny nose; streptococcal infection is likely with high fever, pus on the tonsils, tender nodes and no cough, especially in children aged 5 to 15. Management: warm saline gargles, fluids, paracetamol, and amoxicillin for 10 days when bacterial infection is suspected.',
    red_flags:
      'Drooling or inability to swallow saliva, difficulty opening the mouth, one-sided swelling pushing the uvula (peritonsillar abscess), noisy breathing, or dark urine and puffiness after a sore throat.',
  },
  {
    name: 'Viral upper respiratory infection (common cold)',
    description:
      'Common cold caused by viruses, with runny or blocked nose, sneezing, scratchy sore throat, mild dry cough, low-grade fever, headache, body ache and watery eyes, lasting 5 to 10 days. Spreads through droplets and contact, especially in schools, offices and during seasonal changes. Chest examination is clear and oxygen levels are normal, and antibiotics do not help. Management: rest, warm fluids, steam inhalation, salt-water gargles, paracetamol for fever and aches, and an antihistamine such as cetirizine for runny nose and sneezing.',
    red_flags:
      'Breathlessness or fast breathing, high fever beyond 3 days, chest pain, ear pain with discharge, severe sinus pain, drowsiness, or symptoms worsening after initial improvement.',
  },

  // ---------------- Endocrine and metabolic ----------------
  {
    name: 'Type 2 diabetes mellitus',
    description:
      'Chronic high blood sugar due to insulin resistance, very common in Indian adults with central obesity, family history and a sedentary lifestyle. Symptoms include excessive thirst, frequent urination including at night, increased hunger, tiredness, blurred vision, slow-healing wounds, recurrent skin or urinary infections, and tingling or burning feet; many people have no symptoms. Diagnosed by fasting glucose of 126 mg/dL or more, or HbA1c of 6.5% or higher. Management: diet, exercise and weight loss with metformin, adding other agents or insulin as needed, plus BP, cholesterol and foot care.',
    red_flags:
      'Blood sugar persistently above 300, vomiting, abdominal pain, deep rapid breathing, drowsiness, severe dehydration, a foot ulcer with spreading infection, or recurrent hypoglycaemia.',
  },
  {
    name: 'Diabetic ketoacidosis',
    description:
      'Life-threatening emergency from severe insulin deficiency, seen in type 1 diabetes or in type 2 during infection, missed insulin or at first diagnosis. Over one to three days the patient develops extreme thirst, passes large amounts of urine, vomits, has abdominal pain and weakness, and breathes deeply and rapidly with a fruity acetone smell, progressing to drowsiness. Blood glucose is usually above 250 mg/dL with ketones in urine or blood and metabolic acidosis on blood gas. Management: admission, intravenous normal saline, an insulin infusion, potassium replacement and treating the trigger.',
    red_flags:
      'Reduced consciousness, pH below 7.0, potassium below 3.3 or above 6, low blood pressure, very low urine output, or chest pain: needs ICU care.',
  },
  {
    name: 'Hypothyroidism',
    description:
      'Underactive thyroid causing tiredness, sluggishness, weight gain, feeling cold when others are comfortable, dry skin, hair fall, constipation, a puffy face, hoarse voice, slow thinking, low mood and heavy or irregular periods. Much more common in women, after childbirth, with a family history and in Hashimoto thyroiditis. The pulse may be slow and reflexes delayed; a goitre may be present. Blood tests show raised TSH with low free T4. Treatment is daily levothyroxine on an empty stomach, adjusted every 6 to 8 weeks according to TSH.',
    red_flags:
      'Severe drowsiness or confusion, very low body temperature, pulse below 50, breathlessness from fluid around the heart, or pregnancy with uncontrolled thyroid levels.',
  },
  {
    name: 'Hyperthyroidism',
    description:
      'Overactive thyroid, most often Graves disease, causing palpitations, a fast or irregular heartbeat, weight loss despite a good appetite, heat intolerance, excessive sweating, hand tremor, anxiety, irritability, poor sleep, frequent loose stools and lighter periods. Prominent staring eyes and a smooth neck swelling (goitre) may be seen. Most common in young and middle-aged women. Blood tests show suppressed TSH with high free T4 or T3. Treatment: carbimazole to reduce hormone production and propranolol for tremor and palpitations, with radioiodine or surgery for relapse.',
    red_flags:
      'High fever with confusion, agitation, very fast heart rate or atrial fibrillation (thyroid storm), sore throat or fever while on carbimazole, or eye pain with vision loss.',
  },
  {
    name: 'Iron-deficiency anemia',
    description:
      'Low haemoglobin due to lack of iron, very common in Indian women and children. Causes tiredness, weakness, breathlessness and palpitations on exertion, dizziness, headaches, pale skin and inner eyelids, brittle spoon-shaped nails, hair fall, cold hands, poor concentration and cravings to eat ice or mud. Causes include heavy periods, pregnancy, poor diet, hookworm and chronic blood loss from the gut. Blood tests show low haemoglobin, small red cells (low MCV) and low ferritin. Treatment: oral iron with vitamin C, deworming, diet advice and treating the source of bleeding.',
    red_flags:
      'Haemoglobin below 7 g/dL, chest pain or breathlessness at rest, black stools or rectal bleeding, weight loss, age over 50 with unexplained anaemia, or pregnancy near term.',
  },

  // ---------------- Neurology ----------------
  {
    name: 'Migraine',
    description:
      'Recurrent moderate to severe throbbing headache, usually on one side, lasting 4 to 72 hours, with nausea or vomiting and sensitivity to light and sound so the person prefers a dark quiet room. Some people get an aura of zigzag flashing lights or tingling before the pain. Triggers include skipped meals, poor sleep, stress, bright sunlight, periods and certain foods. Much more common in young women and often runs in families. Treatment: early paracetamol or ibuprofen with an antiemetic, sumatriptan for severe attacks, and propranolol or amitriptyline to prevent frequent attacks.',
    red_flags:
      'Sudden thunderclap headache, headache with fever and neck stiffness, new headache after age 50, weakness, slurred speech or confusion, or a change from the usual migraine pattern.',
  },
  {
    name: 'Tension-type headache',
    description:
      'Dull, pressing or band-like tightness around the forehead, temples or back of the head, usually on both sides, often building through the day and associated with tight, tender scalp, jaw and shoulder muscles. There is no vomiting and the person can usually continue working. Triggered by stress, long hours on screens, poor posture, lack of sleep, eye strain and skipped meals. Very common in office workers and students. Management: stress reduction, posture correction, regular sleep and hydration, paracetamol or ibuprofen for episodes, and low-dose amitriptyline for chronic daily headache.',
    red_flags:
      'Headache with fever and neck stiffness, sudden severe onset, progressively worsening headache with vomiting, visual loss, weakness or numbness, or headache that wakes the patient from sleep.',
  },
  {
    name: 'Ischemic stroke',
    description:
      'Sudden weakness or numbness on one side of the body (face, arm or leg) due to loss of blood supply to part of the brain, with facial droop, slurred or lost speech, difficulty understanding, loss of vision in one eye, imbalance or sudden confusion. Remember BE-FAST: balance, eyes, face, arm, speech, time. Risk factors include hypertension, diabetes, atrial fibrillation, smoking and high cholesterol, mainly in older adults. Urgent CT or MRI excludes bleeding. Management: thrombolysis within 4.5 hours of onset where eligible, then aspirin, statin, BP control and rehabilitation.',
    red_flags:
      'Any sudden one-sided weakness, facial droop or speech difficulty: note the time of onset and alert the stroke team immediately. Worsening drowsiness, vomiting or seizures are ominous.',
  },
  {
    name: 'Epilepsy (seizure disorder)',
    description:
      'Tendency to recurrent unprovoked seizures. Generalised fits cause sudden loss of consciousness, stiffening then rhythmic jerking of all limbs, tongue biting, frothing, urinary incontinence and confusion or sleepiness afterwards. Focal seizures may cause staring spells, lip smacking, fumbling or jerking of one limb. Triggers include missed medicines, sleep deprivation, alcohol, fever and flashing lights. Common causes in India include neurocysticercosis, head injury and stroke. EEG and MRI help diagnosis. Treatment: levetiracetam or valproate, safety advice, and no driving until seizure-free.',
    red_flags:
      'A seizure lasting over 5 minutes or repeated seizures without regaining consciousness (status epilepticus), a first seizure, injury, fever with neck stiffness, or seizure in pregnancy.',
  },
  {
    name: 'Benign paroxysmal positional vertigo (BPPV)',
    description:
      'Brief spinning sensation (vertigo) lasting less than a minute, triggered by changing head position such as turning over in bed, lying down, getting up or looking upward, often with nausea. Caused by loose calcium crystals in the inner ear canals; common in older adults, women and after head injury or a viral ear infection. Hearing is normal and there is no weakness. The Dix-Hallpike test reproduces the vertigo with characteristic nystagmus. Treatment is a canalith repositioning (Epley) manoeuvre, home exercises and short-term antiemetics for nausea.',
    red_flags:
      'Continuous vertigo with inability to walk, double vision, slurred speech, facial numbness or limb weakness, sudden hearing loss, or a severe new headache suggesting a stroke.',
  },

  // ---------------- Psychiatry ----------------
  {
    name: 'Major depressive disorder',
    description:
      'Persistent low or sad mood for at least two weeks with loss of interest or pleasure in activities once enjoyed, together with poor sleep or oversleeping, early morning waking, low energy, poor appetite or weight change, poor concentration, feelings of worthlessness or guilt, slowed thinking, withdrawal from family and friends, and sometimes thoughts of death. It often presents with body aches, fatigue or headaches. Triggered by stress, loss, chronic illness or the postpartum period. Treatment: psychotherapy and an SSRI antidepressant such as sertraline for at least six to nine months.',
    red_flags:
      'Suicidal thoughts or plans, self-harm, hopelessness, psychotic symptoms, not eating or drinking, or severe postpartum depression: needs same-day psychiatric assessment.',
  },
  {
    name: 'Generalized anxiety disorder',
    description:
      'Excessive, uncontrollable worry about everyday matters such as work, health, money or family on most days for six months or more, with restlessness, feeling on edge, easy fatigue, irritability, muscle tension, difficulty concentrating and trouble falling asleep. Physical symptoms include palpitations, sweating, tremor, dry mouth, frequent urination and stomach upset. More common in women and after stressful life events. Thyroid disease and excess caffeine should be excluded. Management: cognitive behavioural therapy, relaxation and breathing exercises, SSRIs such as sertraline, and short-term propranolol for physical symptoms.',
    red_flags:
      'Suicidal thoughts, panic attacks with chest pain needing cardiac exclusion, alcohol or sedative misuse, inability to function at work or home, or co-existing severe depression.',
  },
  {
    name: 'Panic disorder',
    description:
      'Recurrent sudden attacks of intense fear peaking within minutes, with a pounding heart, chest pain or tightness, breathlessness or choking, sweating, trembling, dizziness, tingling of the hands and lips, and a fear of dying or going crazy. Attacks may occur unexpectedly, even at night, leading to repeated emergency visits and avoidance of crowded places. Common in young adults, especially women. Heart and thyroid causes should be excluded with ECG and blood tests. Treatment: reassurance, breathing techniques, cognitive behavioural therapy and SSRIs such as sertraline.',
    red_flags:
      'Chest pain with cardiac risk factors or an abnormal ECG, fainting, suicidal thoughts, alcohol or sedative misuse, or attacks leaving the person unable to leave home.',
  },
  {
    name: 'Insomnia',
    description:
      'Persistent difficulty falling asleep, staying asleep or waking too early, at least three nights a week for three months, with unrefreshing sleep and daytime tiredness, irritability, poor concentration and low mood. Often linked to stress, anxiety, depression, shift work, late-night screen use, evening tea or coffee, pain, alcohol and irregular sleep timings. Common in older adults and women. Management: sleep hygiene, a fixed wake-up time, avoiding screens and caffeine at night, cognitive behavioural therapy for insomnia, and a short course of a hypnotic such as zolpidem only if needed.',
    red_flags:
      'Loud snoring with witnessed pauses in breathing, severe daytime sleepiness while driving, suicidal thoughts, signs of mania, or dependence on sleeping pills or alcohol.',
  },

  // ---------------- Renal and urology ----------------
  {
    name: 'Renal colic (kidney stones)',
    description:
      'Sudden excruciating colicky pain in the flank or loin that comes in waves and spreads to the groin or genitals, making the patient restless and unable to find a comfortable position. Nausea, vomiting, blood in the urine, frequent urination and burning may accompany it. Common in hot climates with low water intake, in men aged 20 to 50, and with a past history of stones. Urine shows red cells, and ultrasound or CT KUB shows the stone. Treatment: diclofenac for pain, antispasmodics, antiemetics, plenty of fluids and tamsulosin to help passage.',
    red_flags:
      'Fever with chills (infected obstructed kidney), a single kidney, reduced or no urine output, uncontrolled pain or vomiting, rising creatinine, or a stone larger than 10 mm.',
  },

  // ---------------- Musculoskeletal ----------------
  {
    name: 'Osteoarthritis of the knee',
    description:
      'Wear-and-tear degeneration of knee cartilage causing knee pain that worsens on walking, climbing stairs, squatting or sitting cross-legged and eases with rest, with short morning stiffness under 30 minutes, grating or crackling sounds, swelling and gradually reduced movement. Common in people over 50, women, those who are overweight and after knee injuries; a bow-leg deformity may develop. X-ray shows joint space narrowing and osteophytes. Management: weight loss, quadriceps strengthening exercises, physiotherapy, paracetamol or short NSAID courses, and knee replacement for severe disabling disease.',
    red_flags:
      'A hot, red, very swollen knee with fever (septic arthritis), inability to bear weight after injury, locking, calf swelling, or rapid worsening with night pain.',
  },
  {
    name: 'Lumbar disc herniation with sciatica',
    description:
      'A bulging lumbar disc pressing on a nerve root, causing low back pain with sharp, shooting or electric-shock pain running down the buttock and back of one leg to the foot, with tingling, numbness or weakness. Pain worsens on bending forward, sitting long, coughing or sneezing. Common in adults aged 30 to 50 after lifting heavy objects, long driving or desk work. The straight leg raise test is positive and MRI confirms the level. Management: short rest then activity, NSAIDs, pregabalin for nerve pain, physiotherapy and core exercises, with surgery for persistent deficit.',
    red_flags:
      'Numbness around the genitals or buttocks, loss of bladder or bowel control, progressive leg weakness or foot drop, fever, cancer history, or symptoms in both legs (cauda equina).',
  },
  {
    name: 'Rheumatoid arthritis',
    description:
      'Chronic autoimmune arthritis causing pain, warmth and swelling of many small joints of the hands, wrists and feet on both sides, with morning stiffness lasting over an hour that eases with movement. Fatigue, low-grade fever, weight loss and nodules may occur, and untreated disease leads to joint deformity. Most common in women aged 30 to 50. Blood tests show raised ESR and CRP with positive rheumatoid factor and anti-CCP antibodies. Management: early weekly methotrexate with folic acid, short low-dose prednisolone bridging, physiotherapy and joint protection.',
    red_flags:
      'Fever with a single hot joint, breathlessness or dry cough on methotrexate, mouth ulcers or low blood counts, sudden neck pain with tingling in the limbs, or a painful red eye.',
  },
  {
    name: 'Gout',
    description:
      'Sudden attack of excruciating pain, redness, heat and swelling in a single joint, classically the base of the big toe, often starting at night so that even a bedsheet touching it hurts. Triggered by alcohol, beer, red meat, seafood, dehydration, fasting or diuretics. Common in middle-aged men with obesity, hypertension or kidney disease; recurrent attacks cause chalky deposits called tophi. Serum uric acid is usually raised and joint fluid shows needle-shaped crystals. Treatment: colchicine or an NSAID early in the attack, rest and ice, then long-term urate lowering after the flare.',
    red_flags:
      'High fever with a hot joint (exclude septic arthritis), several joints involved at once, kidney stones or worsening kidney function, or no improvement after 48 hours of treatment.',
  },

  // ---------------- Dermatology ----------------
  {
    name: 'Atopic dermatitis (eczema)',
    description:
      'Chronic itchy, dry, red, scaly patches of skin, typically in the elbow and knee creases, neck, face and hands, worse at night and in winter. Scratching causes oozing, crusting and thickened darker skin. It often begins in childhood and is linked with asthma, allergic rhinitis and a family history of allergy. Triggers include soaps, wool, sweating, dust mites, stress and hot showers. Management: frequent thick moisturisers, mild soap substitutes, short courses of a topical steroid such as mometasone for flares, and antihistamines like cetirizine at night for itch.',
    red_flags:
      'Rapidly spreading painful blisters or punched-out sores (eczema herpeticum), fever with oozing yellow crusts, redness of the whole body, or failure to respond to treatment.',
  },
  {
    name: 'Psoriasis',
    description:
      'Chronic immune-mediated skin disease causing well-defined, raised red patches covered with thick silvery-white scales on the elbows, knees, scalp and lower back, which may itch, crack and bleed. Nails show pitting and thickening, and some patients develop joint pain (psoriatic arthritis). Flares are triggered by stress, throat infections, smoking, alcohol, cold weather and stopping steroids suddenly. It is not contagious and often runs in families. Management: moisturisers, topical steroids with vitamin D analogues, coal tar for the scalp, phototherapy, and methotrexate for extensive disease.',
    red_flags:
      'Red, inflamed skin over most of the body, pus-filled spots with fever, painful swollen joints, or rapid worsening after stopping oral steroids.',
  },
  {
    name: 'Tinea (fungal skin infection)',
    description:
      'Superficial fungal infection (ringworm) causing intensely itchy, red, ring-shaped patches with a raised scaly advancing edge and a clearer centre, common in the groin, waist, buttocks, under the breasts and on the thighs. Spread by sweat, humidity, tight synthetic clothing, shared towels and family contacts, and extremely common in India. Misuse of over-the-counter steroid combination creams makes it widespread and resistant. A KOH skin scraping shows fungal hyphae. Treatment: topical clotrimazole for at least 4 weeks, oral antifungals for extensive disease, cetirizine for itch and keeping skin dry.',
    red_flags:
      'Widespread or rapidly spreading lesions, scalp involvement with pus, painful swelling, diabetes or weak immunity, or no improvement after four weeks of treatment.',
  },
  {
    name: 'Scabies',
    description:
      'Highly contagious mite infestation causing intense itching that is much worse at night, with small red bumps, tiny blisters and thin burrow lines between the fingers, on the wrists, waist, armpits, around the navel, buttocks and genitals. Several family or hostel members are often itching at the same time. Common in crowded living conditions and among children. Scratching can lead to secondary bacterial infection with pustules. Treatment: permethrin cream applied from the neck down by all household contacts at once, or oral ivermectin, with hot washing of clothes and bedding.',
    red_flags:
      'Thick crusted scaly plaques in elderly or immunocompromised patients (crusted scabies), fever with spreading infected sores, or facial puffiness and reduced urine after a skin infection.',
  },
  {
    name: 'Acute urticaria',
    description:
      'Sudden itchy, raised, red or pale welts (hives) that move around the body, each lasting less than 24 hours, sometimes with swelling of the lips or eyelids. Triggered by foods such as seafood or nuts, medicines like painkillers or antibiotics, insect bites, infections, heat or stress. Affects all ages and often no cause is found. The skin returns to normal between episodes. Management: identify and avoid the trigger, take a non-sedating antihistamine such as cetirizine, apply cool compresses, and use a short steroid course for severe episodes.',
    red_flags:
      'Swelling of the tongue or throat, difficulty breathing or swallowing, hoarse voice, wheezing, dizziness, fainting or vomiting after exposure, suggesting anaphylaxis: give adrenaline immediately.',
  },
];
