import type { Song, StudentProfile, User } from '@prisma/client';
import { ActionFunction, Form, Link, LoaderFunction, redirect, useLoaderData } from "remix";
import { db } from "~/utils/db.server";
import { verifyTeacherAuthorization } from '~/utils/session.server';

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Sorry, could not load this student's student management page.
    </div>
  );
}

type LoaderData = { studentProfile: StudentProfile & { listOfSongs: Song[] }, songListItems: Pick<Song, 'id' | 'name'>[] , studentUser: User};

export const loader: LoaderFunction = async ({
  params,
  request
}) => {
  verifyTeacherAuthorization(request);
  
  const studentUser = await db.user.findUnique({
    where: { id: params.studentUserId },
    include: {
      studentProfile: {
        include: {
          listOfSongs: {
            orderBy: {
              name: 'asc'
            }
          }
        }
      }
    }
  });

  if (!studentUser) throw new Error("User not found");
  if (!studentUser.studentProfile) throw new Error("Expected student user type");

  const loaderData: LoaderData = {
    studentUser: studentUser,
    studentProfile: studentUser.studentProfile,
    songListItems: await db.song.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
      }
    })
  };

  return loaderData;
};


export const action: ActionFunction = async ({
  request, params
}: any) => {
  const formData = await request.formData();
  const {_action, ...values} = Object.fromEntries(formData);
  const name: string = formData.get("name");
  const numberOfSongsToPracticePerDay: string = formData.get("numberOfSongsToPracticePerDay");
  const durationOfPracticeSessionInMinutes: string = formData.get("durationOfPracticeSessionInMinutes");
  const songIdToConnect: string = formData.get("songIdToConnect");

  if (_action === "update") {
      // we do this type check to be extra sure and to make TypeScript happy
      // we'll explore validation next!
      if (
        typeof name !== "string"
      ) {
        throw new Error(`Form not submitted correctly.`);
      }
    
      const fields = {
        name,
        numberOfSongsToPracticePerDay: parseInt(numberOfSongsToPracticePerDay, 10),
        durationOfPracticeSessionInMinutes: parseInt(durationOfPracticeSessionInMinutes, 10),
        listOfSongs: {
          connect: [{ id: songIdToConnect }]
        }
      };
    
      const user = await db.user.update({
        where: {
          id: params.userId
        }, data: fields
      });
    
      return redirect(`/teachers/student/${user.id}/edit`);
  } else if (_action === "delete") {
    if (!values?.songIdToDisconnect) {
      return;
    }

    return db.user.update({
      where: {
        id: values.userIdToDisconnectSongFrom
      },
      data: {
        studentProfile: {
          update: {
            listOfSongs: {
              disconnect: {
                id: values?.songIdToDisconnect
              }
            }
          }
        }
      }
    })
  } else if (_action === "addSong") {
    if (!songIdToConnect) {
      return null;
    }  
    
    const fields = {
        studentProfile: {
          update: {
            listOfSongs: {
              connect: [{ id: songIdToConnect }]
            }
          }
        }
      };
    
      const user = await db.user.update({
        where: {
          id: params.studentUserId
        }, data: fields
      });
    
      console.log({ user });
      return redirect(`/teachers/student/${user.id}/edit`);
  }
};

const StudentSongList = ({ student }: {student: User & StudentProfile & {listOfSongs: Song[]}}) => {
  return (
    <>
      {student.listOfSongs?.length > 0 && <div>
        <ul>
          {student.listOfSongs.map(song => {
            return (
              <li title={song.name} key={song.id}>
                <Form method="post">
                  <input
                    type="hidden"
                    name="songIdToDisconnect"
                    value={song.id}
                  />
                  <input
                    type="hidden"
                    name="userIdToDisconnectSongFrom"
                    value={student.id}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p className="song-name">{song.name}</p>
                    <button
                      type="submit"
                      name="_action"
                      value="delete"
                      aria-label="delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color:'#ddd' }}
                    >
                      ⨉
                    </button>
                  </div>
                </Form>
              </li>
            )
          })}
        </ul>
      </div>}
      {student.listOfSongs.length === 0 && <p> {student.name} has no songs yet.</p>}
    </>
  );
}

const AddSongForm = ({ songsToChooseFrom }: { songsToChooseFrom: Pick<Song, 'id' | 'name'>[]}) => {
  return (
    <Form method="post">
      <div className="select-box" style={{ display: 'flex', justifyContent: 'space-between'}}>
        <select disabled={songsToChooseFrom?.length === 0} name="songIdToConnect" id="song-list" style={{width: 'calc(100% - 70px)', marginRight: 10 }}>
          <option defaultValue={""} value="">{songsToChooseFrom?.length > 0 ? 'Choose a song to add...' : 'There are no more songs to add.'}</option>
          {songsToChooseFrom.map(song => {
            return (
              <option key={song.id} value={song.id}>{song.name}</option>
            )
          })}
        </select>
        <button disabled={songsToChooseFrom?.length === 0} type="submit" name="_action" value="addSong" className="button">
          Add
        </button>
      </div>
    </Form>
  );
}

export default function EditUserRoute() {
  const data = useLoaderData<LoaderData>();

  const songsToChooseFrom = data.songListItems.filter(song => {
    const userSongIds = data.studentProfile.listOfSongs.map(song => song.id);
    return !userSongIds.includes(song.id);
  })

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
        <Link prefetch="intent" style={{ marginRight: 20 }} className="button" to={'/teachers'}>&#10094;</Link>
        BACK
      </div>
      <h1 style={{ marginBottom: 40, color: '#ddd' }}>Account Settings</h1>
      <Form method="post">
        <div>
          <label>
            <p style={{ marginBottom: 5, marginTop: 0 }}>Name:</p>
            <input defaultValue={data.studentUser.name} type="text" name="name" />
          </label>
        </div>
        <div>
          <label>
            <p style={{ marginBottom: 5, marginTop: 0 }}>Number Of Songs To Practice Daily:</p>
            <input
              defaultValue={data.studentProfile.numberOfSongsToPracticePerDay}
              type="number"
              name="numberOfSongsToPracticePerDay"
            />
          </label>
        </div>
        <div>
          <label>
          <p style={{ marginBottom: 5, marginTop: 0 }}>Duration of Practice Session:</p>
            <input
              defaultValue={data.studentProfile.durationOfPracticeSessionInMinutes}
              type="number"
              name="durationOfPracticeSessionInMinutes"
            />
          </label>
        </div>
        <div>
          <button style={{ marginTop: 20 }} type="submit" name="_action" value="update" className="button">
            Update
          </button>
        </div>
      </Form>
      <div>
          <h1 style={{ marginTop: 60, marginBottom: 20, fontFamily: 'Baloo 2', color: '#ddd', textShadow: '5px 5px 10px rgba(0,0,0,0.8)' }}>
            List of songs:
          </h1>
          <AddSongForm songsToChooseFrom={songsToChooseFrom} />
          <StudentSongList student={{...data.studentProfile, ...data.studentUser}}/>
      </div>
    </div>
  );
}