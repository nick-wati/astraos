import type { RoleAgent } from "@prisma/client";

export async function runAgentSandbox(agent: RoleAgent, command = "echo AstraOS sandbox ready") {
  if (agent.runtimeType !== "e2b_sandbox") {
    return {
      mode: "not_required" as const,
      output: "This Role Agent does not require sandbox execution."
    };
  }

  if (!process.env.E2B_API_KEY) {
    return {
      mode: "mock" as const,
      output:
        "Simulated E2B sandbox execution: processed files, ran a lightweight command, and returned a clean artifact summary."
    };
  }

  try {
    const mod = (await import("e2b")) as any;
    const Sandbox = mod.Sandbox ?? mod.default?.Sandbox;
    const sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });
    const result = await sandbox.commands.run(command);
    await sandbox.close();
    return {
      mode: "live" as const,
      output: result?.stdout ?? result?.output ?? "E2B sandbox command completed."
    };
  } catch (error) {
    return {
      mode: "mock" as const,
      output: `E2B was configured but sandbox execution fell back to simulation: ${
        error instanceof Error ? error.message : "unknown sandbox error"
      }`
    };
  }
}
