interface PolicyFallbackDetails {
  apply_link?: string;
  application_steps?: string[];
  website?: string;
}

const POLICY_FALLBACKS: Record<string, PolicyFallbackDetails> = {
  'pm kisan': {
    apply_link: 'https://pmkisan.gov.in/RegistrationFormupdated.aspx',
    application_steps: [
      'Open the PM Kisan portal.',
      'Click "New Farmer Registration".',
      'Enter Aadhaar number and verify details.',
      'Fill in personal, bank and land information.',
      'Submit the form and wait for verification.',
    ],
    website: 'https://pmkisan.gov.in',
  },
  'kisan credit card (kcc)': {
    apply_link: 'https://www.udyamimitra.in',
    application_steps: [
      'Visit a partner bank or open Udyamimitra online.',
      'Choose the correct KCC loan category.',
      'Upload Aadhaar, land documents and business proof.',
      'Complete the application form and submit it.',
      'Wait for the bank verification and card issuance.',
    ],
    website: 'https://www.myscheme.gov.in/schemes/kcc',
  },
  'national pension scheme (nps)': {
    apply_link: 'https://enps.nsdl.com/eNPS/NationalPensionSystem.html',
    application_steps: [
      'Open the NPS portal.',
      'Click "Register" to start a new account.',
      'Enter PAN, Aadhaar and personal details.',
      'Select a pension plan and contribution option.',
      'Make the initial contribution to activate the account.',
    ],
    website: 'https://enps.nsdl.com',
  },
  'pmkvy (pradhan mantri kaushal vikas yojana)': {
    apply_link: 'https://www.skillindia.gov.in',
    application_steps: [
      'Visit the Skill India website.',
      'Search for a nearby training center.',
      'Register using your Aadhaar number.',
      'Choose a free skill training program.',
      'Attend the training and complete the course.',
    ],
    website: 'https://www.pmkvyofficial.org',
  },
  'mudra loan': {
    apply_link: 'https://www.udyamimitra.in',
    application_steps: [
      'Visit the official Mudra website or a bank branch.',
      'Select the right Mudra loan type (Shishu/Kishore/Tarun).',
      'Prepare and submit business details and documents.',
      'Complete the loan application form.',
      'Wait for verification and approval from the lender.',
    ],
    website: 'https://www.mudra.org.in',
  },
  'beti bachao beti padhao': {
    application_steps: [
      'Understand that this is a government initiative supported through schools and local authorities.',
      'Check with your village/ward office or school for program support.',
      'Participate through education, health and child welfare programs.',
      'Keep your daughter’s birth and school documents updated with local officials.',
    ],
    website: 'https://wcd.nic.in',
  },
  'skill india': {
    apply_link: 'https://www.skillindia.gov.in',
    application_steps: [
      'Register on the Skill India portal.',
      'Search for a course that matches your interest.',
      'Apply for the chosen training program.',
      'Enroll and attend the classes offered by the center.',
    ],
    website: 'https://www.skillindia.gov.in',
  },
  'pmay (pradhan mantri awas yojana)': {
    apply_link: 'https://pmaymis.gov.in',
    application_steps: [
      'Open the PMAY MIS portal.',
      'Click "Citizen Assessment".',
      'Enter Aadhaar and family details.',
      'Fill in income and housing data.',
      'Submit the application for approval.',
    ],
    website: 'https://pmaymis.gov.in',
  },
  'stand up india': {
    apply_link: 'https://www.standupmitra.in',
    application_steps: [
      'Register on the StandUpMitran website.',
      'Choose the loan option that matches your business.',
      'Apply for a bank loan through the portal.',
      'Submit all required documents to the bank.',
      'Follow up with the assigned bank for approval.',
    ],
    website: 'https://www.standupmitra.in',
  },
  'ayushman bharat (pm-jay)': {
    apply_link: 'https://beneficiary.nha.gov.in',
    application_steps: [
      'Visit the official PM-JAY website.',
      'Check your eligibility status.',
      'Register at a hospital or CSC center if eligible.',
      'Get your Ayushman card and use it at empaneled hospitals.',
    ],
    website: 'https://pmjay.gov.in',
  },
  'soil health card scheme': {
    apply_link: 'https://soilhealth.dac.gov.in/home',
    application_steps: [
      'Visit the Soil Health Card portal.',
      'Register as a farmer.',
      'Submit a soil sample through your local center.',
      'Receive the soil health report and follow recommendations.',
    ],
    website: 'https://soilhealth.dac.gov.in',
  },
  'paramparagat krishi vikas yojana': {
    apply_link: 'https://pgsindia-ncof.gov.in',
    application_steps: [
      'Contact your local agriculture officer.',
      'Join an organic farming cluster under the program.',
      'Register under the scheme with the officer’s help.',
      'Attend training and receive subsidy support.',
    ],
    website: 'https://pgsindia-ncof.gov.in',
  },
  'rashtriya krishi vikas yojana': {
    application_steps: [
      'Visit the state agriculture department office.',
      'Submit your project proposal or application.',
      'Work with the department for approval and funding.',
    ],
    website: 'https://rkvy.nic.in',
  },
  'national food security mission': {
    application_steps: [
      'Contact your state agriculture department.',
      'Register for crop support under the scheme.',
      'Follow the local enrollment process.',
    ],
    website: 'https://nfsm.gov.in',
  },
  'dairy entrepreneurship development scheme': {
    application_steps: [
      'Prepare a dairy business plan.',
      'Apply through a NABARD-supported bank.',
      'Submit the required dairy project documents.',
      'Receive subsidy approval after verification.',
    ],
    website: 'https://www.nabard.org',
  },
  'mahila e-haat': {
    apply_link: 'https://mahilaehaat-rmk.gov.in',
    application_steps: [
      'Register on Mahila E-Haat.',
      'Upload your product details.',
      'Start selling your products online.',
    ],
    website: 'https://mahilaehaat-rmk.gov.in',
  },
  'working women hostel scheme': {
    application_steps: [
      'Apply through the local hostel authority.',
      'Submit proof of employment.',
      'Wait for approval and hostel allotment.',
    ],
    website: 'https://wcd.nic.in',
  },
  'ujjawala scheme': {
    application_steps: [
      'Contact a local NGO or district office.',
      'Register for rehabilitation support.',
      'Complete the required formalities with the NGO.',
    ],
    website: 'https://wcd.nic.in',
  },
  'step scheme': {
    application_steps: [
      'Join a registered training institute.',
      'Enroll in the training program.',
      'Follow the institute’s application process.',
    ],
    website: 'https://wcd.nic.in',
  },
  'sukanya samriddhi yojana': {
    apply_link: 'https://indiapost.gov.in',
    application_steps: [
      'Open the Sukanya Samriddhi account at a bank or post office.',
      'Provide the girl child’s identity and parent details.',
      'Deposit the initial amount and save regularly.',
    ],
    website: 'https://indiapost.gov.in',
  },
  'mid day meal scheme': {
    application_steps: [
      'Apply through your child’s school.',
      'School or education department will enroll your child.',
    ],
    website: 'https://pmposhan.education.gov.in',
  },
  'right to education (rte)': {
    application_steps: [
      'Apply through the state education admission portal.',
      'Submit school admission documents under RTE quota.',
    ],
    website: 'https://dsel.education.gov.in',
  },
  'inspire scholarship': {
    apply_link: 'https://online-inspire.gov.in',
    application_steps: [
      'Register on the INSPIRE portal.',
      'Submit your academic details and documents.',
      'Complete the online scholarship application.',
    ],
    website: 'https://online-inspire.gov.in',
  },
  'aicte pragati scholarship': {
    apply_link: 'https://scholarships.gov.in',
    application_steps: [
      'Register on the National Scholarship Portal.',
      'Submit the required academic documents.',
      'Apply for the AICTE Pragati scholarship.',
    ],
    website: 'https://aicte-india.org',
  },
  'aicte saksham scholarship': {
    apply_link: 'https://scholarships.gov.in',
    application_steps: [
      'Register on the scholarship portal.',
      'Upload the disability proof.',
      'Submit the application for Saksham support.',
    ],
    website: 'https://aicte-india.org',
  },
  'janani suraksha yojana': {
    application_steps: [
      'Register at a government hospital.',
      'Use ASHA worker support to enroll.',
      'Avail maternity benefits during delivery.',
    ],
    website: 'https://nhm.gov.in',
  },
  'rashtriya swasthya bima yojana': {
    application_steps: [
      'Register through an enrollment center.',
      'Complete the scheme registration formalities.',
      'Receive the health insurance card.',
    ],
    website: 'https://labour.gov.in',
  },
  'mission indradhanush': {
    application_steps: [
      'Visit the nearest government health center.',
      'Register for the vaccination program.',
      'Receive free immunizations as scheduled.',
    ],
    website: 'https://nhm.gov.in',
  },
  'national tb elimination program': {
    application_steps: [
      'Register at the local TB center.',
      'Receive a free treatment plan.',
      'Follow the medication and follow-up schedule.',
    ],
    website: 'https://tbcindia.gov.in',
  },
  'poshan abhhiyaan': {
    application_steps: [
      'Register at your local Anganwadi center.',
      'Enroll for nutrition support services.',
      'Collect benefits through the Anganwadi.',
    ],
    website: 'https://poshanabhiyaan.gov.in',
  },
  'ddu-gky': {
    apply_link: 'https://ddugky.gov.in',
    application_steps: [
      'Register on the DDU-GKY portal.',
      'Choose a training program.',
      'Submit your details and join the course.',
    ],
    website: 'https://ddugky.gov.in',
  },
  'national career service': {
    apply_link: 'https://ncs.gov.in',
    application_steps: [
      'Create an account on NCS.',
      'Search and apply for jobs.',
      'Submit your profile and follow employer steps.',
    ],
    website: 'https://ncs.gov.in',
  },
  'startup india': {
    apply_link: 'https://startupindia.gov.in',
    application_steps: [
      'Register your startup on the Startup India portal.',
      'Upload required documents.',
      'Submit the application for recognition.',
    ],
    website: 'https://startupindia.gov.in',
  },
  'digital india': {
    application_steps: [
      'Access digital services online.',
      'Use the Digital India portal for e-governance services.',
    ],
    website: 'https://digitalindia.gov.in',
  },
  'pm rozgar protsahan yojana': {
    application_steps: [
      'Employers register their employees for the scheme.',
      'Employers claim the incentive from the government.',
    ],
    website: 'https://labour.gov.in',
  },
  'cgtmse': {
    application_steps: [
      'Apply for an MSME loan through a participating bank.',
      'Submit your business plan and documents.',
      'Receive collateral-free credit support.',
    ],
    website: 'https://cgtmse.in',
  },
  'sidbi make in india loan': {
    apply_link: 'https://sidbi.in',
    application_steps: [
      'Submit your business proposal to SIDBI.',
      'Apply for the Make in India loan.',
      'Wait for the loan approval and disbursement.',
    ],
    website: 'https://sidbi.in',
  },
  'tread scheme': {
    application_steps: [
      'Apply through a registered NGO.',
      'Receive support for technology and innovation.',
    ],
    website: 'https://msme.gov.in',
  },
  'msme samadhaan': {
    apply_link: 'https://samadhaan.msme.gov.in',
    application_steps: [
      'File a complaint online on the MSME Samadhaan portal.',
      'Track the resolution of your dispute.',
    ],
    website: 'https://samadhaan.msme.gov.in',
  },
  'pmfme scheme': {
    apply_link: 'https://pmfme.mofpi.gov.in',
    application_steps: [
      'Register online on the PMFME portal.',
      'Apply for the subsidy and support.',
    ],
    website: 'https://pmfme.mofpi.gov.in',
  },
  'helpage india': {
    application_steps: [
      'Contact a HelpAge India center.',
      'Register for support services.',
    ],
    website: 'https://www.helpageindia.org',
  },
  'smile foundation': {
    application_steps: [
      'Connect with Smile Foundation programs.',
      'Register through their available support channels.',
    ],
    website: 'https://www.smilefoundationindia.org',
  },
  'cry (child rights)': {
    application_steps: [
      'Reach out to CRY via their website or programs.',
      'Participate in child support initiatives.',
    ],
    website: 'https://www.cry.org',
  },
  'akshaya patra foundation': {
    application_steps: [
      'Contact the foundation through your school.',
      'Register for meal program support.',
    ],
    website: 'https://www.akshayapatra.org',
  },
  'pratham education': {
    application_steps: [
      'Reach out through Pratham programs.',
      'Enroll in educational support activities.',
    ],
    website: 'https://www.pratham.org',
  },
  'smart cities mission': {
    application_steps: [
      'Check your city’s Smart Cities plan.',
      'Participate via local government projects.',
    ],
    website: 'https://smartcities.gov.in',
  },
  'amrut scheme': {
    application_steps: [
      'Learn about AMRUT projects in your city.',
      'Apply through local urban development offices if available.',
    ],
    website: 'https://amrut.gov.in',
  },
  'fame india scheme': {
    application_steps: [
      'Purchase an EV from a participating dealer.',
      'Claim the subsidy through the dealer’s process.',
    ],
    website: 'https://fame2.heavyindustries.gov.in',
  },
  'national urban livelihood mission': {
    application_steps: [
      'Visit your local urban livelihoods office.',
      'Register for the scheme locally.',
    ],
    website: 'https://nulm.gov.in',
  },
  'metro rail subsidy schemes': {
    application_steps: [
      'Use the metro services under the subsidy program.',
      'Check with local metro authority for eligibility details.',
    ],
    website: 'https://www.india.gov.in',
  },
};

function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}

export function getPolicyFallbackDetails(title: string): PolicyFallbackDetails {
  return POLICY_FALLBACKS[normalizeTitle(title)] || {};
}
