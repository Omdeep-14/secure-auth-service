import { randomInt } from "node:crypto";

export const genOtp = (): string => {
  return randomInt(100000, 1000000).toString();
};
