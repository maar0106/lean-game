/**
 * Delivery Route Standards — verbatim from Mixed_Model_Material_Flow_Workbook_2025.xlsm
 * DO NOT change these values here. Change them in the workbook first.
 */
export const TASK_TIMES = {
  /** A: Walk between tugger and cart (seconds) */
  A_WALK: 6,
  /** B: Tugger travel (seconds per foot at 2.5 MPH) */
  B_TRAVEL_PER_FOOT: 0.272,
  /** C: Mount / dismount tugger (seconds) */
  C_MOUNT_DISMOUNT: 3.9,
  /** D: Deliver full container, pick up empty (seconds per container) */
  D_DELIVER_PER_CONTAINER: 12,
  /** E: Supermarket locate-and-pick (seconds per item picked) */
  E_SUPERMARKET_PER_ITEM: 27.4,
} as const;

/** Variability levels matching workbook dropdown vocabulary */
export type VariabilityLevel = "None" | "Low" | "Medium" | "High";

/** Coefficient of variation per variability level (matched to KanbanDemo distribution) */
export const VARIABILITY_CV: Record<VariabilityLevel, number> = {
  None: 0,
  Low: 0.05,
  Medium: 0.15,
  High: 0.30,
};
