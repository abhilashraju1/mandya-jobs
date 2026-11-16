import { PrismaClient, RoleType, OrgVerificationStatus, JobStatus, EmploymentType, WorkMode, SalaryPeriod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mandya Jobs database...');

  // 1. Categories
  const categories = [
    { slug: 'showrooms', titleEn: 'Showrooms & Retail', titleKn: 'ಶೋರೂಮ್ ಮತ್ತು ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರ' },
    { slug: 'healthcare', titleEn: 'Hospitals & Clinics', titleKn: 'ಆಸ್ಪತ್ರೆ ಮತ್ತು ಚಿಕಿತ್ಸಾಲಯ' },
    { slug: 'hospitality', titleEn: 'Hotels & Restaurants', titleKn: 'ಹೋಟೆಲ್ ಮತ್ತು ರೆಸ್ಟೋರೆಂಟ್' },
    { slug: 'education', titleEn: 'Schools & Colleges', titleKn: 'ಶಾಲೆ ಮತ್ತು ಕಾಲೇಜುಗಳು' },
    { slug: 'finance-legal', titleEn: 'CA, Accounts & Legal', titleKn: 'ಸಿಎ, ಲೆಕ್ಕಪತ್ರ ಮತ್ತು ಕಾನೂನು' },
    { slug: 'agriculture-dairy', titleEn: 'Agriculture & Dairy', titleKn: 'ಕೃಷಿ ಮತ್ತು ಹೈನುಗಾರಿಕೆ' },
    { slug: 'logistics', titleEn: 'Driving & Logistics', titleKn: 'ಚಾಲನೆ ಮತ್ತು ಸಾಗಾಣಿಕೆ' },
  ];

  for (const cat of categories) {
    await prisma.jobCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 2. Base Skills
  const baseSkills = [
    { nameEn: 'billing', nameKn: 'ಬಿಲ್ಲಿಂಗ್' },
    { nameEn: 'tally', nameKn: 'ಟ್ಯಾಲಿ' },
    { nameEn: 'customer service', nameKn: 'ಗ್ರಾಹಕ ಸೇವೆ' },
    { nameEn: 'english', nameKn: 'ಇಂಗ್ಲಿಷ್ ಸಂವಹನ' },
    { nameEn: 'dmlt', nameKn: 'ಡಿಎಂಎಲ್‌ಟಿ' },
    { nameEn: 'nursing', nameKn: 'ಶುಶ್ರೂಷೆ (ನರ್ಸಿಂಗ್)' },
    { nameEn: 'heavy driving', nameKn: 'ಭಾರಿ ವಾಹನ ಚಾಲನೆ' },
    { nameEn: 'dairy processing', nameKn: 'ಹೈನುಗಾರಿಕೆ ಸಂಸ್ಕರಣೆ' },
  ];

  for (const s of baseSkills) {
    await prisma.skill.upsert({
      where: { nameEn: s.nameEn },
      update: {},
      create: s,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
