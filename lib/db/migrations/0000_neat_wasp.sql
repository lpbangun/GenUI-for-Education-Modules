CREATE TABLE "dictionary_handoff_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"term" text NOT NULL,
	"school_self_reported" text,
	"agreement" text NOT NULL,
	"free_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wiki_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"term" text NOT NULL,
	"school" text NOT NULL,
	"how_we_use_it" text NOT NULL,
	"example_in_practice" text,
	"differs_from_other_schools" text,
	"quality_score" integer,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
