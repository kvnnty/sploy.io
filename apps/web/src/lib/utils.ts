import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { notion } from "./notion";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getNotionDatabaseRowCount(databaseId: string) {
  try {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    if (!("data_sources" in db) || !db.data_sources[0]?.id) {
      throw new Error("Database has no data_sources");
    }
    const dataSourceId = db.data_sources[0].id;

    let allResults: unknown[] = [];
    let hasMore = true;
    let startCursor: string | null = null;

    while (hasMore) {
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: startCursor ?? undefined,
        page_size: 100,
      });

      allResults = allResults.concat(response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return allResults.length;
  } catch (error) {
    console.error("Error fetching database rows:", error);
    throw error;
  }
}

const REFERRAL_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(length = 8): string {
  let code = "";
  const charsetLength = REFERRAL_CODE_CHARSET.length;

  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * charsetLength);
    code += REFERRAL_CODE_CHARSET[index];
  }

  return code;
}
