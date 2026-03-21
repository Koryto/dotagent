import type { CliContext } from "../models/command.js";
import { inspectDoctor, renderDoctorReport } from "../core/doctor.js";

export async function handleDoctor(context: CliContext): Promise<number> {
  const report = inspectDoctor(context);
  context.logger.info(renderDoctorReport(report));
  return 0;
}
