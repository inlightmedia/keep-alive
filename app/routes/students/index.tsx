import type { Song, StudentProfile, User, UserPracticeDay } from '@prisma/client';
import { useEffect, useState } from 'react';
import { ActionFunction, Form, Link, LoaderFunction, redirect, useLoaderData } from "remix";
import { db } from "~/utils/db.server";
import * as luxon from 'luxon';
import { useStopwatch } from 'react-timer-hook';
import { useAudio } from '../../utils/hooks';
import { getUser, requireUserId } from '~/utils/session.server';

type LoaderData = {
    user: User;
    studentProfile: StudentProfile & {
        practiceDays: (UserPracticeDay & {
            songsPracticed: Song[];
            songsToPractice: Song[];
        })[];
        listOfSongs: Song[];
    };
    songListItems: {
        id: string,
        name: string
    }[];
    currentPracticeDay: UserPracticeDay & {
        songsToPractice: {
            id: string,
            name: string
        }[],
        songsPracticed: Song[]
    } | null
};

const createPreviousMissingPracticeDays = async ({studentProfileId}: {studentProfileId: string}) => {
  const maximumDaysBackToCheck = 30;
    let daysBackToCheck = 1;
  let dayExists: boolean = false;
  
  if (!studentProfileId) {
      return null;
  }

  while (dayExists === false && daysBackToCheck <= maximumDaysBackToCheck) {
    dayExists = !!await db.userPracticeDay.findFirst({
      where: {
        date: luxon.DateTime.local().minus({days: daysBackToCheck}).startOf('day').toISO(),
        studentProfile: {
          id: studentProfileId
        }
      }
    })

    if (!dayExists) {
      await db.userPracticeDay.create({
        data: {
          date: luxon.DateTime.local().minus({days: daysBackToCheck}).startOf('day').toISO(),
          studentProfile: {
            connect: { id: studentProfileId }
          }
        }
      })
    }

    daysBackToCheck += 1;
  }
}

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Sorry, could not load student home page.
    </div>
  );
}


export const loader: LoaderFunction = async ({
  request,
}) => {
  await requireUserId(request);

  const authenticatedUser = await getUser(request);
  
  if (!authenticatedUser) throw new Error("User not found");
  
  const user = await db.user.findUnique({
    where: { id: authenticatedUser.id },
    include: {
        studentProfile: {
            include: {
                listOfSongs: {
                  orderBy: {
                    name: 'asc'
                  }
                },
                practiceDays: {
                  where: {
                    date: luxon.DateTime.local().startOf('day').toISO()
                  },
                  include: {
                    songsPracticed: {
                      orderBy: {
                        name: 'asc'
                      }
                    },
                    songsToPractice: true
                  }
                }
            }
        }
    }
  });
  
  if (!user) {
      // Note: We know already the user is logged in by this point
      throw new Error('Could not fetch user');
  }
  
  if (!user.studentProfile) {
      throw new Error('Expected user to be a student');
  }

  const userPracticeDay = await db.userPracticeDay.findFirst({
    where: {
      date: luxon.DateTime.local().startOf('day').toISO(),
      studentProfile: {
            id: user.studentProfile.id
      }
    }
  });

  if (!userPracticeDay) {
    await db.userPracticeDay.create({
      data: {
        date: luxon.DateTime.local().startOf('day').toISO(),
        studentProfile: {
            connect: {
                id: user.studentProfile.id
            }
        }
      }
    });
    await createPreviousMissingPracticeDays({ studentProfileId: user.studentProfile.id })
  }
  

  const getPracticeSongs = (numberOfSongsToPractice: number, listOfSongsOnUser: Song[]) => {
    const listOfRandomSongs = listOfSongsOnUser.sort(() => 0.5 - Math.random()).slice(0, numberOfSongsToPractice);
    return listOfRandomSongs;
  }

  if (user.studentProfile.practiceDays?.[0]?.songsToPractice.length === 0) {
    await db.userPracticeDay.update({
      where: {
        id: user.studentProfile.practiceDays?.[0]?.id
      },
      data: {
        songsToPractice: {
          connect: getPracticeSongs(user.studentProfile.numberOfSongsToPracticePerDay, user.studentProfile.listOfSongs).map(song => ({ id: song.id}))
        }
      }
    })
  }

  const currentPracticeDay = await db.userPracticeDay.findFirst({
    where: {
      date: luxon.DateTime.local().startOf('day').toISO(),
      studentProfile: {
        id: user.studentProfile.id
      }
    },
    include: {
      songsToPractice: {
        orderBy: {
          name: 'asc'
        },
        select: {
          id: true,
          name: true,
        }
      },
      songsPracticed: true
    }
  })

  console.log('songlist', currentPracticeDay?.songsToPractice.filter(song => !currentPracticeDay.songsPracticed.map(song => song.id).includes(song.id)))

  const loaderData: LoaderData = {
    user: user,
    studentProfile: user.studentProfile,
    songListItems: currentPracticeDay?.songsToPractice.filter(song => !currentPracticeDay.songsPracticed.map(song => song.id).includes(song.id)) || [],
    currentPracticeDay
  };

  return loaderData;
};

export const action: ActionFunction = async ({
  request
}: any) => {
  const userId = await requireUserId(request);

  const user = await db.user.findUnique({
      where: { id: userId },
      include: {
          studentProfile: true
      }
  })

  if (!user) {
      throw new Error('');
  }
  
  if (!user.studentProfile) {
      throw new Error('');
  }

  const formData = await request.formData();
  const {_action, ...values} = Object.fromEntries(formData);

  if (_action === "markAsDone") {
      const fields = {
          songsPracticed: {
            connect: [{ id: values.songIdToMarkAsCompleted}]
          },
          studentProfile: {
            connect: {id: user.studentProfile.id }
          },
          date: luxon.DateTime.local().startOf('day').toISO(),
          minutesPracticed: parseInt(values.minutesPracticed, 10)
      };

      return await db.userPracticeDay.update({
        where: {
          id: values.idOfCurrentUserPracticeDay
        },
        data: fields
      });
  } else if (_action === "markAsNotDone") {
    if (!values?.songIdToMarkAsNotComplete) {
      return;
    }

    return await db.userPracticeDay.update({
      where: {
        id: values.idOfPracticeDayToRemovePracticedSongFrom
      },
      data: {
        songsPracticed: {
          disconnect: {
            id: values?.songIdToMarkAsNotComplete
          }
        }
      }
    })
  }
};

export default function UserPracticeRoute() {
  const data = useLoaderData<LoaderData>();

  // TODO: use database time practiced as the default - save seconds practiced every minute - if they refresh if goes back to the last saved time
  const {
    seconds,
    minutes,
    hours,
    isRunning,
    start,
    pause: pauseClock,
    reset,
  } = useStopwatch({});
  
  const [ practicePaused, setPracticePaused ] = useState<boolean>(false);
  const [ practiceComplete, setPracticeComplete ] = useState<boolean>(false);
  const [ sessionDurationGoalMet, setSessionDurationGoalMet ] = useState<boolean>(false);
  const [ songsCompleted, setSongsCompleted ] = useState<number>(0);
  
  const [ noteSoundToPlay, setNoteSoundToPlay ] = useState<number>(0);

  const allSongTadaaCompletionSound = useAudio('https://firebasestorage.googleapis.com/v0/b/boxholder-express.appspot.com/o/tada-sound.mp3?alt=media&token=602b7c2f-46c8-4769-a55b-ad7d0a2f752f');

  const musicalNoteSongCompletionSound = useAudio(`https://firebasestorage.googleapis.com/v0/b/boxholder-express.appspot.com/o/${noteSoundToPlay}.mp3?alt=media&token=a0de8144-cb74-4965-8576-e33afd1895fb`);

  const soundTokens = [
    {number: '9', token:'1c8b6079-631e-4118-93af-9d1992937171'},
    {number: '8', token:'01e6eeea-841f-450e-b8a0-016e0824fd75'},
    {number: '7', token:'e4ce29d5-8e46-441a-ab62-e7b6eb00761a'},
    {number: '6', token:'bc8cc4eb-0d8d-4982-93c1-be25426f60f7'},
    {number: '5', token:'352658a9-df02-4843-805a-cf753896466f'},
    {number: '4', token:'f622391c-1750-4625-beb3-6ef4d6fbccf4'},
    {number: '3', token:'20a44f4a-f0cd-47ac-b649-e6db5226c2e7'},
    {number: '2', token:'185d5cc4-765d-409a-9c19-e78a3dd39d7b'},
    // {number: '1', token:'a0de8144-cb74-4965-8576-e33afd1895fb'},
  ]

  useEffect(() => {
    if (musicalNoteSongCompletionSound) {
      console.log('noteSoundToPlay', noteSoundToPlay)
      musicalNoteSongCompletionSound.src = `https://firebasestorage.googleapis.com/v0/b/boxholder-express.appspot.com/o/${soundTokens[noteSoundToPlay].number}.mp3?alt=media&token=${soundTokens[noteSoundToPlay].token}`;
      musicalNoteSongCompletionSound?.play();
      if (noteSoundToPlay === 7) {
        setNoteSoundToPlay(0);
      } else {
        setNoteSoundToPlay(noteSoundToPlay + 1);
      }
    }
  }, [songsCompleted])

  useEffect(() => {
    if (data.songListItems.length === 0) {
      console.log('LIST IS ZERO')
      allSongTadaaCompletionSound?.play();
      pauseClock();
      setPracticeComplete(true);
    }
    console.debug('list', data.songListItems)
  }, [data.songListItems])
  
  useEffect(() => {
    if (minutes >= data.studentProfile.durationOfPracticeSessionInMinutes) {
      //TODO congratulate and turn minutes green
      setSessionDurationGoalMet(true);
    }
  }, [minutes])

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
        <div style={{ zIndex: 1, position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 40, justifyContent: 'flex-end' }}>
            <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <p style={{ marginRight: 20, color: practicePaused ? 'rgba(200,200,200,0.7)' : sessionDurationGoalMet ? 'limegreen' : '#fff' }}>{`${hours < 10 ? '0' : ''}${hours}`}:{`${minutes < 10 ? '0' : ''}${minutes}`}:{`${seconds < 10 ? '0' : ''}${seconds}`}</p>
                {isRunning &&
                <button style={{ justifySelf: 'center', justifyContent: 'center' }} className="button" onClick={() => {
                    pauseClock(); 
                    setPracticePaused(true);
                    }}
                >
                    Pause
                </button>
                }
            </div>
            </div>
        </div>
        
        {!isRunning && !practicePaused && !practiceComplete && <div
            style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'absolute',
            width: '100%',
            top: 0,
            left: 0
            }}
        >
            <h1 style={{ margin: 20 }}>Ready to Start Your Practice?!!</h1>
            <button style={{ justifySelf: 'center', justifyContent: 'center' }} className="button" onClick={() => start()}>Let's Go!</button>
        </div>}
        
        {!isRunning && practiceComplete && <div
            style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            }}
        >
            <h1 style={{ margin: 20, textAlign: 'center' }}>Well Done! <br/><br/> You practiced ALL your songs! <br/> See you tomorrow!</h1>
        </div>}
        
        {!isRunning && practicePaused && <div
            style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%'
            }}
        >
            <h1 style={{ margin: 20 }}>Your practice session is paused.</h1>
            <button style={{ justifySelf: 'center', justifyContent: 'center' }} className="button" onClick={() => {
            start();
            setPracticePaused(false);
            }}
            >
            Resume
            </button>
        </div>}

        { isRunning &&
            <>
            <h1>Today's Practice:</h1>
            <br />
            <br />
            { data.songListItems.length > 0 && <h2>Songs to Play Next</h2>}
            { data.songListItems.length === 0 && <h2 style={{ color: 'rgba(180,180,180,0.9)', textAlign: 'center', justifySelf: 'center', width: '100%', margin: '40px 0' }}>Looks like you're all done your songs!!</h2> }
            <ul>
                {data.songListItems.length > 0 && data.songListItems.map(song => {
                return (
                <li title={song.name} key={song.id}>
                    <Form method="post">
                    <input
                        type="hidden"
                        name="songIdToMarkAsCompleted"
                        value={song.id}
                    />
                    <input
                        type="hidden"
                        name="minutesPracticed"
                        value={minutes + (hours * 60)}
                    />
                    <input
                        type="hidden"
                        name="songIdToMarkAsCompleted"
                        value={song.id}
                    />
                    <input
                        type="hidden"
                        name="idOfCurrentUserPracticeDay"
                        value={data.currentPracticeDay?.id}
                    />
                    <input
                        type="hidden"
                        name="userIdOnWhichToAddCompleteSong"
                        value={data.user.id}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p className="song-name">{song.name}</p>
                        <button
                        type="submit"
                        name="_action"
                        value="markAsDone"
                        aria-label="mark-as-done"
                        onClick={() => setSongsCompleted(songsCompleted + 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color:'#ddd' }}
                        >
                        &#10003;
                        </button>
                    </div>
                    </Form>
                </li>
                );
                })}
            </ul>
            <br />
            <br />
            {data.studentProfile.practiceDays?.[0]?.songsPracticed.length > 0 && <h2>Completed Songs</h2>}
            <ul>
                {data.studentProfile.practiceDays?.[0]?.songsPracticed?.map(song => {
                return (
                <li title={song.name} key={song.id}>
                    <Form method="post">
                    <input
                        type="hidden"
                        name="songIdToMarkAsNotComplete"
                        value={song.id}
                    />
                    <input
                        type="hidden"
                        name="idOfPracticeDayToRemovePracticedSongFrom"
                        value={data.studentProfile.practiceDays?.[0]?.id}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p className="song-name">{song.name}</p>
                        <button
                        type="submit"
                        name="_action"
                        value="markAsNotDone"
                        aria-label="mark-as-not-done"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color:'#ddd' }}
                        >
                        ⨉
                        </button>
                    </div>
                    </Form>
                </li>
                );
                })}
            </ul>
            </>
        }
      </div>
    </>
  );
return null;
}