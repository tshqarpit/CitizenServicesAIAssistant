require('dotenv').config();
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { citizenServicesV1 } = require('./schema');

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing in .env');
    process.exit(1);
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  console.log('Seeding database...');

  try {
    const services = [
      {
        serviceName: 'Register e-FIR',
        keywords: 'online FIR, electronic first information report, unknown accused, digital police station, UP Police, cognizable offense.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'Complainants reporting specific cognizable offenses (e.g., theft, cybercrime) where the accused is unknown.',
        requiredDocuments: 'Incident details (date, time, place), description of suspects, and witness information.',
        fullGuideText: 'Citizens can register FIRs for specific offenses online without visiting a police station. The system logs the request into the centralized CCTNS database, and users can track the status until final closure. Note that filing a false FIR is punishable under IPC Sections 182 and 203.',
        officialLink: 'https://cctnsup.gov.in/eFIR/login.aspx'
      },
      {
        serviceName: 'Complaint Registration',
        keywords: 'raise complaint, senior citizen complaint, public grievance, report misbehavior, UPCOP complaint, citizen portal complaint.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'Any citizen with a grievance; specialized support for senior citizens and persons with disabilities (Divyang).',
        requiredDocuments: 'Personal identification and details of the complaint or grievance.',
        fullGuideText: 'This module allows for the digital lodging of grievances. Senior citizens should use the UPCOP app to file complaints and receive specialized assistance. All other general complaints can be submitted through the UP Police Citizen Services Portal or via email to specialized cells like Cyber Crime or Mahila Samman Prakoshtha. These platforms ensure grievances are prioritized and addressed promptly.',
        officialLink: 'https://cctnsup.gov.in/citizenportal/login.aspx'
      },
      {
        serviceName: 'Character Verification (Character Certificate)',
        keywords: 'character certificate, PCC, police clearance certificate, background check, criminal record, UPCOP.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'The individual undergoing verification must be a resident of Uttar Pradesh.',
        requiredDocuments: 'Recent passport-sized photograph; proof of identity (Aadhar, Passport, etc.); proof of address; and age proof. Files must be under 200 KB.',
        fullGuideText: 'Citizens apply online and pay a ₹50 fee. The process obtains reports from local police stations, the Local Intelligence Unit (LIU), and the District Crime Records Bureau (DCRB). A digitally signed certificate is issued online by the District Police Chief (SSP/SP). Resolution time averages about six days.',
        officialLink: 'https://cctnsup.gov.in/citizenportal/login.aspx'
      },
      {
        serviceName: 'Tenant Verification (Tenant/PG Verification)',
        keywords: 'tenant police verification, kirayedar verification, PG verification, residential security, landlord compliance, UPCOP.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'Mandatory for all landlords in Uttar Pradesh renting residential property under Section 188 of the IPC.',
        requiredDocuments: 'Landlord: ID and property ownership proof (e.g., electricity bill, sale deed). Tenant: Passport-size photo, ID proof (Aadhar/Passport/PAN), permanent address proof, and signed rent agreement.',
        fullGuideText: 'Landlords must register property and tenant details online and upload documents (max 200 KB). A ₹50 fee is paid online. Verification involves local station reports and intelligence checks. Completion typically takes around eight days.',
        officialLink: 'https://cctnsup.gov.in/citizenportal/login.aspx'
      },
      {
        serviceName: 'Domestic Help Verification',
        keywords: 'servant verification, household staff check, domestic worker background, maid verification, UPCOP.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'Residents of Uttar Pradesh employing domestic staff.',
        requiredDocuments: 'Employer: ID proof and workplace details. Staff: Photo, Aadhar Card, and previous employment history.',
        fullGuideText: 'This service allows employers to request a background check on household staff through the UPCOP app or portal. It involves a ₹50 fee and digital submission. Reports are gathered from local stations and crime bureaus to ensure the employee has no criminal history.',
        officialLink: 'https://cctnsup.gov.in/citizenportal/login.aspx'
      },
      {
        serviceName: 'Employee Verification',
        keywords: 'job applicant screening, commercial staff verification, professional background check, employee security, UPCOP.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'Commercial organizations or individuals hiring staff in Uttar Pradesh.',
        requiredDocuments: 'Employer: Commercial ID and address proof. Employee: Photo, ID proof, and criminal record disclosure.',
        fullGuideText: 'Designed for professional screening, this module initiates a formal background check through police records. A ₹50 fee is required. The process has been streamlined to average about five days for completion.',
        officialLink: 'https://cctnsup.gov.in/citizenportal/login.aspx'
      },
      {
        serviceName: 'Report Lost Article',
        keywords: 'lost and found, report lost documents, mobile loss report, lost items registration, online lost report, UPCOP.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'Any individual who has lost a personal item or document within Uttar Pradesh.',
        requiredDocuments: 'Accurate description of the lost item and details of when and where it was lost.',
        fullGuideText: 'Citizens can register lost items (like phones, wallets, or documents) through the UPCOP app or portal to obtain an official record. This digital report is often required to block stolen mobile devices on the national CEIR portal or to apply for duplicate documents. Over 7.3 lakh articles have been reported through this module.',
        officialLink: 'https://cctnsup.gov.in/citizenportal/login.aspx'
      },
      {
        serviceName: 'Film Shooting Request',
        keywords: 'cinema permission, movie shooting, public production permit, film production coordination, UPCOP.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'Production houses or individuals seeking to film in public jurisdictions in Uttar Pradesh.',
        requiredDocuments: 'Production details, location list, and security plan.',
        fullGuideText: 'This module facilitates coordination for cinematic productions. Applicants submit their shooting schedule and locations online to obtain necessary police permissions and security arrangements.',
        officialLink: 'https://cctnsup.gov.in/citizenportal/login.aspx'
      },
      {
        serviceName: 'Event/Performance Request',
        keywords: 'public event permit, cultural performance request, religious event permission, public gathering permit, UPCOP.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'Individuals or organizations organizing cultural, religious, or public events.',
        requiredDocuments: 'Event details, location, expected attendance, and organizer identification.',
        fullGuideText: 'Provides a digital channel for seeking permits for public gatherings and performances. Organizers can track their application status through the app or portal until the permit is granted.',
        officialLink: 'https://cctnsup.gov.in/citizenportal/login.aspx'
      },
      {
        serviceName: 'Public Permissions (Protest/Strike/Procession)',
        keywords: 'dharna permit, strike notification, public march request, parade permission, UPCOP.',
        departmentName: 'Uttar Pradesh Police',
        eligibility: 'Individuals or groups organizing public demonstrations or marches.',
        requiredDocuments: 'Organizer IDs, route maps (for processions), and expected participant numbers.',
        fullGuideText: 'This service allows groups to notify the police of organized demonstrations or seek permission for public marches. It ensures that law enforcement can coordinate traffic and security to prevent public disturbance.',
        officialLink: 'https://cctnsup.gov.in/citizenportal/login.aspx'
      }
    ];

    // First delete old entries to prevent duplicates
    await db.delete(citizenServicesV1);

    await db.insert(citizenServicesV1).values(services);
    console.log('Seed successful! Added 10 UPCOP services.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit(0);
  }
}

seed();
