import type { DepartmentSeed } from './types';

export const departments: DepartmentSeed[] = [
  {
    name: 'General Medicine',
    description:
      'First point of contact for adult outpatients with fever, infections, fatigue, body aches and undiagnosed complaints. Manages hypertension, diabetes follow-up, tropical fevers such as dengue, malaria and typhoid, and coordinates referrals to specialty clinics.',
    location: 'Block A, Ground Floor',
  },
  {
    name: 'Cardiology',
    description:
      'Evaluation and treatment of chest pain, palpitations, breathlessness on exertion, high blood pressure and heart failure. Offers ECG, echocardiography, treadmill testing, Holter monitoring and a 24x7 chest pain unit linked to the cath lab.',
    location: 'Block B, Floor 2',
  },
  {
    name: 'Gastroenterology',
    description:
      'Care for acidity, reflux, abdominal pain, indigestion, vomiting, diarrhoea, jaundice and liver or pancreatic disease. Provides upper GI endoscopy, colonoscopy, abdominal ultrasound review and nutrition counselling.',
    location: 'Block B, Floor 3',
  },
  {
    name: 'Pulmonology',
    description:
      'Clinic for cough, wheezing, breathlessness and chest infections, including asthma, COPD, pneumonia and tuberculosis under the national TB programme. Offers spirometry, chest X-ray review, sputum testing and nebulisation.',
    location: 'Block C, Floor 1',
  },
  {
    name: 'Neurology',
    description:
      'Assessment of headache, migraine, giddiness, seizures, numbness, weakness and stroke. Runs a stroke-alert pathway with emergency CT access, plus EEG, nerve conduction studies and long-term epilepsy follow-up.',
    location: 'Block C, Floor 3',
  },
  {
    name: 'Endocrinology',
    description:
      'Diabetes, thyroid and hormonal disorders. Manages high blood sugar, insulin initiation, thyroid swelling or imbalance, weight gain and obesity, with diabetes educators, foot-care screening and HbA1c tracking.',
    location: 'Block A, Floor 2',
  },
  {
    name: 'Orthopedics',
    description:
      'Bone, joint and spine problems including knee pain, back pain with sciatica, arthritis, gout, sprains and fractures. Provides X-ray review, joint injections, plaster room services and physiotherapy referrals.',
    location: 'Block D, Ground Floor',
  },
  {
    name: 'Dermatology',
    description:
      'Skin, hair and nail conditions such as itchy rashes, eczema, psoriasis, fungal ringworm infections, acne, allergic reactions and skin infections. Offers patch testing, skin scrapings and minor procedures.',
    location: 'Block D, Floor 1',
  },
  {
    name: 'Psychiatry',
    description:
      'Confidential care for low mood, anxiety, panic, sleep problems, stress and addiction. Provides psychiatric assessment, medication management, counselling and a crisis line for patients with thoughts of self-harm.',
    location: 'Block E, Floor 2',
  },
  {
    name: 'ENT',
    description:
      'Ear, nose and throat clinic for earache, blocked nose, sinus pain, sore throat, tonsillitis, hearing loss and allergic rhinitis. Equipped with endoscopy, audiometry and positional vertigo testing.',
    location: 'Block E, Ground Floor',
  },
];
