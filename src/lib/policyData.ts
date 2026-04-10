// Policy categories
export const POLICY_CATEGORIES = [
  { id: 'Education', label: 'Education', color: 'bg-accent/10 text-accent' },
  { id: 'Agriculture', label: 'Agriculture', color: 'bg-eligible/10 text-eligible' },
  { id: 'Health', label: 'Health', color: 'bg-destructive/10 text-destructive' },
  { id: 'Employment', label: 'Employment', color: 'bg-secondary/10 text-secondary' },
  { id: 'Social Welfare', label: 'Social Welfare', color: 'bg-primary/10 text-primary' },
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

export const OCCUPATIONS = [
  'farmer', 'student', 'entrepreneur', 'business owner',
  'salaried', 'daily wage', 'homemaker', 'unemployed', 'retired', 'other'
];

export const CATEGORIES = ['General', 'SC', 'ST', 'OBC', 'Minority', 'EWS', 'LIG', 'MIG', 'BPL'];
