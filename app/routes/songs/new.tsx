import { ActionFunction, Form, Link, useCatch } from "remix";
import { redirect } from "remix";
import { db } from "~/utils/db.server";

export const action: ActionFunction = async ({
  request
}: any) => {
  const form = await request.formData();
  const name = form.get("name");

  // we do this type check to be extra sure and to make TypeScript happy
  // we'll explore validation next!
  if (
    typeof name !== "string"
  ) {
    throw new Error(`Form not submitted correctly.`);
  }

  const fields = { name };
  
  const songThatAlreadyExists = await db.song.findUnique({
    where: {
      name,
    }
  });

  if (!!songThatAlreadyExists) {
    return null; // TODO create form error
  }
  
  const song = await db.song.create({ data: fields });
  console.log({song});
  return redirect(`/songs`);
};

export default function NewSongRoute() {
    return (
      <div>
        <p>Add a Song</p>
        <Form method="post">
          <div>
            <label>
              Name: <input type="text" name="name" />
            </label>
          </div>
          <div>
            <button type="submit" className="button">
              Add
            </button>
          </div>
        </Form>
      </div>
    );
  }
  
export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a new song.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }
}