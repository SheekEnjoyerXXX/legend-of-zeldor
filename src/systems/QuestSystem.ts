import { QUESTS, QuestDef } from '../data/quests';

export class QuestSystem {
  private flags: Record<string, boolean> = {};

  setFlag(flag: string, value = true): void {
    this.flags[flag] = value;
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
    return quest;
  }

  getFlags(): Record<string, boolean> {
    return { ...this.flags };
  }

  loadFlags(flags: Record<string, boolean>): void {
    this.flags = { ...flags };
  }
}
