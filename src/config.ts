import { readFileSync } from "fs";
import { join } from "path";

export interface DonutProfile {
  name: string;
  stage: string;
  sector: string[];
  product: string;
  differentiator: string;
  target_raise: string;
  traction: string;
  team_size: string;
  location: string;
}

const profilePath = join(import.meta.dir, "../data/donut-profile.json");

let _profile: DonutProfile | null = null;

export function getDonutProfile(): DonutProfile {
  if (!_profile) {
    _profile = JSON.parse(readFileSync(profilePath, "utf-8"));
  }
  return _profile!;
}

export function getAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  return key;
}
