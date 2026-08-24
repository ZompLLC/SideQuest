import { randomUUID } from "crypto";
import { Request, Response } from "express";
import {
  createQuest as dbCreateQuest,
  findQuestById,
  listQuestsByGroup,
  updateQuest as dbUpdateQuest,
  deleteQuest as dbDeleteQuest,
  findGroupById,
} from "../../db.js";
import { sendError } from "../errors/errors.js";
//import { AuthErrors } from "../errors/quest.errors";
import { CommonErrors, requireFields } from "../errors/common.errors";
import { QuestErrors } from "../errors/quest.errors.js";
import { GroupErrors } from "../errors/group.errors.js";
import {
  CreateQuestRequestModel,
  CreateQuestResponseModel,
  GetQuestResponseModel,
  ListQuestsResponseModel,
  UpdateQuestRequestModel,
  UpdateQuestResponseModel,
} from "../models/quest.model.js";

// POST /groups/:groupId/quests
export async function createQuest(
  req: Request<
    { groupId: string },
    CreateQuestResponseModel,
    CreateQuestRequestModel
  >,
  res: Response<CreateQuestResponseModel>,
): Promise<void> {
  const { groupId } = req.params;
  const userId = req.userId!;

  req.log.info("createQuest: request received", { groupId });
  req.log.info("createQuest: USERID TESTESTS", { userId });

  const missing = requireFields(req.body, [
    "title",
    "description",
    "pointValue",
    "dueAt",
  ]);
  if (missing) {
    req.log.info("createQuest: validation failed, missing required fields");
    sendError(res, CommonErrors.missingField());
    return;
  }

  let group;
  try {
    group = await findGroupById(groupId);
  } catch (err) {
    req.log.info("createQuest: failed to look up group", { err, groupId });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!group) {
    req.log.info("createQuest: group not found", { groupId });
    sendError(res, GroupErrors.groupNotFound(groupId));
    return;
  }

  const questId = randomUUID();

  try {
    const quest = await dbCreateQuest(questId, groupId, userId, req.body);
    req.log.info("createQuest: quest created successfully", {
      questId,
      groupId,
    });
    res.status(201).json(quest);
  } catch (err) {
    req.log.info("createQuest: failed to create quest", { err, groupId });
    sendError(res, CommonErrors.internalError());
  }
}

// GET /groups/:groupId/quests?status=[..]
export async function listQuests(
  req: Request<
    { groupId: string },
    ListQuestsResponseModel,
    Record<string, never>,
    { status?: string }
  >,
  res: Response<ListQuestsResponseModel>,
): Promise<void> {
  const { groupId } = req.params;
  const { status } = req.query;

  req.log.info("listQuests: request received", { groupId, status });
  //TODO filter by status properly

  let group;
  try {
    group = await findGroupById(groupId);
  } catch (err) {
    req.log.info("listQuests: failed to look up group", { err, groupId });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!group) {
    req.log.info("listQuests: group not found", { groupId });
    sendError(res, GroupErrors.groupNotFound(groupId));
    return;
  }

  try {
    const quests = await listQuestsByGroup(groupId, status);
    req.log.info("listQuests: quests retrieved successfully", {
      groupId,
      count: quests.length,
    });
    res.status(200).json(quests);
  } catch (err) {
    req.log.info("listQuests: failed to list quests", { err, groupId });
    sendError(res, CommonErrors.internalError());
  }
}

// GET /groups/:groupId/quests/:questId
export async function getQuest(
  req: Request<{ groupId: string; questId: string }>,
  res: Response<GetQuestResponseModel>,
): Promise<void> {
  const { groupId, questId } = req.params;

  req.log.info("getQuest: request received", { groupId, questId });

  let quest;
  try {
    quest = await findQuestById(questId);
  } catch (err) {
    req.log.info("getQuest: failed to look up quest", {
      err,
      groupId,
      questId,
    });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!quest || quest.groupId !== groupId) {
    req.log.info("getQuest: quest not found", { groupId, questId });
    sendError(res, QuestErrors.questNotFound(questId));
    return;
  }

  res.status(200).json(quest);
}

// PATCH /groups/:groupId/quests/:questId
export async function updateQuest(
  req: Request<
    { groupId: string; questId: string },
    UpdateQuestResponseModel,
    UpdateQuestRequestModel
  >,
  res: Response<UpdateQuestResponseModel>,
): Promise<void> {
  const { groupId, questId } = req.params;
  const { title, description, pointValue, status, dueAt } = req.body;
  const userId = req.userId!;

  req.log.info("updateQuest: request received", { groupId, questId });

  let quest;
  try {
    quest = await findQuestById(questId);
  } catch (err) {
    req.log.info("updateQuest: failed to look up quest", {
      err,
      groupId,
      questId,
    });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!quest || quest.groupId !== groupId) {
    req.log.info("updateQuest: quest not found", { groupId, questId });
    sendError(res, QuestErrors.questNotFound(questId));
    return;
  }

  if (quest.creatorId !== userId) {
    req.log.info("updateQuest: forbidden, not quest creator", {
      groupId,
      questId,
      userId,
    });
    sendError(res, QuestErrors.notQuestOwner());
    return;
  }

  try {
    const updated = await dbUpdateQuest(questId, {
      title,
      description,
      pointValue,
      status,
      dueAt,
    });
    req.log.info("updateQuest: quest updated successfully", {
      groupId,
      questId,
    });
    res.status(200).json(updated!);
  } catch (err) {
    req.log.info("updateQuest: failed to update quest", {
      err,
      groupId,
      questId,
    });
    sendError(res, CommonErrors.internalError());
  }
}

// DELETE /groups/:groupId/quests/:questId
export async function deleteQuest(
  req: Request<{ groupId: string; questId: string }>,
  res: Response,
): Promise<void> {
  const { groupId, questId } = req.params;
  const userId = req.userId!;

  req.log.info("deleteQuest: request received", { groupId, questId });

  let quest;
  try {
    quest = await findQuestById(questId);
  } catch (err) {
    req.log.info("deleteQuest: failed to look up quest", {
      err,
      groupId,
      questId,
    });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!quest || quest.groupId !== groupId) {
    req.log.info("deleteQuest: quest not found", { groupId, questId });
    sendError(res, QuestErrors.questNotFound(questId));
    return;
  }

  if (quest.creatorId !== userId) {
    req.log.info("deleteQuest: forbidden, not quest creator", {
      groupId,
      questId,
      userId,
    });
    sendError(res, QuestErrors.notQuestOwner());
    return;
  }

  try {
    await dbDeleteQuest(questId);
    req.log.info("deleteQuest: quest deleted successfully", {
      groupId,
      questId,
    });
    res.status(200).json({ message: "quest successfully deleted" });
  } catch (err) {
    req.log.info("deleteQuest: failed to delete quest", {
      err,
      groupId,
      questId,
    });
    sendError(res, CommonErrors.internalError());
  }
}
