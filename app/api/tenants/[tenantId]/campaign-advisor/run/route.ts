import { NextRequest, NextResponse } from "next/server";
import type { CampaignObjective } from "@prisma/client";
import { runCampaignLaunchAdvisor } from "@/lib/campaign-agents";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      objective?: CampaignObjective;
    };
    const result = await runCampaignLaunchAdvisor({
      tenantId,
      objective: body.objective ?? "revenue_recovery"
    });

    return NextResponse.json({
      runId: result.run.id,
      recommendationId: result.recommendation.id
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Campaign advisor failed."
      },
      { status: 500 }
    );
  }
}
