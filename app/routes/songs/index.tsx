import { json, useLoaderData, ActionFunction, useActionData, LoaderFunction, redirect, Form, useCatch } from "remix";
import { db } from "~/utils/db.server";
import { Song } from '@prisma/client';
import { requireUserId } from "~/utils/session.server";

type LoaderData = {
  songListItems: Array<Pick<Song, | 'id' | 'name'>>;
};

export const loader: LoaderFunction = async () => {
  const data: LoaderData = {
    songListItems: await db.song.findMany({select: {
      id: true,
      name: true,
    }})
  };
  return data;
};

function validateSongName(content: string) {
    if (content.length < 3) {
      return `Your song title is too short.`;
    }
    if (!content) {
        return `Please provide a song name.`
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

export const action: ActionFunction = async ({
    request
  }: {
    request: Request
  }) => {
    const form = await request.formData();
    const method = form.get('_method');
    
    requireUserId( request, '/songs' );
    
    if (method === 'delete') {
      const songIdToDelete = form.get("songIdToDelete");
      if (
        typeof songIdToDelete !== "string"
      ) {
          return badRequest({
              formError: `Form not submitted correctly.`,
          });      
      }
      const song = await db.song.findUnique({
        where: { id: songIdToDelete },
      });
      if (!song) {
        throw new Response('Song does not exist and cannot be deleted', {
          status: 404
        });
      }

      await db.song.delete({ where: { id: songIdToDelete } });
      return redirect("/songs");
    } else if (method === 'add') {
      const name = form.get("name");

      if (
        typeof name !== "string"
      ) {
          return badRequest({
              formError: `Form not submitted correctly.`,
          });      
      }
      const fieldErrors = {
          name: validateSongName(name),
      };
    
      const fields = { name };
    
      if (Object.values(fieldErrors).some(Boolean)) {
          return badRequest({ fieldErrors, fields });
      }
  
      const song = await db.song.create({ data: fields });
  
      return redirect(`/songs`);
    } else {
      throw new Response(`The method, ${method}, is not a valid form method for this route.`)
    }
};

function NewSongForm({ actionData }: any) {
    return (
        <div>
          <h2 style={{ marginBottom: 20}}>Add a Song</h2>
          <Form method="post">
            <div>
                <label>
                    Name:&nbsp;
                    <input
                      type="hidden"
                      name="_method"
                      value="add"
                    />
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
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      {
        <>
          <h1>All Songs</h1>
          <ul>
            {data.songListItems.map(song => {
              return (
                <li key={song.id}>
                  {song.name}
                  <Form method="post">
                    <input type="hidden" name="_method" value="delete" />
                    <input type="hidden" name="songIdToDelete" value={song.id} />
                    <button type="submit">
                      Delete
                    </button>
                  </Form>
                </li>
              );
            })}
          </ul>
          <br />
          <NewSongForm actionData={actionData} />
        </>
      }
    </div>
      
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  switch (caught.status) {
    case 400: {
      return (
        <div className="error-container">
          What you're trying to do is not allowed.
        </div>
      );
    }
    case 404: {
      return (
        <div className="error-container">
          Looks like we could not find the song you were looking for.
        </div>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="error-container">Sorry, look like there was a problem...</div>
  );
}