// Core Group entity representing the database structure
export interface GroupModel {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  memberCount: number;
  seasonLength: number;
  createdAt: string;
}

// Type aliases
type idField = Extract<keyof GroupModel, "id">;
type nameField = Extract<keyof GroupModel, "name">;
type inviteCodeField = Extract<keyof GroupModel, "inviteCode">;
type memberCountField = Extract<keyof GroupModel, "memberCount">;
type seasonLengthField = Extract<keyof GroupModel, "seasonLength">;
type createdAtField = Extract<keyof GroupModel, "createdAt">;

// Create Group
export type CreateGroupRequestModel = Pick<GroupModel, nameField>;
export type CreateGroupResponseModel = Omit<GroupModel, memberCountField>;

// List Groups
export type ListGroupsResponseModel = Array<
  Pick<GroupModel, idField | nameField | memberCountField>
>;

// Get Group
export type GetGroupResponseModel = Omit<
  GroupModel,
  inviteCodeField | createdAtField
>;

// Update Group
export type UpdateGroupRequesteModel = Pick<
  GroupModel,
  nameField | seasonLengthField
>;
export type UpdateGroupResponseModel = Pick<
  GroupModel,
  idField | nameField | seasonLengthField
>;
