import {
    ActionFunction,
    LinksFunction,
    redirect,
  } from "remix";
  import { json } from "remix";
  import {
    useActionData,
    Link,
    useSearchParams,
  } from "@remix-run/react";
  
  import { db } from "~/utils/db.server";
  import stylesUrl from "~/styles/login.css";
  import { login, getSession, commitSession, createUserSession, register } from "~/utils/session.server";
import { Role } from "@prisma/client";
  
  
  export const links: LinksFunction = () => {
    return [{ rel: "stylesheet", href: stylesUrl }];
  };
  
  function validateUsername(username: unknown) {
    if (typeof username !== "string" || username.length < 3) {
      return `Usernames must be at least 3 characters long`;
    }
  }
  
  function validateName(name: unknown) {
    if (typeof name !== "string" || name.length < 2) {
      return `Names must be at least 2 characters long`;
    }
  }
  
  function validateRole(role: unknown) {
    if (typeof role !== "string" || (role !== "student" && role !== "teacher")) {
      
        return `Role must be either student or teacher`;
    }
  }
  
  function validatePassword(password: unknown) {
    if (typeof password !== "string" || password.length < 6) {
      return `Passwords must be at least 6 characters long`;
    }
  }
  
  function validatePasswordConfirmation(password: unknown, passwordConfirmation: unknown) {
    if (typeof password !== "string" || password.length < 6) {
      return `Passwords must be at least 6 characters long`;
    }
    if (password !== passwordConfirmation) {
        return `Passwords must match.`
    }
  }
  
  function validateUrl(url: any) {
    console.log(url);
    let urls = [
      "/",
      "/songs",
      "/students",
      "/teachers"
    ];
    if (urls.includes(url)) {
      return url;
    }
    return "/";
  }
  
  type ActionData = {
    formError?: string;
    fieldErrors?: {
      username: string | undefined;
      password: string | undefined;
      passwordConfirmation: string | undefined;
      firstName: string | undefined;
      lastName: string | undefined;
    };
    fields?: {
      username: string;
      firstName: string;
      lastName: string;
      userRole: Role;
      password: string;
      passwordConfirmation: string;
    };
  };
  
  const badRequest = (data: ActionData) =>
    json(data, { status: 400 });
  
  
  export async function loader({ request }: {request: any}) {
    const session = await getSession(
      request.headers.get("Cookie")
    );
  
    if (session.has("userId")) {
      // Redirect to the home page if they are already signed in.
      return redirect("/");
    }
  
    const data = { error: session.get("error") };
  
    return json(data, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
    
  
  
  export const action: ActionFunction = async ({
    request,
    params
  }) => {
    const session = await getSession(
      request.headers.get("Cookie")
    );
    console.log('redirect url', params.redirectTo)
  
    const form = await request.formData();
    const userRole = form.get("userRole");
    const firstName = form.get("firstName");
    const lastName = form.get("lastName");
    const username = form.get("username");
    const password = form.get("password");
    const passwordConfirmation = form.get("password");
    const redirectTo = validateUrl(
      form.get("redirectTo") || "/"
    );
  
    if (
      (userRole !== Role.STUDENT && userRole !== Role.TEACHER) ||
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof passwordConfirmation !== "string" ||
      typeof redirectTo !== "string"
    ) {
      return badRequest({
        formError: `Form not submitted correctly.`,
      });
    }
  
    const fields = { userRole, firstName, lastName, username, password, passwordConfirmation };
    const fieldErrors = {
      username: validateUsername(username),
      password: validatePassword(password),
      passwordConfirmation: validatePasswordConfirmation(password, passwordConfirmation),
      firstName: validateName(firstName),
      lastName: validateName(lastName),
      userRole: validateRole(userRole),
    };
    if (Object.values(fieldErrors).some(Boolean))
      return badRequest({ fieldErrors, fields });
  
    const userExists = await db.user.findFirst({
        where: { username },
    });
    if (userExists) {
        return badRequest({
            fields,
            formError: `User with username ${username} already exists`,
        });
    }
    const user = await register({ username, password, firstName, lastName, userRole }); // TODO: get name and other fields for new account to add to registration
    if (!user) {
        return badRequest({
            fields,
            formError: `Something went wrong trying to create a new user.`,
        });
    }
    return createUserSession({userId: user.id, redirectTo});
  };
  
  export default function Register() {
    const actionData = useActionData<ActionData>();
    const [searchParams] = useSearchParams();
    return (
      <div className="container">
        <div className="content" data-light="">
          <h1>Register</h1>
          <form method="post">
            <input
              type="hidden"
              name="redirectTo"
              value={
                searchParams.get("redirectTo") ?? undefined
              }
            />
            <div>
              <label htmlFor="username-input">Username</label>
              <input
                type="text"
                id="username-input"
                name="username"
                defaultValue={actionData?.fields?.username}
                aria-invalid={Boolean(
                  actionData?.fieldErrors?.username
                )}
                aria-errormessage={
                  actionData?.fieldErrors?.username
                    ? "username-error"
                    : undefined
                }
              />
              {actionData?.fieldErrors?.username ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="username-error"
                >
                  {actionData.fieldErrors.username}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="username-input">First Name</label>
              <input
                type="text"
                id="firstName-input"
                name="firstName"
                defaultValue={actionData?.fields?.firstName}
                aria-invalid={Boolean(
                  actionData?.fieldErrors?.firstName
                )}
                aria-errormessage={
                  actionData?.fieldErrors?.firstName
                    ? "firstName-error"
                    : undefined
                }
              />
              {actionData?.fieldErrors?.firstName ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="firstName-error"
                >
                  {actionData.fieldErrors.firstName}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="username-input">Last Name</label>
              <input
                type="text"
                id="lastName-input"
                name="lastName"
                defaultValue={actionData?.fields?.lastName}
                aria-invalid={Boolean(
                  actionData?.fieldErrors?.lastName
                )}
                aria-errormessage={
                  actionData?.fieldErrors?.lastName
                    ? "lastName-error"
                    : undefined
                }
              />
              {actionData?.fieldErrors?.lastName ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="lastName-error"
                >
                  {actionData.fieldErrors.lastName}
                </p>
              ) : null}
            </div>
            <fieldset>
                <legend className="sr-only">
                Student or Teacher?
                </legend>
                <label>
                <input
                    type="radio"
                    name="userRole"
                    value={Role.STUDENT}
                    defaultChecked={
                    !actionData?.fields?.userRole ||
                    actionData?.fields?.userRole === Role.STUDENT
                    }
                />{" "}
                Student
                </label>
                <label>
                <input
                    type="radio"
                    name="userRole"
                    value={Role.TEACHER}
                    defaultChecked={
                    actionData?.fields?.userRole ===
                    Role.TEACHER
                    }
                />{" "}
                Teacher
                </label>
            </fieldset>
            <div>
              <label htmlFor="password-input">Password</label>
              <input
                id="password-input"
                name="password"
                defaultValue={actionData?.fields?.password}
                type="password"
                aria-invalid={
                  Boolean(
                    actionData?.fieldErrors?.password
                  ) || undefined
                }
                aria-errormessage={
                  actionData?.fieldErrors?.password
                    ? "password-error"
                    : undefined
                }
              />
              {actionData?.fieldErrors?.password ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="password-error"
                >
                  {actionData.fieldErrors.password}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="password-confirmation-input">Confirm Your Password</label>
              <input
                id="password-confirmation-input"
                name="password-confirmation"
                defaultValue={actionData?.fields?.passwordConfirmation}
                type="password"
                aria-invalid={
                  Boolean(
                    actionData?.fieldErrors?.passwordConfirmation
                  ) || undefined
                }
                aria-errormessage={
                  actionData?.fieldErrors?.passwordConfirmation
                    ? "password-confirmation-error"
                    : undefined
                }
              />
              {actionData?.fieldErrors?.passwordConfirmation ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="password-confirmation-error"
                >
                  {actionData.fieldErrors.passwordConfirmation}
                </p>
              ) : null}
            </div>
            <div id="form-error-message">
              {actionData?.formError ? (
                <p
                  className="form-validation-error"
                  role="alert"
                >
                  {actionData.formError}
                </p>
              ) : null}
            </div>
            <button type="submit" className="button">
              Submit
            </button>
          </form>
        </div>
        <div className="links">
        <ul>
          <li>
            Already have an account? <Link to="/login"> Log In</Link>
          </li>
        </ul>
      </div>
      </div>
    );
  }