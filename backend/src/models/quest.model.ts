// Core Quest entity representing the database structure
export interface QuestModel {
  id: string;
  groupId: string;
  creatorId: string;
  title: string;
  description: string;
  pointValue: number;
  status: string;
  dueAt: string;
  completedAt: string;
  createdAt: string;
}

// Type aliases
type idField = Extract<keyof QuestModel, "id">;
type creatorIdField = Extract<keyof QuestModel, "creatorId">;
type titleField = Extract<keyof QuestModel, "title">;
type descriptionField = Extract<keyof QuestModel, "description">;
type pointValueField = Extract<keyof QuestModel, "pointValue">;
type statusField = Extract<keyof QuestModel, "status">;
type dueAtField = Extract<keyof QuestModel, "dueAt">;
type completedAtField = Extract<keyof QuestModel, "completedAt">;

// Create Quest
export type CreateQuestRequestModel = Pick<
  QuestModel,
  titleField | descriptionField | pointValueField | dueAtField
>;
export type CreateQuestResponseModel = Omit<
  QuestModel,
  statusField | completedAtField
>;

// List Quests
export type ListQuestsResponseModel = Array<
  Pick<QuestModel, idField | creatorIdField | titleField | pointValueField>
>;

// Get Quest
export type GetQuestResponseModel = Omit<QuestModel, completedAtField>;

// Update Quest
export type UpdateQuestRequestModel = Partial<
  Pick<
    QuestModel,
    titleField | descriptionField | pointValueField | statusField | dueAtField
  >
>;
export type UpdateQuestResponseModel = Partial<
  Pick<
    QuestModel,
    titleField | descriptionField | pointValueField | statusField | dueAtField
  >
>;
