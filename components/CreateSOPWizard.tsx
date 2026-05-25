"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, ClipboardList, FileText, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

const steps = [
  "Define business objective",
  "Paste human SOP",
  "Break SOP into steps",
  "Generate Agent Team",
  "Define Role Agents",
  "Define Validator Agents",
  "Define retry and escalation policies",
  "Review and activate"
];

const generated = {
  team: "Expansion Opportunity Review Agent Team",
  roles: [
    "Opportunity Intake Agent",
    "Account Research Agent",
    "Expansion Fit Agent",
    "Sales Handoff Agent"
  ],
  validators: [
    "Account Completeness Validator",
    "Expansion Fit Validator",
    "Handoff Quality Validator"
  ],
  policies: [
    "Retry twice when account evidence is incomplete.",
    "Request human review when expansion fit remains ambiguous.",
    "Escalate to RevOps when CRM writeback fails."
  ]
};

export function CreateSOPWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [objective, setObjective] = useState(
    "Identify expansion-ready accounts, validate evidence, and create a sales-ready handoff."
  );
  const [sopText, setSopText] = useState(
    "Review new product usage signals, enrich account context, score expansion fit, validate handoff quality, and route qualified opportunities to the account owner."
  );
  const hasGenerated = currentStep >= 3;

  const progress = useMemo(() => ((currentStep + 1) / steps.length) * 100, [currentStep]);

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">
          Create SOP Wizard
        </p>
        <div className="mt-4 h-2 rounded-full bg-stone-100">
          <div className="h-2 rounded-full bg-teal-700" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 space-y-2">
          {steps.map((step, index) => (
            <button
              key={step}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                currentStep === index ? "bg-teal-50 text-teal-800" : "text-muted-foreground hover:bg-stone-50"
              }`}
              onClick={() => setCurrentStep(index)}
            >
              {index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
              {step}
            </button>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">
              Step {currentStep + 1}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{steps[currentStep]}</h2>
          </div>
          <StatusBadge status={hasGenerated ? "active" : "draft"} label={hasGenerated ? "Generated preview" : "Drafting"} />
        </div>
        <div className="mt-5 grid gap-4">
          {currentStep <= 1 ? (
            <>
              <label className="grid gap-2 text-sm font-medium">
                Business objective
                <textarea
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  className="min-h-24 rounded-md border border-border bg-white p-3 text-sm font-normal outline-none focus:border-teal-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Human SOP
                <textarea
                  value={sopText}
                  onChange={(event) => setSopText(event.target.value)}
                  className="min-h-32 rounded-md border border-border bg-white p-3 text-sm font-normal outline-none focus:border-teal-500"
                />
              </label>
            </>
          ) : null}
          {currentStep >= 2 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-stone-50 p-4">
                <FileText className="h-5 w-5 text-teal-700" />
                <h3 className="mt-3 font-semibold">SOP steps</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>1. Capture account signal</li>
                  <li>2. Enrich account context</li>
                  <li>3. Score expansion fit</li>
                  <li>4. Create sales handoff</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-teal-50 p-4">
                <Bot className="h-5 w-5 text-teal-700" />
                <h3 className="mt-3 font-semibold">{generated.team}</h3>
                <ul className="mt-2 space-y-2 text-sm text-teal-950">
                  {generated.roles.map((role) => (
                    <li key={role}>{role}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-amber-50 p-4">
                <ShieldCheck className="h-5 w-5 text-amber-700" />
                <h3 className="mt-3 font-semibold">Validation gates</h3>
                <ul className="mt-2 space-y-2 text-sm text-amber-950">
                  {generated.validators.map((validator) => (
                    <li key={validator}>{validator}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          {currentStep >= 6 ? (
            <div className="rounded-lg border border-border bg-white p-4">
              <h3 className="font-semibold">Retry and escalation policy</h3>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {generated.policies.map((policy) => (
                  <li key={policy}>{policy}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-between">
          <Button
            variant="secondary"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
          >
            Back
          </Button>
          <Button
            onClick={() => setCurrentStep((step) => Math.min(steps.length - 1, step + 1))}
          >
            <Play className="h-4 w-4" />
            {currentStep >= steps.length - 1 ? "Activate preview" : "Continue"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
