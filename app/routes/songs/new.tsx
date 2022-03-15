import type { ActionFunction } from "remix";
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

  const song = await db.song.create({ data: fields });
  return redirect(`/songs/${song.id}`);
};

export default function NewSongRoute() {
    return (
      <div>
        <p>Add a Song</p>
        <form method="post">
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
        </form>
      </div>
    );
  }
  