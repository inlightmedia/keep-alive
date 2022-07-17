import { Role, User } from '@prisma/client';
import {db} from './db.server';
import { createCookieSessionStorage, redirect } from "remix";

const bcrypt = require('bcryptjs');

interface LoginType {
    username: string;
    password: string;
}

interface RegisterType {
    username: string;
    password: string;
    userRole: Role;
    firstName: string;
    lastName: string;
}

export const login = async ({username, password}: LoginType): Promise<Pick<User, "username" | "id"> | null> => {
    const user = await db.user.findUnique({
        where: {
            username,
        }
    });

    if (!user) return null;

    const passwordInputMatchesUserPassword = await bcrypt.compare(password, user.passwordHash);
    if (!passwordInputMatchesUserPassword) return null;
    return { username, id: user.id };
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",
      // all of these are optional
      //   domain: "remix.run",
      expires: new Date(Date.now() + 60_000 * 60 * 24),
      httpOnly: true,
      //   maxAge: 60,
      path: "/",
      sameSite: "lax",
      secrets: [sessionSecret],
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };

export async function createUserSession(
    {
        userId,
        redirectTo
    }: {
        userId: string;
        redirectTo: string;
    }
) {
    console.log('CREATE SESSION')
    const session = await getSession();
    session.set("userId", userId);
    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  function getUserSession(request: Request) {
    return getSession(request.headers.get("Cookie"));
  }
  
  export async function getUserId(request: Request) {
    const session = await getUserSession(request);
    const userId = session.get("userId");
    if (!userId || typeof userId !== "string") return null;
    return userId;
  }
  
  export async function requireUserId(
    request: Request,
    redirectTo: string = new URL(request.url).pathname
  ) {
    const session = await getUserSession(request);
    // console.log('session', session)
    const userId = session.get("userId");
    // console.log('userId', userId)
    if (!userId || typeof userId !== "string") {
      const searchParams = new URLSearchParams([
        ["redirectTo", redirectTo],
      ]);
      throw redirect(`/login?${searchParams}`);
    }
    return userId;
  }
  
  export async function getUser(request: Request) {
    const userId = await getUserId(request);
    if (typeof userId !== "string") {
        throw new Response("Unauthorized", { status: 401 });
    }
  
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
      });
      // console.log('usr', user)

      if (!user) {
        throw new Response("User not found", { status: 404 });
      }

      return user;
    } catch {
      throw logout(request);
    }
  }

  export async function logout(request: Request) {
    const session = await getUserSession(request);
    return redirect("/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
  
  export async function register({
    username,
    password,
    firstName,
    lastName,
    userRole
  }: RegisterType) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        username,
        name: `${firstName} ${lastName}`,
        role: userRole,
        passwordHash
      },
    });
    return { id: user.id, username };
  }
  
export const verifyTeacherAuthorization = async (request: Request) => {
    await requireUserId(request);
  
    const authenticatedUser = await getUser(request);
    
    if (!authenticatedUser) throw new Error("User not found");
  
    const teacherUser = db.user.findUnique({
      where: {
        id:  authenticatedUser.id
      },
      include: {
        teacherProfile: true
      }
    })
  
    if (!teacherUser.teacherProfile) throw new Error("Expected user to be a teacher");
  }