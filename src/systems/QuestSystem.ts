import { QUESTS, QuestDef, STORY_STEPS } from '../data/quests';

export class QuestSystem {
  private flags: Record<string, boolean> = {};
  private activeStoryStep = 0;

  setFlag(flag: string, value = true): void {
    this.flags[flag] = value;
    this.updateStoryStep();
  }

  getFlag(flag: string): boolean {
    return this.flags[flag] ?? false;
  }

  isQuestComplete(questKey: string): boolean {
    const quest: QuestDef | undefined = QUESTS[questKey];
    if (!quest) return false;
    return this.flags[quest.completionFlag] ?? false;
  }

  completeQuest(questKey: string): QuestDef | undefined {
    const quest: QuestDef | undefined = QUESTS[questKey];
    if (!quest) return undefined;
    this.flags[quest.completionFlag] = true;
    this.updateStoryStep();
    return quest;
  }

  /** Get the current story objective text for the HUD */
  getObjectiveText(): string {
    const step = STORY_STEPS[this.activeStoryStep];
    return step?.objective ?? '';
  }

  /** Get the current story step index */
  getStoryStep(): number {
    return this.activeStoryStep;
  }

  /** Recalculate which story step we're on based on flags */
  private updateStoryStep(): void {
    for (let i = STORY_STEPS.length - 1; i >= 0; i--) {
      const step = STORY_STEPS[i];
      if (step.completionFlag && this.flags[step.completionFlag]) {
        this.activeStoryStep = Math.min(i + 1, STORY_STEPS.length - 1);
        return;
      }
    }
    this.activeStoryStep = 0;
  }

  getFlags(): Record<string, boolean> {
    return { ...this.flags };
  }

  loadFlags(flags: Record<string, boolean>): void {
    this.flags = { ...flags };
    this.updateStoryStep();
  }
}
