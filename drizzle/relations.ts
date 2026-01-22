import { relations } from "drizzle-orm/relations";
import { listings, listingViews, listingDailyStats, users, sessions, appointments, contacts, agents, agentActivities, agentReports, conversations, facebookPosts, postAnalyses } from "./schema";

export const listingViewsRelations = relations(listingViews, ({one}) => ({
	listing: one(listings, {
		fields: [listingViews.listingId],
		references: [listings.id]
	}),
}));

export const listingsRelations = relations(listings, ({many}) => ({
	listingViews: many(listingViews),
	listingDailyStats: many(listingDailyStats),
	appointments: many(appointments),
	contacts: many(contacts),
}));

export const listingDailyStatsRelations = relations(listingDailyStats, ({one}) => ({
	listing: one(listings, {
		fields: [listingDailyStats.listingId],
		references: [listings.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
}));

export const appointmentsRelations = relations(appointments, ({one}) => ({
	listing: one(listings, {
		fields: [appointments.listingId],
		references: [listings.id]
	}),
}));

export const contactsRelations = relations(contacts, ({one}) => ({
	listing: one(listings, {
		fields: [contacts.listingId],
		references: [listings.id]
	}),
}));

export const agentActivitiesRelations = relations(agentActivities, ({one}) => ({
	agent: one(agents, {
		fields: [agentActivities.agentId],
		references: [agents.id]
	}),
}));

export const agentsRelations = relations(agents, ({many}) => ({
	agentActivities: many(agentActivities),
	agentReports: many(agentReports),
	conversations: many(conversations),
	postAnalyses: many(postAnalyses),
}));

export const agentReportsRelations = relations(agentReports, ({one}) => ({
	agent: one(agents, {
		fields: [agentReports.agentId],
		references: [agents.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one}) => ({
	agent: one(agents, {
		fields: [conversations.agentId],
		references: [agents.id]
	}),
}));

export const postAnalysesRelations = relations(postAnalyses, ({one}) => ({
	facebookPost: one(facebookPosts, {
		fields: [postAnalyses.postId],
		references: [facebookPosts.id]
	}),
	agent: one(agents, {
		fields: [postAnalyses.agentId],
		references: [agents.id]
	}),
}));

export const facebookPostsRelations = relations(facebookPosts, ({many}) => ({
	postAnalyses: many(postAnalyses),
}));