import { LandingPage } from "@/components/landing/landing-page";
import { getNotionDatabaseRowCount } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  let waitlistPeople = 0;

  try {
    if (process.env.NOTION_DB_ID) {
      waitlistPeople = await getNotionDatabaseRowCount(
        process.env.NOTION_DB_ID,
      );
    }
  } catch {}

  return <LandingPage waitlistPeople={waitlistPeople} />;
}
