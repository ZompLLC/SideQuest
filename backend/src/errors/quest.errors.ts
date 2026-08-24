import { ApiError } from "./errors";

export const QUEST_ERROR_CODES = [
  "QUEST_NOT_FOUND",
  "NOT_QUEST_OWNER",
] as const;

export type QuestsErrorCode = (typeof QUEST_ERROR_CODES)[number];

export const QuestErrors = {
  questNotFound: (questId: string) =>
    new ApiError(404, "QUEST_NOT_FOUND", `Quest with id ${questId} not found`),
  notQuestOwner: () =>
    new ApiError(
      403,
      "NOT_QUEST_OWNER",
      "Only the quest creator can perform this action",
    ),
};
