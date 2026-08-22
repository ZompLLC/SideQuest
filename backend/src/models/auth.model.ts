export interface RegisterRequestModel {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponseModel {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface LoginRequestModel {
  email: string;
  password: string;
}

export interface LoginResponseModel {
  message: string;
  accessToken: string;
  user: {
    id: string;
    username: string;
  };
}

// Attached to req by the requireAuth middleware once a bearer token is verified.
export interface AuthenticatedUserModel {
  id: string;
  username: string;
}
