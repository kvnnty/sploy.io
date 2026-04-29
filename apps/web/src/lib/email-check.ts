import { getWaitlistDataSourceId, notion } from "./notion";

export async function checkEmailExists(email: string) {
  const dataSourceId = await getWaitlistDataSourceId();
  const existing = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { property: "Email", email: { equals: email } },
  });
  return existing.results.length > 0;
}