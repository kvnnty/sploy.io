import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_SECRET,
});

export const NOTION_DB_ID = process.env.NOTION_DB_ID || "";

let cachedWaitlistDataSourceId: string | null = null;

/** First data source for the waitlist database (Notion API 2025-09+). */
export async function getWaitlistDataSourceId(): Promise<string> {
  if (cachedWaitlistDataSourceId) return cachedWaitlistDataSourceId;
  if (!NOTION_DB_ID) throw new Error("NOTION_DB_ID is not set");

  const db = await notion.databases.retrieve({ database_id: NOTION_DB_ID });
  if (!("data_sources" in db) || !db.data_sources[0]?.id) {
    throw new Error("Notion database has no data_sources; check integration access");
  }
  const id = db.data_sources[0].id;
  cachedWaitlistDataSourceId = id;
  return id;
}
