export type Vitals = { hr: number; co2: number; temp: number; spo2: number; systolic: number; diastolic: number; rr: number };
export type Severity = 'stable' | 'warning' | 'critical';
export type SceneState = { vitals: Vitals; severity: Severity; paused: boolean; started: boolean; working: boolean; completed: boolean; stage: number; preop?: boolean };
export type ViewMode = 'room' | 'patient' | 'equipment';
