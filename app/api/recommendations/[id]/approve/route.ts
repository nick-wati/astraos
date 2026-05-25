import { NextResponse } from "next/server";
import { getCampaignService } from "@/lib/campaign-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recommendation = await prisma.campaignRecommendation.findUnique({
      where: { id },
      include: {
        tenant: true
      }
    });

    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found." }, { status: 404 });
    }

    const campaignService = getCampaignService();
    const draft = campaignService.createCampaignDraft
      ? await campaignService.createCampaignDraft({
          tenantId: recommendation.tenantId,
          recommendationId: recommendation.id,
          sendAt: recommendation.recommendedSendTime,
          templateBody: recommendation.templateBody
        })
      : undefined;

    const approved = await prisma.campaignRecommendation.update({
      where: { id },
      data: {
        status: "approved",
        operatingSummary: draft?.message
          ? `${recommendation.operatingSummary} ${draft.message}`
          : recommendation.operatingSummary
      }
    });

    return NextResponse.json({
      recommendationId: approved.id,
      status: approved.status,
      draft
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Approval failed." },
      { status: 500 }
    );
  }
}
