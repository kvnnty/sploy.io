import { NextResponse } from "next/server";
import { getWaitlistDataSourceId, notion } from "@/lib/notion";
import { generateCode } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { email, firstname, referredBy } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const dataSourceId = await getWaitlistDataSourceId();

    const existing = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "Email",
        email: { equals: email },
      },
    });

    if (existing.results.length > 0) {
      return NextResponse.json(
        { error: "You're already on the waitlist!" },
        { status: 409 },
      );
    }

    const code = generateCode();

    let referrerPageId: string | null = null;
    if (referredBy) {
      const results = await notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: {
          property: "Referral Code",
          rich_text: { equals: referredBy },
        },
      });

      if (results.results.length > 0) {
        referrerPageId = results.results[0].id;
      }
    }

    const page = await notion.pages.create({
      parent: { data_source_id: dataSourceId },
      properties: {
        Name: {
          title: [{ text: { content: firstname || email.split("@")[0] } }],
        },
        Email: { email },
        "Referral Code": {
          rich_text: [{ text: { content: code } }],
        },
        "Referred By": referredBy
          ? { rich_text: [{ text: { content: referredBy } }] }
          : { rich_text: [] },
        Referrer: referrerPageId
          ? { relation: [{ id: referrerPageId }] }
          : { relation: [] },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Added to waitlist",
        code,
        notionId: page.id,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Notion API error:", error.message);

      return NextResponse.json(
        {
          error: "Failed to save to Notion",
          details: error.message,
          success: false,
        },
        { status: 500 },
      );
    }
  }
}
