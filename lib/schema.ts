import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Re-exported type aliases for status columns so call sites get autocomplete.
export type SendStatus = "active" | "paused" | "cancelled";
export type SendLogStatus = "success" | "failed" | "skipped";

export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").unique().notNull(),
  email: text("email").notNull(),
  name: text("name"),
  timezone: text("timezone").default("America/New_York"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceProfiles = pgTable("voice_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  rawEmails: text("raw_emails").array(),
  sentenceLength: text("sentence_length"),
  punctuationPatterns: text("punctuation_patterns"),
  openingStyle: text("opening_style"),
  closingStyle: text("closing_style"),
  vocabularyRegister: text("vocabulary_register"),
  pronounUsage: text("pronoun_usage"),
  storytellingPatterns: text("storytelling_patterns"),
  ctaStyle: text("cta_style"),
  fullProfileJson: jsonb("full_profile_json"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cohorts = pgTable(
  "cohorts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    programName: text("program_name").notNull(),
    curriculumSummary: text("curriculum_summary").notNull(),
    sequenceType: text("sequence_type").default("launch"),
    cohortStartDate: date("cohort_start_date"),
    cartOpenDate: date("cart_open_date"),
    cartCloseDate: date("cart_close_date"),
    seatCount: integer("seat_count"),
    priceUsd: integer("price_usd"),
    kajabiProductId: text("kajabi_product_id"),
    status: text("status").default("draft"),
    // Kill switch for the scheduled-send cron. "active" | "paused" | "cancelled"
    sendStatus: text("send_status").$type<SendStatus>().default("active"),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("cohorts_teacher_id_idx").on(t.teacherId)]
);

export const emailSequences = pgTable("email_sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  cohortId: uuid("cohort_id")
    .notNull()
    .references(() => cohorts.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emails = pgTable(
  "emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => emailSequences.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    emailType: text("email_type").notNull(),
    subjectLine: text("subject_line").notNull(),
    previewText: text("preview_text"),
    bodyHtml: text("body_html").notNull(),
    scheduledSendAt: timestamp("scheduled_send_at", { withTimezone: true }),
    approvalStatus: text("approval_status").default("draft"),
    convertkitBroadcastId: text("convertkit_broadcast_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("emails_sequence_id_idx").on(t.sequenceId)]
);

export const emailVariants = pgTable(
  "email_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    emailId: uuid("email_id")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),
    variantType: text("variant_type").notNull(),
    subjectLine: text("subject_line").notNull(),
    previewText: text("preview_text"),
    bodyHtml: text("body_html").notNull(),
    isSelected: boolean("is_selected").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("email_variants_email_id_idx").on(t.emailId)]
);

export const sendLog = pgTable(
  "send_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    // Nullable: if the email row is later deleted we keep the log entry.
    emailId: uuid("email_id").references(() => emails.id, { onDelete: "set null" }),
    sequencePosition: integer("sequence_position"),
    // "convertkit" | "webhook" | "kajabi"
    esp: text("esp").notNull(),
    // "success" | "failed" | "skipped"
    status: text("status").$type<SendLogStatus>().notNull(),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("send_log_cohort_id_idx").on(t.cohortId)]
);

export const platformConnections = pgTable(
  "platform_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    // Kit rows: API key. Kajabi rows: OAuth client_id.
    accessToken: text("access_token").notNull(),
    // Kajabi only: OAuth client_secret. Null for Kit rows.
    clientSecret: text("client_secret"),
    accountName: text("account_name"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("platform_connections_teacher_id_idx").on(t.teacherId)]
);
