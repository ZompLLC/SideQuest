import { ApiError } from "../errors";

export const GROUP_ERROR_CODES = [
  "GROUP_NOT_FOUND",
  "GROUP_NOT_OWNER",
  "GROUP_INVALID_INVITE_CODE",
  "GROUP_ALREADY_MEMBER",
  "GROUP_MEMBER_NOT_FOUND",
  "GROUP_CANNOT_REMOVE_OWNER",
] as const;

export type GroupErrorCode = (typeof GROUP_ERROR_CODES)[number];

export const GroupErrors = {
  groupNotFound: (groupId?: string) =>
    new ApiError(
      404,
      "GROUP_NOT_FOUND",
      groupId ? `No group found with id "${groupId}".` : "Group not found.",
    ),

  notGroupOwner: () =>
    new ApiError(
      403,
      "GROUP_NOT_OWNER",
      "Only the group owner can perform this action.",
    ),

  invalidInviteCode: () =>
    new ApiError(
      400,
      "GROUP_INVALID_INVITE_CODE",
      "Invite code is invalid or has expired.",
    ),

  alreadyMember: () =>
    new ApiError(
      409,
      "GROUP_ALREADY_MEMBER",
      "User is already a member of this group.",
    ),

  memberNotFound: (userId?: string) =>
    new ApiError(
      404,
      "GROUP_MEMBER_NOT_FOUND",
      userId
        ? `User "${userId}" is not a member of this group.`
        : "Member not found.",
    ),

  cannotRemoveOwner: () =>
    new ApiError(
      400,
      "GROUP_CANNOT_REMOVE_OWNER",
      "The group owner cannot be removed. Delete the group instead.",
    ),
};
