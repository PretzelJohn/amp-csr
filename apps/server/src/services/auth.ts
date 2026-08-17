import { SignJWT, jwtVerify } from "jose";
import { comparePassword } from "../lib/passwords.js";
import { createUserRepo } from "../repos/users.js";

export type AuthUser = {
  id: number;
  email: string;
  roles: string[];
};

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set.");
}

export async function loginUser(input: { email: string; password: string }) {
  const userRepo = createUserRepo();
  const user = await userRepo.getByEmail(input.email.trim().toLowerCase());

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const userRoles = user.usersToRoles.map((ur) => ur.role.name);

  const validPassword = await comparePassword(
    input.password,
    user.password_hash,
  );
  if (!validPassword) {
    throw new Error("Invalid email or password.");
  }

  const token = await new SignJWT({
    sub: String(user.id),
    userId: user.id,
    email: user.email,
    roles: userRoles,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("https://amp.lucashussey.com")
    .setAudience("amp-csr")
    .setExpirationTime("1h")
    .sign(JWT_SECRET_BYTES);

  return {
    access_token: token,
    user: {
      id: user.id,
      email: user.email,
      roles: userRoles,
    } satisfies AuthUser,
  };
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET_BYTES, {
    algorithms: ["HS256"],
    issuer: "https://amp.lucashussey.com",
    audience: "amp-csr",
  });

  return payload;
}

export async function getUserById(userId: number) {
  const userRepo = createUserRepo();
  const user = await userRepo.getById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    roles: user.usersToRoles.map((ur) => ur.role.name),
  };
}
