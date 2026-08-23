import { randomBytes, randomUUID } from "crypto";
import { Request, Response } from "express";
import {
  createGroup as dbCreateGroup,
  findGroupById,
  listGroupsForUser,
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
  ListGroupsResponseModel,
  UpdateGroupRequesteModel,
  UpdateGroupResponseModel,
} from "../models/group.model.js";

// TODO: replace with real auth middleware; assumed to populate req.user.id
// from the access token once login/logout are wired up to a session store.
function getAuthedUserId(req: Request): string | undefined {
  return (req as any).user?.id;
}

const DEFAULT_SEASON_LENGTH = 18; // TODO: confirm default with product

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

  const ownerId = getAuthedUserId(req);
  if (!ownerId) {
    req.log.warn("createGroup: no authenticated user on request");
    sendError(res, CommonErrors.internalError());
    return;
  }

  const groupId = randomUUID();
  const inviteCode = generateInviteCode();
  const createdAt = new Date().toISOString();

  try {
    const group = await dbCreateGroup(
      groupId,
      name,
      ownerId,
      inviteCode,
      DEFAULT_SEASON_LENGTH,
      createdAt,
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

// GET /groups
export async function listGroups(
  req: Request,
  res: Response<ListGroupsResponseModel>,
): Promise<void> {
  req.log.info("listGroups: request received");

  const userId = getAuthedUserId(req);
  if (!userId) {
    req.log.warn("listGroups: no authenticated user on request");
    sendError(res, CommonErrors.internalError());
    return;
  }

  try {
    const groups = await listGroupsForUser(userId);
    res.status(200).json(groups);
  } catch (err) {
    req.log.error("listGroups: failed to list groups", { err, userId });
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

  const userId = getAuthedUserId(req);
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

  const userId = getAuthedUserId(req);
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
    res.status(204).send();
  } catch (err) {
    req.log.error("deleteGroup: failed to delete group", { err, groupId });
    sendError(res, CommonErrors.internalError());
  }
}
