// Core User entity representing the database structure
export type UserModel = {
  id: string;
  email: string;
  username: string;
  password?: string;
  createdAt: string;
};

// Request Payloads
export type RegisterRequestModel = Required<
  Pick<UserModel, "email" | "username" | "password">
>;

export type LoginRequestModel = Required<Pick<UserModel, "email" | "password">>;

// Response Payloads
export type RegisterResponseModel = {
  id: string;
  email: string;
  username: string;
  authToken: string;
};

export type LoginResponseModel = {
  message: string;
  accessToken: string;
  userId: string;
};
