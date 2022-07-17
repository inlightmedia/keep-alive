import { ActionFunction, Form } from "remix";
import { redirect } from "remix";
import { db } from "~/utils/db.server";

export const action: ActionFunction = async ({
  request
}: any) => {
  const form = await request.formData();
  const name = form.get("name");
  const numberOfSongsToPracticePerDay = form.get("numberOfSongsToPracticePerDay");
  const durationOfPracticeSessionInMinutes = form.get("durationOfPracticeSessionInMinutes");

  // we do this type check to be extra sure and to make TypeScript happy
  // we'll explore validation next!
  if (
    typeof name !== "string"
  ) {
    throw new Error(`Form not submitted correctly.`);
  }

  const fields = { name, numberOfSongsToPracticePerDay, durationOfPracticeSessionInMinutes };

  const user = await db.user.create({ data: fields });
  console.log({user});
  return redirect(`/teachers`);
};

export default function NewUserRoute() {
    return (
      <div>
        <p>Add a User</p>
        <Form method="post">
          <div>
            <label>
              Name: <input type="text" name="name" />
            </label>
          </div>
          <div>
            <label>
              Number Of Songs To Practice Daily: <input type="number" name="numberOfSongsToPracticePerDay" />
            </label>
          </div>
          <div>
            <label>
              Duration of Practice Session: <input type="number" name="durationOfPracticeSessionInMinutes" />
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
