/**
 * Habitica Task-related TypeScript interfaces
 * Based on Habitica API v3 documentation and observed usage patterns
 */

// Base task interface - common properties for all task types
export interface HabiticaTaskBase {
  id: string;
  text: string;
  notes?: string;
  tags?: string[];
  value: number;
  priority: number;
  attribute: "str" | "int" | "per" | "con";
  createdAt: string;
  updatedAt: string;
  userId: string;
  // Properties that exist on specific task types but are accessed generically in the code
  counterUp?: number; // Only on habits, but accessed generically
  counterDown?: number; // Only on habits, but accessed generically
  completed?: boolean; // On dailies and todos, but accessed generically
}

// Habit-specific properties
export interface HabiticaHabit extends HabiticaTaskBase {
  type: "habit";
  up: boolean;
  down: boolean;
  frequency: "daily" | "weekly" | "monthly";
  everyX: number;
  startDate?: Date;
  counterUp: number;
  counterDown: number;
  history?: Array<{
    date: number;
    value: number;
  }>;
}

// Daily-specific properties
export interface HabiticaDaily extends HabiticaTaskBase {
  type: "daily";
  completed: boolean;
  streak: number;
  startDate: string;
  frequency: "daily" | "weekly" | "monthly";
  everyX: number;
  repeat: {
    su: boolean;
    m: boolean;
    t: boolean;
    w: boolean;
    th: boolean;
    f: boolean;
    s: boolean;
  };
  isDue?: boolean;
  nextDue?: string[];
}

// Todo-specific properties
export interface HabiticaTodo extends HabiticaTaskBase {
  type: "todo";
  completed: boolean;
  dateCompleted?: string;
  dueDate?: string;
  checklist?: HabiticaChecklistItem[];
}

// Reward-specific properties
export interface HabiticaReward extends HabiticaTaskBase {
  type: "reward";
  cost: number;
}

// Checklist item for todos
export interface HabiticaChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

// Union type for all task types
export type HabiticaTask =
  | HabiticaHabit
  | HabiticaDaily
  | HabiticaTodo
  | HabiticaReward;

// Type guards
export function isHabiticaHabit(task: HabiticaTask): task is HabiticaHabit {
  return task.type === "habit";
}

export function isHabiticaDaily(task: HabiticaTask): task is HabiticaDaily {
  return task.type === "daily";
}

export function isHabiticaTodo(task: HabiticaTask): task is HabiticaTodo {
  return task.type === "todo";
}

export function isHabiticaReward(task: HabiticaTask): task is HabiticaReward {
  return task.type === "reward";
}

// Type guards for task discrimination
export function isHabit(task: HabiticaTask): task is HabiticaHabit {
  return task.type === "habit";
}

export function isDaily(task: HabiticaTask): task is HabiticaDaily {
  return task.type === "daily";
}

export function isTodo(task: HabiticaTask): task is HabiticaTodo {
  return task.type === "todo";
}

export function isReward(task: HabiticaTask): task is HabiticaReward {
  return task.type === "reward";
}

// Task collections by type
export interface HabiticaTaskCollection {
  habits: HabiticaHabit[];
  dailies: HabiticaDaily[];
  todos: HabiticaTodo[];
  rewards: HabiticaReward[];
}

// Task statistics
export interface HabiticaTaskStats {
  completedDailies: number;
  totalDailies: number;
  completedTodos: number;
  totalTodos: number;
  habitStreaks: { [habitId: string]: number };
}
