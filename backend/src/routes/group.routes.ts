import { Router } from "express";
import * as groupHandler from "../handlers/group.handler.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const groupRouter = Router();

groupRouter.post("/groups", requireAuth, groupHandler.createGroup);
//groupRouter.get("/groups", groupHandler.listGroups);
groupRouter.get("/groups/:groupId", groupHandler.getGroup);
groupRouter.patch("/groups/:groupId", groupHandler.updateGroup);
groupRouter.delete("/groups/:groupId", groupHandler.deleteGroup);
// TODO implement user groups
//groupRouter.get("/groups/:groupId/members", groupHandler.getMembers);
//groupRouter.post("/groups/:groupId/members", groupHandler.addMember);
//groupRouter.delete(
//  "/groups/:groupId/members/:userId",
//  groupHandler.removeMember,
//);
