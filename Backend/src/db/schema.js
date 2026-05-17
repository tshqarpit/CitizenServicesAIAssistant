const { pgTable, uuid, text, timestamp } = require('drizzle-orm/pg-core');

const citizenServicesV1 = pgTable('citizen_services_v1', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceName: text('service_name').notNull(),
  keywords: text('keywords').notNull(),
  departmentName: text('department_name').notNull(),
  eligibility: text('eligibility'),
  requiredDocuments: text('required_documents'),
  fullGuideText: text('full_guide_text').notNull(),
  officialLink: text('official_link'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

module.exports = {
  citizenServicesV1
};
