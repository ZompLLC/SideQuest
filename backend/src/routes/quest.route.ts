import { Router } from "express";
import * as questHandler from "../handlers/quest.handler.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const questRouter = Router();

questRouter.post(
  "/groups/:groupId/quests",
  requireAuth,
  questHandler.createQuest,
);
questRouter.get("/groups/:groupId/quests", questHandler.listQuests);
questRouter.get("/groups/:groupId/quests/:questId", questHandler.getQuest);
questRouter.patch(
  "/groups/:groupId/quests/:questId",
  requireAuth,
  questHandler.updateQuest,
);
questRouter.delete(
  "/groups/:groupId/quests/:questId",
  requireAuth,
  questHandler.deleteQuest,
);
