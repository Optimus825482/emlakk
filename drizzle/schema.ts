import { pgTable, index, foreignKey, uuid, varchar, text, integer, boolean, timestamp, jsonb, numeric, unique, date, time, bigserial, bigint, check, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const aiProvider = pgEnum("ai_provider", ['deepseek', 'openai', 'anthropic', 'google-gemini', 'openrouter'])
export const appointmentStatus = pgEnum("appointment_status", ['pending', 'confirmed', 'completed', 'cancelled'])
export const appointmentType = pgEnum("appointment_type", ['kahve', 'property_visit', 'valuation', 'consultation'])
export const collectedCategory = pgEnum("collected_category", ['konut', 'isyeri', 'arsa', 'bina'])
export const collectedStatus = pgEnum("collected_status", ['pending', 'approved', 'rejected', 'duplicate'])
export const collectedTransaction = pgEnum("collected_transaction", ['satilik', 'kiralik', 'devren-satilik', 'devren-kiralik', 'kat-karsiligi'])
export const contactSource = pgEnum("contact_source", ['website', 'listing', 'valuation', 'whatsapp', 'phone'])
export const contactStatus = pgEnum("contact_status", ['new', 'read', 'replied', 'archived'])
export const contentSectionType = pgEnum("content_section_type", ['hero', 'about', 'services', 'team', 'testimonials', 'faq', 'cta', 'stats', 'features', 'page'])
export const listingStatus = pgEnum("listing_status", ['active', 'sold', 'pending', 'draft'])
export const listingType = pgEnum("listing_type", ['sanayi', 'tarim', 'konut', 'ticari', 'arsa'])
export const notificationType = pgEnum("notification_type", ['appointment', 'contact', 'valuation', 'listing', 'system'])
export const smtpEncryption = pgEnum("smtp_encryption", ['none', 'ssl', 'tls'])
export const transactionType = pgEnum("transaction_type", ['sale', 'rent'])
export const valuationPropertyType = pgEnum("valuation_property_type", ['sanayi', 'tarim', 'konut', 'ticari', 'arsa'])
export const workflowStatus = pgEnum("workflow_status", ['pending', 'running', 'completed', 'failed'])


export const listingViews = pgTable("listing_views", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	listingId: uuid("listing_id").notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	referrer: text(),
	visitorId: varchar("visitor_id", { length: 64 }),
	sessionId: varchar("session_id", { length: 64 }),
	deviceType: varchar("device_type", { length: 20 }),
	browser: varchar({ length: 50 }),
	os: varchar({ length: 50 }),
	screenResolution: varchar("screen_resolution", { length: 20 }),
	country: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	region: varchar({ length: 100 }),
	utmSource: varchar("utm_source", { length: 100 }),
	utmMedium: varchar("utm_medium", { length: 100 }),
	utmCampaign: varchar("utm_campaign", { length: 100 }),
	duration: integer(),
	scrollDepth: integer("scroll_depth"),
	clickedPhone: boolean("clicked_phone").default(false),
	clickedWhatsapp: boolean("clicked_whatsapp").default(false),
	clickedEmail: boolean("clicked_email").default(false),
	clickedMap: boolean("clicked_map").default(false),
	clickedGallery: boolean("clicked_gallery").default(false),
	clickedShare: boolean("clicked_share").default(false),
	addedToFavorites: boolean("added_to_favorites").default(false),
	requestedAppointment: boolean("requested_appointment").default(false),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("listing_views_listing_id_idx").using("btree", table.listingId.asc().nullsLast().op("uuid_ops")),
	index("listing_views_viewed_at_idx").using("btree", table.viewedAt.asc().nullsLast().op("timestamp_ops")),
	index("listing_views_visitor_id_idx").using("btree", table.visitorId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "listing_views_listing_id_listings_id_fk"
		}).onDelete("cascade"),
]);

export const listingDailyStats = pgTable("listing_daily_stats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	listingId: uuid("listing_id").notNull(),
	date: varchar({ length: 10 }).notNull(),
	views: integer().default(0),
	uniqueVisitors: integer("unique_visitors").default(0),
	avgDuration: integer("avg_duration").default(0),
	avgScrollDepth: integer("avg_scroll_depth").default(0),
	mobileViews: integer("mobile_views").default(0),
	desktopViews: integer("desktop_views").default(0),
	tabletViews: integer("tablet_views").default(0),
	phoneClicks: integer("phone_clicks").default(0),
	whatsappClicks: integer("whatsapp_clicks").default(0),
	emailClicks: integer("email_clicks").default(0),
	mapClicks: integer("map_clicks").default(0),
	galleryClicks: integer("gallery_clicks").default(0),
	shareClicks: integer("share_clicks").default(0),
	favoriteAdds: integer("favorite_adds").default(0),
	appointmentRequests: integer("appointment_requests").default(0),
	trafficSources: jsonb("traffic_sources"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("listing_daily_stats_listing_date_idx").using("btree", table.listingId.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "listing_daily_stats_listing_id_listings_id_fk"
		}).onDelete("cascade"),
]);

export const valuations = pgTable("valuations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	propertyType: valuationPropertyType("property_type").notNull(),
	address: text().notNull(),
	city: varchar({ length: 100 }).default('Hendek').notNull(),
	district: varchar({ length: 100 }),
	area: integer().notNull(),
	details: jsonb(),
	estimatedValue: numeric("estimated_value", { precision: 15, scale:  2 }),
	minValue: numeric("min_value", { precision: 15, scale:  2 }),
	maxValue: numeric("max_value", { precision: 15, scale:  2 }),
	pricePerSqm: numeric("price_per_sqm", { precision: 10, scale:  2 }),
	confidenceScore: integer("confidence_score"),
	marketAnalysis: text("market_analysis"),
	comparables: jsonb(),
	trends: jsonb(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const contentSections = pgTable("content_sections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	type: contentSectionType().notNull(),
	title: varchar({ length: 255 }),
	subtitle: text(),
	content: text(),
	image: text(),
	images: jsonb(),
	data: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: varchar("sort_order", { length: 10 }).default('0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("content_sections_key_unique").on(table.key),
]);

export const homepageSections = pgTable("homepage_sections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	isVisible: boolean("is_visible").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("homepage_sections_key_unique").on(table.key),
]);

export const teamMembers = pgTable("team_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	bio: text(),
	image: text(),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	socialMedia: jsonb("social_media"),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: varchar("sort_order", { length: 10 }).default('0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const hendekOsbStats = pgTable("hendek_osb_stats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	year: integer().notNull(),
	totalArea: integer("total_area"),
	totalParcels: integer("total_parcels"),
	allocatedParcels: integer("allocated_parcels"),
	activeCompanies: integer("active_companies"),
	productionParcels: integer("production_parcels"),
	currentEmployment: integer("current_employment"),
	targetEmployment: integer("target_employment"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const hendekPopulationHistory = pgTable("hendek_population_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	year: integer().notNull(),
	totalPopulation: integer("total_population").notNull(),
	malePopulation: integer("male_population"),
	femalePopulation: integer("female_population"),
	growthRate: numeric("growth_rate", { precision: 5, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("hendek_population_history_year_unique").on(table.year),
]);

export const hendekStats = pgTable("hendek_stats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	value: varchar({ length: 100 }).notNull(),
	numericValue: integer("numeric_value"),
	unit: varchar({ length: 50 }),
	description: text(),
	icon: varchar({ length: 50 }),
	color: varchar({ length: 50 }),
	source: varchar({ length: 255 }),
	sourceUrl: text("source_url"),
	year: integer(),
	isActive: boolean("is_active").default(true).notNull(),
	showOnHomepage: boolean("show_on_homepage").default(true).notNull(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("hendek_stats_key_unique").on(table.key),
]);

export const companyPrinciples = pgTable("company_principles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	icon: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const founderProfile = pgTable("founder_profile", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	image: text(),
	badgeText: varchar("badge_text", { length: 100 }),
	heroTitle: text("hero_title"),
	heroTitleHighlight: text("hero_title_highlight"),
	narrativeTitle: varchar("narrative_title", { length: 255 }),
	narrativeParagraph1: text("narrative_paragraph_1"),
	narrativeParagraph2: text("narrative_paragraph_2"),
	narrativeDividerText: varchar("narrative_divider_text", { length: 100 }),
	heritageTitle: varchar("heritage_title", { length: 100 }),
	heritageText: text("heritage_text"),
	visionTitle: varchar("vision_title", { length: 100 }),
	visionText: text("vision_text"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const manifesto = pgTable("manifesto", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shortTitle: varchar("short_title", { length: 255 }),
	shortText: text("short_text"),
	fullTitle: varchar("full_title", { length: 255 }),
	fullText: text("full_text"),
	signature: varchar({ length: 255 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const visionPillars = pgTable("vision_pillars", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	icon: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const listings = pgTable("listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	type: listingType().notNull(),
	status: listingStatus().default('draft').notNull(),
	transactionType: transactionType("transaction_type").default('sale').notNull(),
	address: text().notNull(),
	city: varchar({ length: 100 }).default('Hendek').notNull(),
	district: varchar({ length: 100 }),
	neighborhood: varchar({ length: 100 }),
	latitude: numeric({ precision: 10, scale:  8 }),
	longitude: numeric({ precision: 11, scale:  8 }),
	area: integer().notNull(),
	price: numeric({ precision: 15, scale:  2 }).notNull(),
	pricePerSqm: numeric("price_per_sqm", { precision: 10, scale:  2 }),
	features: jsonb(),
	aiScore: integer("ai_score"),
	aiInsight: text("ai_insight"),
	roiEstimate: numeric("roi_estimate", { precision: 5, scale:  2 }),
	images: jsonb().default([]),
	thumbnail: text(),
	videoUrl: text("video_url"),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: text("meta_description"),
	isFeatured: boolean("is_featured").default(false).notNull(),
	isNew: boolean("is_new").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	soldAt: timestamp("sold_at", { mode: 'string' }),
}, (table) => [
	unique("listings_slug_unique").on(table.slug),
]);

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_token_unique").on(table.token),
]);

export const appointments = pgTable("appointments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	type: appointmentType().notNull(),
	status: appointmentStatus().default('pending').notNull(),
	date: date().notNull(),
	time: time().notNull(),
	listingId: uuid("listing_id"),
	message: text(),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "appointments_listing_id_listings_id_fk"
		}).onDelete("set null"),
]);

export const contacts = pgTable("contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	subject: varchar({ length: 255 }),
	message: text().notNull(),
	source: contactSource().default('website').notNull(),
	status: contactStatus().default('new').notNull(),
	listingId: uuid("listing_id"),
	adminReply: text("admin_reply"),
	repliedAt: timestamp("replied_at", { mode: 'string' }),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	isSpam: boolean("is_spam").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.listingId],
			foreignColumns: [listings.id],
			name: "contacts_listing_id_listings_id_fk"
		}).onDelete("set null"),
]);

export const systemSettings = pgTable("system_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	aiProvider: aiProvider("ai_provider").default('deepseek').notNull(),
	aiModel: varchar("ai_model", { length: 100 }).default('deepseek-chat').notNull(),
	aiApiKey: text("ai_api_key"),
	aiApiKeyValid: boolean("ai_api_key_valid").default(false),
	aiApiKeyLastChecked: timestamp("ai_api_key_last_checked", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteName: varchar("site_name", { length: 255 }).default('Demir Gayrimenkul').notNull(),
	siteTagline: varchar("site_tagline", { length: 500 }),
	logo: text(),
	favicon: text(),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	whatsapp: varchar({ length: 20 }),
	address: text(),
	mapEmbedUrl: text("map_embed_url"),
	socialMedia: jsonb("social_media"),
	workingHours: jsonb("working_hours"),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: text("meta_description"),
	metaKeywords: text("meta_keywords"),
	footerText: text("footer_text"),
	copyrightText: varchar("copyright_text", { length: 255 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	googleAnalyticsId: varchar("google_analytics_id", { length: 50 }),
	googleSearchConsoleCode: varchar("google_search_console_code", { length: 100 }),
});

export const workflowLogs = pgTable("workflow_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workflowName: varchar("workflow_name", { length: 100 }).notNull(),
	workflowId: varchar("workflow_id", { length: 255 }),
	status: workflowStatus().default('pending').notNull(),
	entityType: varchar("entity_type", { length: 50 }),
	entityId: uuid("entity_id"),
	result: jsonb(),
	error: text(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
});

export const pageContents = pgTable("page_contents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageSlug: varchar("page_slug", { length: 100 }).notNull(),
	sectionKey: varchar("section_key", { length: 100 }).notNull(),
	title: text(),
	subtitle: text(),
	description: text(),
	content: text(),
	image: text(),
	icon: varchar({ length: 50 }),
	buttonText: varchar("button_text", { length: 100 }),
	buttonLink: varchar("button_link", { length: 255 }),
	buttonIcon: varchar("button_icon", { length: 50 }),
	metadata: jsonb(),
	isVisible: boolean("is_visible").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const pageSections = pgTable("page_sections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageSlug: varchar("page_slug", { length: 100 }).notNull(),
	sectionKey: varchar("section_key", { length: 100 }).notNull(),
	sectionName: varchar("section_name", { length: 100 }).notNull(),
	sectionType: varchar("section_type", { length: 50 }).notNull(),
	isVisible: boolean("is_visible").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: text().notNull(),
	name: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).default('user').notNull(),
	phone: varchar({ length: 20 }),
	avatar: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	username: varchar({ length: 50 }),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_username_key").on(table.username),
]);

export const seoLogs = pgTable("seo_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: varchar("entity_id", { length: 255 }).notNull(),
	action: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	input: jsonb(),
	output: jsonb(),
	error: text(),
	aiModel: varchar("ai_model", { length: 100 }),
	tokensUsed: integer("tokens_used"),
	processingTime: integer("processing_time"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const emailSettings = pgTable("email_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	smtpHost: varchar("smtp_host", { length: 255 }),
	smtpPort: integer("smtp_port").default(587),
	smtpEncryption: smtpEncryption("smtp_encryption").default('tls'),
	smtpUsername: varchar("smtp_username", { length: 255 }),
	smtpPassword: text("smtp_password"),
	fromEmail: varchar("from_email", { length: 255 }),
	fromName: varchar("from_name", { length: 255 }).default('Demir Gayrimenkul'),
	replyToEmail: varchar("reply_to_email", { length: 255 }),
	isActive: boolean("is_active").default(false).notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	lastTestedAt: timestamp("last_tested_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: notificationType().notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	entityType: varchar("entity_type", { length: 50 }),
	entityId: uuid("entity_id"),
	isRead: boolean("is_read").default(false).notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const seoMetadata = pgTable("seo_metadata", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: varchar("entity_id", { length: 255 }).notNull(),
	entityTitle: varchar("entity_title", { length: 500 }),
	metaTitle: varchar("meta_title", { length: 70 }),
	metaDescription: text("meta_description"),
	canonicalUrl: text("canonical_url"),
	ogTitle: varchar("og_title", { length: 95 }),
	ogDescription: text("og_description"),
	ogImage: text("og_image"),
	ogType: varchar("og_type", { length: 50 }).default('website'),
	twitterCard: varchar("twitter_card", { length: 50 }).default('summary_large_image'),
	twitterTitle: varchar("twitter_title", { length: 70 }),
	twitterDescription: text("twitter_description"),
	twitterImage: text("twitter_image"),
	keywords: jsonb(),
	focusKeyword: varchar("focus_keyword", { length: 100 }),
	structuredData: jsonb("structured_data"),
	seoScore: integer("seo_score"),
	seoAnalysis: jsonb("seo_analysis"),
	isAiGenerated: boolean("is_ai_generated").default(false),
	aiModel: varchar("ai_model", { length: 100 }),
	lastAiUpdate: timestamp("last_ai_update", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const seoSettings = pgTable("seo_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteName: varchar("site_name", { length: 255 }),
	siteDescription: text("site_description"),
	defaultOgImage: text("default_og_image"),
	twitterHandle: varchar("twitter_handle", { length: 50 }),
	facebookAppId: varchar("facebook_app_id", { length: 100 }),
	robotsTxt: text("robots_txt"),
	sitemapEnabled: boolean("sitemap_enabled").default(true),
	autoGenerateSeo: boolean("auto_generate_seo").default(true),
	seoLanguage: varchar("seo_language", { length: 10 }).default('tr'),
	targetRegion: varchar("target_region", { length: 100 }).default('Hendek, Sakarya'),
	industryKeywords: jsonb("industry_keywords"),
	googleSiteVerification: varchar("google_site_verification", { length: 100 }),
	googleAnalyticsId: varchar("google_analytics_id", { length: 50 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const collectedListings = pgTable("collected_listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sourceId: varchar("source_id", { length: 50 }).notNull(),
	sourceUrl: text("source_url").notNull(),
	title: varchar({ length: 500 }).notNull(),
	price: varchar({ length: 100 }),
	priceValue: numeric("price_value", { precision: 15, scale:  2 }),
	location: text(),
	date: varchar({ length: 50 }),
	category: collectedCategory().notNull(),
	transactionType: collectedTransaction("transaction_type").notNull(),
	status: collectedStatus().default('pending').notNull(),
	thumbnail: text(),
	images: jsonb().default([]),
	description: text(),
	features: jsonb(),
	area: integer(),
	crawledAt: timestamp("crawled_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	listingId: uuid("listing_id"),
	notes: text(),
});

export const miningLogs = pgTable("mining_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	jobId: uuid("job_id"),
	level: text(),
	message: text(),
	data: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const miningJobs = pgTable("mining_jobs", {
	id: uuid().primaryKey().notNull(),
	jobId: text("job_id"),
	category: text(),
	transaction: text(),
	status: text(),
	totalPages: integer("total_pages"),
	processedPages: integer("processed_pages"),
	totalListings: integer("total_listings"),
	newListings: integer("new_listings"),
	updatedListings: integer("updated_listings"),
	removedListings: integer("removed_listings"),
	duplicates: integer(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	jobType: text("job_type"),
	errorMessage: text("error_message"),
	config: jsonb(),
	stats: jsonb(),
	progress: jsonb(),
	source: text(),
	error: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const newListings = pgTable("new_listings", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	listingId: bigint("listing_id", { mode: "number" }),
	baslik: text(),
	link: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fiyat: bigint({ mode: "number" }),
	konum: text(),
	category: text(),
	transaction: text(),
	resim: text(),
	firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("new_listings_listing_id_key").on(table.listingId),
]);

export const removedListings = pgTable("removed_listings", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	listingId: bigint("listing_id", { mode: "number" }),
	baslik: text(),
	link: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lastPrice: bigint("last_price", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fiyat: bigint({ mode: "number" }),
	konum: text(),
	category: text(),
	transaction: text(),
	resim: text(),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: 'string' }),
	removedAt: timestamp("removed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	removalReason: text("removal_reason"),
	daysActive: integer("days_active"),
	priceChanges: integer("price_changes").default(0),
	notes: text(),
}, (table) => [
	unique("removed_listings_listing_id_key").on(table.listingId),
]);

export const categoryStats = pgTable("category_stats", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	category: text(),
	transaction: text(),
	sahibindenCount: integer("sahibinden_count"),
	databaseCount: integer("database_count"),
	diff: integer(),
	status: text(),
	lastCheckedAt: timestamp("last_checked_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("category_stats_category_transaction_key").on(table.category, table.transaction),
]);

export const sahibindenListe = pgTable("sahibinden_liste", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	baslik: text(),
	link: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fiyat: bigint({ mode: "number" }),
	konum: text(),
	tarih: text(),
	resim: text(),
	category: text(),
	transaction: text(),
	crawledAt: timestamp("crawled_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	koordinatlar: jsonb(),
	satici: text(),
	ilanNo: text("ilan_no"),
	m2: text(),
	resimSayisi: integer("resim_sayisi"),
	detayHatasi: text("detay_hatasi"),
	detayCekildi: boolean("detay_cekildi").default(false),
	detayTarihi: timestamp("detay_tarihi", { withTimezone: true, mode: 'string' }),
	aciklama: text(),
	ozellikler: jsonb(),
	ekOzellikler: jsonb("ek_ozellikler"),
	icOzellikler: jsonb("ic_ozellikler"),
	disOzellikler: jsonb("dis_ozellikler"),
	konumOzellikleri: jsonb("konum_ozellikleri"),
	cephe: text(),
	resimler: jsonb(),
	ilce: varchar({ length: 255 }),
	semt: varchar({ length: 100 }),
	mahalle: varchar({ length: 200 }),
}, (table) => [
	index("idx_sahibinden_liste_ilce_semt").using("btree", table.ilce.asc().nullsLast().op("text_ops"), table.semt.asc().nullsLast().op("text_ops")),
	index("idx_sahibinden_liste_mahalle").using("btree", table.mahalle.asc().nullsLast().op("text_ops")),
	index("idx_sahibinden_liste_semt").using("btree", table.semt.asc().nullsLast().op("text_ops")),
]);

export const scheduledTasks = pgTable("scheduled_tasks", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	schedule: text().notNull(),
	lastRun: timestamp("last_run", { mode: 'string' }),
	nextRun: timestamp("next_run", { mode: 'string' }),
	enabled: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const systemConfigs = pgTable("system_configs", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	value: text().notNull(),
	description: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("system_configs_key_unique").on(table.key),
]);

export const agents = pgTable("agents", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	status: text().default('IDLE').notNull(),
	currentTask: text("current_task"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("agents_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("agents_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const agentActivities = pgTable("agent_activities", {
	id: text().primaryKey().notNull(),
	agentId: text("agent_id").notNull(),
	action: text().notNull(),
	details: text(),
	status: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("agent_activities_agent_id_idx").using("btree", table.agentId.asc().nullsLast().op("text_ops")),
	index("agent_activities_timestamp_idx").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "agent_activities_agent_id_agents_id_fk"
		}),
]);

export const agentReports = pgTable("agent_reports", {
	id: text().primaryKey().notNull(),
	agentId: text("agent_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	reportType: text("report_type").default('DETAILED').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("agent_reports_agent_id_idx").using("btree", table.agentId.asc().nullsLast().op("text_ops")),
	index("agent_reports_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "agent_reports_agent_id_agents_id_fk"
		}),
]);

export const conversations = pgTable("conversations", {
	id: text().primaryKey().notNull(),
	agentId: text("agent_id").notNull(),
	sender: text().notNull(),
	message: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("conversations_agent_id_idx").using("btree", table.agentId.asc().nullsLast().op("text_ops")),
	index("conversations_timestamp_idx").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "conversations_agent_id_agents_id_fk"
		}),
]);

export const facebookPosts = pgTable("facebook_posts", {
	id: text().primaryKey().notNull(),
	facebookId: text("facebook_id").notNull(),
	platform: text().default('FACEBOOK').notNull(),
	content: text().notNull(),
	author: text().notNull(),
	likes: integer().default(0).notNull(),
	shares: integer().default(0).notNull(),
	comments: integer().default(0).notNull(),
	postDate: timestamp("post_date", { mode: 'string' }).notNull(),
	location: text().default('SAKARYA_HENDEK').notNull(),
	category: text().default('EMLAK').notNull(),
	rawJson: jsonb("raw_json"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("facebook_posts_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("facebook_posts_location_idx").using("btree", table.location.asc().nullsLast().op("text_ops")),
	index("facebook_posts_post_date_idx").using("btree", table.postDate.asc().nullsLast().op("timestamp_ops")),
	unique("facebook_posts_facebook_id_unique").on(table.facebookId),
]);

export const postAnalyses = pgTable("post_analyses", {
	id: text().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	agentId: text("agent_id").notNull(),
	analysis: text().notNull(),
	sentiment: text().notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	location: text(),
	propertyType: text("property_type"),
	confidence: numeric({ precision: 5, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("post_analyses_agent_id_idx").using("btree", table.agentId.asc().nullsLast().op("text_ops")),
	index("post_analyses_post_id_idx").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [facebookPosts.id],
			name: "post_analyses_post_id_facebook_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "post_analyses_agent_id_agents_id_fk"
		}),
]);

export const pageSeo = pgTable("page_seo", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pagePath: varchar("page_path", { length: 255 }).notNull(),
	pageTitle: varchar("page_title", { length: 255 }).notNull(),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: text("meta_description"),
	metaKeywords: text("meta_keywords"),
	canonicalUrl: text("canonical_url"),
	ogTitle: varchar("og_title", { length: 255 }),
	ogDescription: text("og_description"),
	ogImage: text("og_image"),
	ogType: varchar("og_type", { length: 50 }).default('website'),
	twitterCard: varchar("twitter_card", { length: 50 }).default('summary_large_image'),
	twitterTitle: varchar("twitter_title", { length: 255 }),
	twitterDescription: text("twitter_description"),
	twitterImage: text("twitter_image"),
	structuredData: jsonb("structured_data"),
	focusKeyword: varchar("focus_keyword", { length: 100 }),
	seoScore: integer("seo_score"),
	seoAnalysis: jsonb("seo_analysis"),
	isActive: boolean("is_active").default(true).notNull(),
	isAiGenerated: boolean("is_ai_generated").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("page_seo_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("page_seo_path_idx").using("btree", table.pagePath.asc().nullsLast().op("text_ops")),
	unique("page_seo_page_path_unique").on(table.pagePath),
]);

export const aiMemory = pgTable("ai_memory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	memoryType: varchar("memory_type", { length: 50 }).notNull(),
	category: varchar({ length: 100 }).notNull(),
	content: text().notNull(),
	summary: text(),
	context: jsonb().default({}),
	tags: text().array().default([""]),
	importanceScore: integer("importance_score").default(50),
	accessCount: integer("access_count").default(0),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }),
	relatedMemoryIds: uuid("related_memory_ids").array().default([""]),
	sourceType: varchar("source_type", { length: 50 }),
	sourceId: varchar("source_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	index("idx_ai_memory_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_ai_memory_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_ai_memory_importance").using("btree", table.importanceScore.desc().nullsFirst().op("int4_ops")),
	index("idx_ai_memory_tags").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	check("ai_memory_importance_score_check", sql`(importance_score >= 0) AND (importance_score <= 100)`),
]);

export const aiConversations = pgTable("ai_conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: varchar("session_id", { length: 255 }).notNull(),
	userId: uuid("user_id"),
	messages: jsonb().default([]),
	context: jsonb().default({}),
	agentType: varchar("agent_type", { length: 50 }).default('command_center'),
	totalMessages: integer("total_messages").default(0),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ai_conversations_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("idx_ai_conversations_updated").using("btree", table.updatedAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_ai_conversations_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	unique("ai_conversations_session_id_key").on(table.sessionId),
]);

export const aiTasks = pgTable("ai_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskType: varchar("task_type", { length: 50 }).notNull(),
	status: varchar({ length: 20 }).default('pending'),
	input: jsonb().notNull(),
	output: jsonb(),
	error: text(),
	executionTimeMs: integer("execution_time_ms"),
	userId: uuid("user_id"),
	sessionId: varchar("session_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	index("idx_ai_tasks_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_ai_tasks_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("idx_ai_tasks_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const aiAgentLogs = pgTable("ai_agent_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agentType: varchar("agent_type", { length: 50 }).notNull(),
	action: varchar({ length: 100 }).notNull(),
	input: jsonb(),
	output: jsonb(),
	durationMs: integer("duration_ms"),
	success: boolean().default(true),
	error: text(),
	userId: uuid("user_id"),
	sessionId: varchar("session_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ai_agent_logs_agent").using("btree", table.agentType.asc().nullsLast().op("text_ops")),
	index("idx_ai_agent_logs_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_ai_agent_logs_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
]);

export const commandHistory = pgTable("command_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	sessionId: varchar("session_id", { length: 255 }),
	command: text().notNull(),
	commandType: varchar("command_type", { length: 50 }),
	response: text(),
	success: boolean().default(true),
	executionTimeMs: integer("execution_time_ms"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_command_history_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_command_history_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("idx_command_history_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const aiInsightsCache = pgTable("ai_insights_cache", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cacheKey: varchar("cache_key", { length: 255 }).notNull(),
	cacheType: varchar("cache_type", { length: 50 }).notNull(),
	data: jsonb().notNull(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("idx_ai_insights_cache_expires").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_ai_insights_cache_key").using("btree", table.cacheKey.asc().nullsLast().op("text_ops")),
	unique("ai_insights_cache_cache_key_key").on(table.cacheKey),
]);

export const neighborhoods = pgTable("neighborhoods", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	district: text(),
	name: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});
