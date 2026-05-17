CREATE TABLE "citizen_services_v1" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" text NOT NULL,
	"keywords" text NOT NULL,
	"department_name" text NOT NULL,
	"eligibility" text,
	"required_documents" text,
	"full_guide_text" text NOT NULL,
	"official_link" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
