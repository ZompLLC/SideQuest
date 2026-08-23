import { randomBytes, randomUUID } from "crypto";
import { Request, Response } from "express";
import {
  createGroup as dbCreateGroup,
  findGroupById,
  updateGroup as dbUpdateGroup,
  deleteGroup as dbDeleteGroup,
} from "../../db.js";
import { sendError } from "../errors.js";
import { GroupErrors } from "../errors/group.errors";
import { CommonErrors, requireFields } from "../errors/common.errors";
import {
  CreateGroupRequestModel,
  CreateGroupResponseModel,
  GetGroupResponseModel,
  UpdateGroupRequesteModel,
  UpdateGroupResponseModel,
} from "../models/group.model.js";

const DEFAULT_SEASON_LENGTH = 30;

function generateInviteCode(): string {
  return randomBytes(6).toString("base64url");
}

// POST /groups
export async function createGroup(
  req: Request<{}, {}, CreateGroupRequestModel>,
  res: Response<CreateGroupResponseModel>,
): Promise<void> {
  const { name } = req.body;

  req.log.info("createGroup: request received", { name });

  const missing = requireFields(req.body, ["name"]);
  if (missing) {
    req.log.warn("createGroup: validation failed, missing required fields");
    sendError(res, CommonErrors.missingField());
    return;
  }

  //TODO get auth user sending request
  const ownerId = "aeca1f42-a965-415f-9f81-4dec0a76e14";
  if (!ownerId) {
    req.log.warn("createGroup: no authenticated user on request");
    sendError(res, CommonErrors.internalError());
    return;
  }

  const groupId = randomUUID();
  const inviteCode = generateInviteCode();

  try {
    const group = await dbCreateGroup(
      groupId,
      name,
      ownerId,
      inviteCode,
      DEFAULT_SEASON_LENGTH,
    );
    req.log.info("createGroup: group created successfully", {
      groupId,
      ownerId,
    });
    res.status(201).json(group);
  } catch (err) {
    req.log.error("createGroup: failed to create group", { err });
    sendError(res, CommonErrors.internalError());
  }
}

// GET /groups/:groupId
export async function getGroup(
  req: Request<{ groupId: string }>,
  res: Response<GetGroupResponseModel>,
): Promise<void> {
  const { groupId } = req.params;

  req.log.info("getGroup: request received", { groupId });

  let group;
  try {
    group = await findGroupById(groupId);
  } catch (err) {
    req.log.error("getGroup: failed to look up group", { err, groupId });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!group) {
    req.log.warn("getGroup: group not found", { groupId });
    sendError(res, GroupErrors.groupNotFound(groupId));
    return;
  }

  const { inviteCode, createdAt, ...response } = group;
  res.status(200).json(response);
}

// PATCH /groups/:groupId
export async function updateGroup(
  req: Request<{ groupId: string }, {}, UpdateGroupRequesteModel>,
  res: Response<UpdateGroupResponseModel>,
): Promise<void> {
  const { groupId } = req.params;
  const { name, seasonLength } = req.body;

  req.log.info("updateGroup: request received", { groupId });

  const userId = "aeca1f42-a965-415f-9f81-4dec0a76e14";
  if (!userId) {
    req.log.warn("updateGroup: no authenticated user on request");
    sendError(res, CommonErrors.internalError());
    return;
  }

  let group;
  try {
    group = await findGroupById(groupId);
  } catch (err) {
    req.log.error("updateGroup: failed to look up group", { err, groupId });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!group) {
    req.log.warn("updateGroup: group not found", { groupId });
    sendError(res, GroupErrors.groupNotFound(groupId));
    return;
  }

  if (group.ownerId !== userId) {
    req.log.warn("updateGroup: forbidden, not group owner", {
      groupId,
      userId,
    });
    sendError(res, GroupErrors.notGroupOwner());
    return;
  }

  try {
    const updated = await dbUpdateGroup(groupId, { name, seasonLength });
    req.log.info("updateGroup: group updated successfully", { groupId });
    res.status(200).json(updated!);
  } catch (err) {
    req.log.error("updateGroup: failed to update group", { err, groupId });
    sendError(res, CommonErrors.internalError());
  }
}

// DELETE /groups/:groupId
export async function deleteGroup(
  req: Request<{ groupId: string }>,
  res: Response,
): Promise<void> {
  const { groupId } = req.params;

  req.log.info("deleteGroup: request received", { groupId });

  const userId = "aeca1f42-a965-415f-9f81-4dec0a76e14";
  if (!userId) {
    req.log.warn("deleteGroup: no authenticated user on request");
    sendError(res, CommonErrors.internalError());
    return;
  }

  let group;
  try {
    group = await findGroupById(groupId);
  } catch (err) {
    req.log.error("deleteGroup: failed to look up group", { err, groupId });
    sendError(res, CommonErrors.internalError());
    return;
  }

  if (!group) {
    req.log.warn("deleteGroup: group not found", { groupId });
    sendError(res, GroupErrors.groupNotFound(groupId));
    return;
  }

  if (group.ownerId !== userId) {
    req.log.warn("deleteGroup: forbidden, not group owner", {
      groupId,
      userId,
    });
    sendError(res, GroupErrors.notGroupOwner());
    return;
  }

  try {
    await dbDeleteGroup(groupId);
    req.log.info("deleteGroup: group deleted successfully", { groupId });
    res.status(200).json({ message: "group successfully deleted" });
  } catch (err) {
    req.log.error("deleteGroup: failed to delete group", { err, groupId });
    sendError(res, CommonErrors.internalError());
  }
}
