import { PrismaClient, Role, UserStatus, VerificationStatus, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * DEMO DATA for local development only — creates approved, rated lawyers so
 * search, featured lawyers, profiles, and hub pages have content.
 * Run: npm run seed:demo   (idempotent — safe to re-run)
 * Never run in production.
 */

const PASSWORD = 'Demo@12345';

const LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Tamil', code: 'ta' },
  { name: 'Kannada', code: 'kn' },
  { name: 'Telugu', code: 'te' },
  { name: 'Malayalam', code: 'ml' },
];

const LAWYERS = [
  {
    email: 'lawyer.sharma@demo.lawmitran.local', mobile: '+919000000001',
    fullName: 'Adv. Anita Sharma', bar: 'KAR/1001/2008', state: 'Karnataka',
    city: 'Bengaluru', exp: 18, rating: 4.8, count: 120, lat: 12.9716, lng: 77.5946,
    areas: ['Family Law', 'Divorce'], langs: ['en', 'hi', 'kn'],
    bio: 'Family & matrimonial specialist with 18+ years of trial experience and a result-oriented, ethical approach. Appears before the family courts and Karnataka High Court.',
  },
  {
    email: 'lawyer.iyer@demo.lawmitran.local', mobile: '+919000000002',
    fullName: 'Adv. Ramesh Iyer', bar: 'TN/2002/2004', state: 'Tamil Nadu',
    city: 'Chennai', exp: 22, rating: 4.9, count: 90, lat: 13.0827, lng: 80.2707,
    areas: ['Criminal Law', 'Consumer Law'], langs: ['en', 'ta'],
    bio: 'Criminal-defence and consumer-disputes counsel with 22 years appearing before trial courts and the Madras High Court.',
  },
  {
    email: 'lawyer.nair@demo.lawmitran.local', mobile: '+919000000003',
    fullName: 'Adv. Priya Nair', bar: 'KL/3003/2012', state: 'Kerala',
    city: 'Kochi', exp: 14, rating: 4.6, count: 75, lat: 9.9312, lng: 76.2673,
    areas: ['Property Law', 'Civil Law'], langs: ['en', 'ml'],
    bio: 'Property and civil-litigation expert handling deeds, partitions, and succession matters across Kerala.',
  },
  {
    email: 'lawyer.khan@demo.lawmitran.local', mobile: '+919000000004',
    fullName: 'Adv. Imran Khan', bar: 'MAH/4004/2010', state: 'Maharashtra',
    city: 'Mumbai', exp: 16, rating: 4.7, count: 110, lat: 19.076, lng: 72.8777,
    areas: ['Corporate Law', 'Banking & Finance'], langs: ['en', 'hi'],
    bio: 'Corporate and banking counsel advising startups and SMEs on contracts, compliance, and dispute resolution in Mumbai.',
  },
  {
    email: 'lawyer.reddy@demo.lawmitran.local', mobile: '+919000000005',
    fullName: 'Adv. Sudha Reddy', bar: 'TS/5005/2013', state: 'Telangana',
    city: 'Hyderabad', exp: 12, rating: 4.5, count: 60, lat: 17.385, lng: 78.4867,
    areas: ['Employment Law', 'Civil Law'], langs: ['en', 'te', 'hi'],
    bio: 'Employment and service-matters advocate representing employees and employers before labour courts in Hyderabad.',
  },
  {
    email: 'lawyer.gupta@demo.lawmitran.local', mobile: '+919000000006',
    fullName: 'Adv. Vikas Gupta', bar: 'DL/6006/2006', state: 'Delhi',
    city: 'Delhi', exp: 20, rating: 4.8, count: 140, lat: 28.6139, lng: 77.209,
    areas: ['Criminal Law', 'Cheque Bounce'], langs: ['en', 'hi'],
    bio: 'Criminal trial and cheque-bounce specialist with 20 years across Delhi district courts and the Delhi High Court.',
  },
];

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);

  // Languages reference data
  for (const l of LANGUAGES) {
    await prisma.language.upsert({ where: { code: l.code }, create: l, update: { name: l.name } });
  }

  // A demo client for submitting requirements
  await prisma.user.upsert({
    where: { email: 'client@demo.lawmitran.local' },
    create: {
      email: 'client@demo.lawmitran.local', mobile: '+919000000100', passwordHash,
      fullName: 'Demo Client', role: Role.CLIENT, status: UserStatus.ACTIVE,
      emailVerified: true, mobileVerified: true,
      termsAcceptedAt: new Date(), consentAt: new Date(),
    },
    update: {},
  });

  for (const d of LAWYERS) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      create: {
        email: d.email, mobile: d.mobile, passwordHash,
        fullName: d.fullName, role: Role.LAWYER, status: UserStatus.ACTIVE,
        emailVerified: true, mobileVerified: true,
        termsAcceptedAt: new Date(), consentAt: new Date(),
      },
      update: {},
    });

    const city = await prisma.city.findFirst({ where: { name: d.city } });
    const slug = slugify(`${d.fullName.replace('Adv. ', '')} ${d.areas[0]} ${d.city}`);

    const lawyer = await prisma.lawyer.upsert({
      where: { barCouncilNumber: d.bar },
      create: {
        userId: user.id,
        fullName: d.fullName,
        slug,
        barCouncilNumber: d.bar,
        barCouncilState: d.state,
        experienceYears: d.exp,
        bio: d.bio,
        certificateImageUrl: 'demo/id-card-placeholder.png',
        cityId: city?.id ?? null,
        latitude: d.lat,
        longitude: d.lng,
        ratingAvg: d.rating,
        ratingCount: d.count,
        verificationStatus: VerificationStatus.APPROVED,
        approvedAt: new Date(),
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndDate: trialEnd,
      },
      update: {
        verificationStatus: VerificationStatus.APPROVED,
        ratingAvg: d.rating,
        ratingCount: d.count,
        slug,
      },
    });

    // practice areas
    for (const areaName of d.areas) {
      const area = await prisma.practiceArea.findFirst({ where: { name: areaName } });
      if (!area) continue;
      await prisma.lawyerPracticeArea.upsert({
        where: { lawyerId_practiceAreaId: { lawyerId: lawyer.id, practiceAreaId: area.id } },
        create: { lawyerId: lawyer.id, practiceAreaId: area.id, proficiency: 4 },
        update: {},
      });
    }

    // languages
    for (const code of d.langs) {
      const lang = await prisma.language.findUnique({ where: { code } });
      if (!lang) continue;
      await prisma.lawyerLanguage.upsert({
        where: { lawyerId_languageId: { lawyerId: lawyer.id, languageId: lang.id } },
        create: { lawyerId: lawyer.id, languageId: lang.id },
        update: {},
      });
    }
  }

  await seedDocuments();

  console.log(`Seeded ${LAWYERS.length} demo lawyers (APPROVED, on trial) + 1 demo client.`);
  console.log(`Demo logins — password for all: ${PASSWORD}`);
  console.log('  client@demo.lawmitran.local (client)');
  LAWYERS.forEach((l) => console.log(`  ${l.email} (${l.fullName})`));
}

/** Demo document catalog — categories + guided-form templates with prices. */
async function seedDocuments() {
  const CATALOG: Array<{
    name: string; slug: string; description: string;
    templates: Array<{
      title: string; price: number; keywords: string[];
      requiresStamp?: boolean; stampBasis?: string;
      fields: Array<{ name: string; label: string; type: string }>;
    }>;
  }> = [
    {
      name: 'Affidavits', slug: 'affidavits',
      description: 'Sworn statements for courts, banks, and government offices.',
      templates: [
        { title: 'General Affidavit', price: 199, keywords: ['affidavit', 'sworn statement'],
          fields: [
            { name: 'deponentName', label: 'Your full name', type: 'text' },
            { name: 'deponentAddress', label: 'Your address', type: 'textarea' },
            { name: 'statement', label: 'Statement of facts', type: 'textarea' },
          ] },
        { title: 'Address Proof Affidavit', price: 149, keywords: ['address proof', 'residence'],
          fields: [
            { name: 'deponentName', label: 'Your full name', type: 'text' },
            { name: 'currentAddress', label: 'Current address', type: 'textarea' },
            { name: 'sinceDate', label: 'Living here since', type: 'date' },
          ] },
        { title: 'Income Affidavit', price: 199, keywords: ['income', 'certificate'],
          fields: [
            { name: 'deponentName', label: 'Your full name', type: 'text' },
            { name: 'occupation', label: 'Occupation', type: 'text' },
            { name: 'annualIncome', label: 'Annual income (₹)', type: 'number' },
          ] },
      ],
    },
    {
      name: 'Rental Agreements', slug: 'rental-agreements',
      description: 'Residential and commercial rent/lease agreements, ready for stamp paper.',
      templates: [
        { title: 'Residential Rental Agreement (11 months)', price: 399,
          keywords: ['rent', 'lease', '11 month'], requiresStamp: true, stampBasis: 'State stamp duty on rent',
          fields: [
            { name: 'landlordName', label: 'Landlord name', type: 'text' },
            { name: 'tenantName', label: 'Tenant name', type: 'text' },
            { name: 'propertyAddress', label: 'Property address', type: 'textarea' },
            { name: 'monthlyRent', label: 'Monthly rent (₹)', type: 'number' },
            { name: 'deposit', label: 'Security deposit (₹)', type: 'number' },
            { name: 'startDate', label: 'Start date', type: 'date' },
          ] },
        { title: 'Commercial Lease Agreement', price: 699,
          keywords: ['commercial', 'lease', 'shop', 'office'], requiresStamp: true, stampBasis: 'State stamp duty on lease value',
          fields: [
            { name: 'lessorName', label: 'Lessor name', type: 'text' },
            { name: 'lesseeName', label: 'Lessee name', type: 'text' },
            { name: 'premisesAddress', label: 'Premises address', type: 'textarea' },
            { name: 'monthlyRent', label: 'Monthly rent (₹)', type: 'number' },
            { name: 'term', label: 'Lease term (months)', type: 'number' },
          ] },
      ],
    },
    {
      name: 'Name Change', slug: 'name-change',
      description: 'Affidavits and gazette paperwork for legally changing your name.',
      templates: [
        { title: 'Name Change Affidavit', price: 249, keywords: ['name change', 'gazette'],
          fields: [
            { name: 'oldName', label: 'Old name', type: 'text' },
            { name: 'newName', label: 'New name', type: 'text' },
            { name: 'reason', label: 'Reason for change', type: 'textarea' },
          ] },
        { title: 'Minor Name Change Affidavit (by parent)', price: 299, keywords: ['minor', 'child', 'name change'],
          fields: [
            { name: 'parentName', label: 'Parent/guardian name', type: 'text' },
            { name: 'childOldName', label: 'Child’s old name', type: 'text' },
            { name: 'childNewName', label: 'Child’s new name', type: 'text' },
          ] },
      ],
    },
    {
      name: 'Contracts & Agreements', slug: 'contracts-agreements',
      description: 'Everyday business and personal contracts drafted to standard formats.',
      templates: [
        { title: 'Non-Disclosure Agreement (NDA)', price: 499, keywords: ['nda', 'confidentiality'],
          fields: [
            { name: 'partyA', label: 'Disclosing party', type: 'text' },
            { name: 'partyB', label: 'Receiving party', type: 'text' },
            { name: 'purpose', label: 'Purpose of disclosure', type: 'textarea' },
          ] },
        { title: 'Freelance / Service Agreement', price: 599, keywords: ['freelance', 'services', 'contract'],
          fields: [
            { name: 'clientName', label: 'Client name', type: 'text' },
            { name: 'providerName', label: 'Service provider name', type: 'text' },
            { name: 'scope', label: 'Scope of work', type: 'textarea' },
            { name: 'fee', label: 'Fee (₹)', type: 'number' },
          ] },
        { title: 'Loan Agreement (personal)', price: 449, keywords: ['loan', 'lending', 'promissory'],
          requiresStamp: true, stampBasis: 'State stamp duty on loan amount',
          fields: [
            { name: 'lenderName', label: 'Lender name', type: 'text' },
            { name: 'borrowerName', label: 'Borrower name', type: 'text' },
            { name: 'amount', label: 'Loan amount (₹)', type: 'number' },
            { name: 'repaymentDate', label: 'Repayment date', type: 'date' },
          ] },
      ],
    },
  ];

  let templateCount = 0;
  for (const cat of CATALOG) {
    const category = await prisma.documentCategory.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug, description: cat.description },
      update: { name: cat.name, description: cat.description },
    });
    for (const t of cat.templates) {
      const existing = await prisma.documentTemplate.findFirst({
        where: { categoryId: category.id, title: t.title },
      });
      const data = {
        categoryId: category.id,
        title: t.title,
        keywords: t.keywords,
        price: t.price,
        schemaJson: { fields: t.fields },
        bodyTemplate:
          `${t.title.toUpperCase()}\n\n` +
          `This ${t.title} is made on {{${t.fields[0]?.name ?? 'date'}}}.\n\n` +
          t.fields.map((f) => `${f.label}: {{${f.name}}}`).join('\n') +
          `\n\n[DEMO TEMPLATE] Replace this body in Admin → Documents with the full legal text; ` +
          `placeholders use {{fieldName}} from the guided form.`,
        requiresStamp: t.requiresStamp ?? false,
        stampBasis: t.stampBasis ?? null,
        slug:
          t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        status: 'PUBLISHED' as const,
        active: true,
      };
      if (existing) {
        await prisma.documentTemplate.update({ where: { id: existing.id }, data });
      } else {
        await prisma.documentTemplate.create({ data });
      }
      templateCount++;
    }
  }
  console.log(`Seeded ${CATALOG.length} document categories with ${templateCount} demo templates.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
