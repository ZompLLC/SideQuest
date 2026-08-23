import { Request, Response } from "express";

export function createMockLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}

export function createMockRequest<T extends Record<string, unknown>>(
  body: T,
): Request {
  return {
    body,
    log: createMockLogger(),
  } as unknown as Request;
}

export function createMockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
