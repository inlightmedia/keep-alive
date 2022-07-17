import { json, useLoaderData, ActionFunction, useActionData, LoaderFunction, redirect, Form, Link } from "remix";
import { db } from "~/utils/db.server";
import { Song, Role } from '@prisma/client';
import { getUser, requireUserId } from "~/utils/session.server";

type LoaderData = {
  userListItems: Array<Pick<Song, | 'id' | 'name'>>;
};

export const loader: LoaderFunction = async ({request}) => {
  await requireUserId(request);

  const authenticatedTeacherUser = await getUser(request);
  
  if (!authenticatedTeacherUser) throw new Error("User not found");

  const teacherUser = db.user.findUnique({
    where: {
      id:  authenticatedTeacherUser.id
    },
    include: {
      teacherProfile: true
    }
  })

  if (!teacherUser.teacherProfile) throw new Error("Expected user to be a teacher");

  const data: LoaderData = {
    userListItems: await db.user.findMany({
      where: {
        role: Role.STUDENT
      },
      select: {
        id: true,
        name: true,
      }}
    )
  };
  return data;
};

function validateUserName(content: string) {
    if (content.length < 3) {
      return `Your user name is too short.`;
    }
    if (!content) {
        return `Please provide a username.`
    }
}

type ActionData = {
    formError?: string;
    fieldErrors?: {
      name: string | undefined;
    };
    fields?: {
      name: string;
    };
  };

const badRequest = (data: ActionData) =>
    json(data, { status: 400 });

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Sorry, could not load teacher home page.
    </div>
  );
}

export const action: ActionFunction = async ({
    request
  }: any) => {
    await requireUserId(request);
    const form = await request.formData();
    const name = form.get("name");
    const numberOfSongsToPracticePerDay = form.get("numberOfSongsToPracticePerDay");
    const durationOfPracticeSessionInMinutes = form.get("durationOfPracticeSessionInMinutes");
  
    if (
      typeof name !== "string"
    ) {
        return badRequest({
            formError: `Form not submitted correctly.`,
        });      
    }
  
    const fieldErrors = {
        name: validateUserName(name),
    };
    
    const fields = {
      name,
      studentProfile: {
        durationOfPracticeSessionInMinutes, 
        numberOfSongsToPracticePerDay,
      }
    };
  
    if (Object.values(fieldErrors).some(Boolean)) {
        return badRequest({ fieldErrors, fields });
    }

    const user = await db.user.create({ data: fields });

    return redirect(`/users/new`);
};

function NewUserForm({actionData}: any) {
    return (
        <div>
          <h2 style={{ marginBottom: 20}}>Add a User</h2>
          <Form method="post" action="/users/new">
            <div>
                <label>
                    Name:&nbsp;
                    <input
                        type="text"
                        name="name"
                        defaultValue={actionData?.fields?.name}
                        aria-invalid={
                            Boolean(actionData?.fieldErrors?.name) ||
                            undefined
                        }
                        aria-errormessage={
                            actionData?.fieldErrors?.name
                            ? "name-error"
                            : undefined
                        }
                        autoFocus
                    />
                </label>
                {actionData?.fieldErrors?.name ? (
                    <p
                        className="form-validation-error"
                        role="alert"
                        id="name-error"
                    >
                    { actionData.fieldErrors.name }
                    </p>
                ) : null}
                <div style={{ marginTop: 20 }}>
                  <label>
                    No. of Songs to Practice: <input type="number" name="numberOfSongsToPracticePerDay" />
                  </label>
                </div>
                <div style={{ marginTop: 20 }}>
                  <label>
                    Practice Duration (minutes): <input type="number" name="durationOfPracticeSessionInMinutes" />
                  </label>
                </div>
                
                <div style={{ marginTop: 40}}>
                    <button style={{ cursor: "pointer" }} type="submit" className="button">
                        Add
                    </button>
                </div>
            </div>
          </Form>
        </div>
      );
    }
    


export default function Index() {
  const data: LoaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  return (
    <>
      <div style={{ position: 'relative', zIndex: 1000, padding: 20, alignItems: 'center', width: '100%', height: 80, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
        {/* <h2>{`${data.teacher.name}`}</h2> */}
          {/* data.teacher */ true ? (
            <div>
              <form action="/logout" method="post">
                <button style={{ maxWidth: 100 }} type="submit" className="button">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
      </div>
      <div style={{ padding: 40, fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
        {
          <div>
            <h1>My Students</h1>
            <ul>
              {data.userListItems.map(studentUser => {
                return (
                  <li
                    style={{
                      display: 'flex',
                      justifyContent: "space-between",
                      padding: 20,
                      alignItems: 'center'
                    }} 
                    key={studentUser.id}
                  >
                    <p style={{ marginRight: 20 }}>{studentUser.name}</p>
                    <div>
                      <Link style={{ marginRight: 10 }} prefetch="intent" to={`/teachers/student/${studentUser.id}/edit`} className="button"><i style={{ marginRight: 10 }} className="fas fa-pencil" />Manage</Link>
                      {/* <Link style={{ marginRight: 10, pointerEvents: false ? 'none' : 'auto'}} prefetch="intent" to={`/users/${user.id}/practice`} className="button"><i className="fas fa-piano" /></Link> */}
                      <Link style={{ marginRight: 10, pointerEvents: false ? 'none' : 'auto'}} prefetch="intent" to={`/teachers/student/${studentUser.id}/reports`} className="button"><i style={{ marginRight: 10 }} className="fas fa-chart-line"/>Reports</Link>
                    </div>
                  </li>
                )
              })}
            </ul>
            <br />
            {/* <NewUserForm actionData={actionData} /> */}
          </div>
        }
      </div>
    </>
  );
}