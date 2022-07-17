import { Role, StudentProfile, TeacherProfile, User } from '@prisma/client';
import { useEffect, useState } from 'react';
import { ActionFunction, Form, Link, LoaderFunction, redirect, useLoaderData } from "remix";
import { db } from "~/utils/db.server";
import { getUser, requireUserId } from '~/utils/session.server';

type LoaderData = {
    user: User & {
        studentProfile: ({
            teacher: ({
                id: string;
                user: {
                    name: string;
                    username: string;
                    id: string;
                };
            }) | null;
        }) | null;
    };
    teachers?: (User & {
        teacherProfile?: {
            id: string;
        } | null;
    })[];
};

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Sorry, could not load student add teacher page.
    </div>
  );
}


export const loader: LoaderFunction = async ({
  request,
}) => {
  await requireUserId(request);

  const authenticatedUser = await getUser(request);
  
  if (!authenticatedUser) throw new Error("User not found");
  
  const teachers = await db.user.findMany({
    where: {
        role: Role.TEACHER
    },
    include: {
        teacherProfile: {
            select: {
                id: true
            }
        }
    }
  });

  const studentUser = await db.user.findUnique({
    where: { id: authenticatedUser.id },
    include: {
        studentProfile: {
            select: {
                teacher: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true
                            }
                        }
                    }
                },
            }
        }
    }
  });
  
  if (!studentUser) {
      // Note: We know already the user is logged in by this point
      throw new Error('Could not fetch teacher of student');
  }
  
  if (!studentUser.studentProfile) {
      throw new Error('Expected user to be a student');
  }

  const loaderData: LoaderData = {
    user: studentUser, // TODO: NEED TO RUN DB PUSH TO UPDATE DB BASED ON NEW DATA-MODEL
    teachers
  };

  return loaderData;
};

export const action: ActionFunction = async ({
  request
}: any) => {
  const userId = await requireUserId(request);

  const studentUser = await db.user.findUnique({
      where: { id: userId },
      include: {
          studentProfile: {
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                username: true,
                                name: true
                            }
                        }
                    }
                }
            }
          }
      }
  })

  if (!studentUser) {
      throw new Error('');
  }
  
  if (!studentUser.studentProfile) {
      throw new Error('');
  }

  const formData = await request.formData();
  const {_action, ...values} = Object.fromEntries(formData);
console.log('values',values)
  if (_action === 'addTeacher') {
      return await db.studentProfile.update({
          where: {
              id: studentUser.studentProfile.id
          },
          data: {
            teacher: {
                connect: {
                    id: values.teacherId
                }
            }
         }
      });
  }
  if (_action === 'removeTeacher') {
      return await db.studentProfile.update({
          where: {
              id: studentUser.studentProfile.id
          },
          data: {
              teacher: {
                  disconnect: true
              }   
          }
      });
  }
};

export default function UserPracticeRoute() {
  const data = useLoaderData<LoaderData>();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>();

    useEffect(() => {
        if (data.user.studentProfile?.teacher && selectedTeacherId) {
            setSelectedTeacherId(undefined);
        }
    })

  return (
    <>
      <div style={{ position: 'relative', zIndex: 1000, padding: 20, alignItems: 'center', width: '100%', height: 80, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
        <h2>{`${data.user.name}`}</h2>
          {data.user ? (
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
      <div style={{ padding:40 }}>
        { 
            <>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40, borderRadius: 10, backgroundColor: 'white', flex: 1, padding: 0, border: 0, minHeight: '100%'}}>
                    <h4 style={{ margin: '0 15px 0 0', backgroundColor: 'lightgray', padding: 10, borderRadius: '10px 0 0 10px', color: 'rgba(0,0,0,0.8)', fontWeight: 200 }}>Your Teacher</h4>
                    <h3 style={{ color: 'black' }}>
                        {data.user.studentProfile?.teacher ? data.user.studentProfile?.teacher?.user.name : 'No Teacher Yet'}
                    </h3>
                </div>

                { !data.user.studentProfile?.teacher &&
                    <div style={{marginBottom: 40}}>
                        <h2>Select an available teacher:</h2>
                        { data.teachers?.map(teacher => {
                            return (
                                <div key={teacher.id} style={{ display: 'flex', width: 'calc(100% + 40px)', alignItems: 'center', backgroundColor: selectedTeacherId && selectedTeacherId === teacher.teacherProfile?.id ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: 10, position: 'relative', left: -20, paddingLeft: 20 }}>
                                    <p style={{ marginRight: 20 }} key={teacher.id}>{teacher.name}</p>
                                    <button
                                        className='button'
                                        style={{ height: 'fit-content' }}
                                        onClick={() => setSelectedTeacherId(teacher.teacherProfile?.id)}
                                    >
                                        Select
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                }

                {!data.user.studentProfile?.teacher?.id &&
                    <div>
                        <Form method="post">
                            <div style={{ display: 'flex', flexDirection: 'column'}}>
                                <input
                                    type="hidden"
                                    // disabled={true}
                                    name="teacherId"
                                    value={selectedTeacherId}
                                    style={{borderRadius: 10, minHeight: 40, minWidth: 400, fontSize: '1em', fontWeight: 200, paddingLeft: 10, marginBottom: 20}}
                                />
                                <button
                                    style={{display: 'flex', flexGrow: 0, maxWidth: 200}}
                                    type="submit"
                                    name="_action"
                                    value="addTeacher"
                                    aria-label="add-teacher"
                                    className="button"
                                >
                                    Add Teacher
                                </button>
                            </div>
                        </Form>
                    </div>
                }
                
                {data.user.studentProfile?.teacher &&
                    <div>
                        <Form method="post">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button
                                    type="submit"
                                    name="_action"
                                    value="removeTeacher"
                                    aria-label="remove-teacher"
                                    className='button'
                                >
                                    Remove Teacher
                                </button>
                            </div>
                        </Form>
                    </div>
                }
                <br />
                <br />
            </>
        }
      </div>
    </>
  );
}