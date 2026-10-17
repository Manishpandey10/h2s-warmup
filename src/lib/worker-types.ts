export const workerTypes = ["delivery", "driver", "dailyWage", "domestic", "other"] as const;

export type WorkerType = (typeof workerTypes)[number];

const occupations: Record<Exclude<WorkerType, "other">, string> = {
  delivery: "Delivery partner",
  driver: "Driver",
  dailyWage: "Daily-wage worker",
  domestic: "Domestic worker",
};

export function occupationFor(type: WorkerType, customWork: string): string {
  return type === "other" ? customWork.trim() : occupations[type];
}
