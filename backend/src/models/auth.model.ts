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
export type RegisterResponseModel = Omit<UserModel, "password">;

export type LoginResponseModel = {
  message: string;
  accessToken: string;
  user: AuthenticatedUserModel;
};

// Middleware & Session Payload
export type AuthenticatedUserModel = Pick<UserModel, "id" | "username">;
