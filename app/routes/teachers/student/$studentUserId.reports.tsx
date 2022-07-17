import type { Song, User, UserPracticeDay } from '@prisma/client';
import { Link, LoaderFunction, redirect, useCatch, useLoaderData, useParams } from "remix";
import { db } from "~/utils/db.server";
import * as luxon from 'luxon';
import { AxisOptions, Chart } from 'react-charts';
import {useMemo} from 'react';
import { DateTime } from 'luxon';
import { verifyTeacherAuthorization, requireUserId } from '~/utils/session.server';

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Sorry, could not load this student's student reports page.
    </div>
  );
}

type StudentProfile = { listOfSongs: Song[], practiceDays: Array<UserPracticeDay & {songsPracticed: Song[]}>};

type LoaderData = { studentUser: User, studentProfile: StudentProfile };

export const loader: LoaderFunction = async ({
  params,
  request
}) => {
  await requireUserId(request);

  await verifyTeacherAuthorization(request);

  const studentUser = await db.user.findUnique({
    where: { id: params.studentUserId },
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
              date: {
                gte: luxon.DateTime.local().minus({ days: 30 }).toISO(),
                lte: luxon.DateTime.local().toISO()
              }
            },
            orderBy: [
              { date: 'asc' }
            ],
            include: {
              songsPracticed: {
                orderBy: {
                  name: 'asc'
                }
              }
            }
          }
        }
      }
    }
  });

  if (!studentUser) {
    throw new Response("Sorry, the student you selected could not be found.", {
      status: 404
    });
  }
  if (!studentUser.studentProfile) throw new Error("Expected selected student to be a student");

  const loaderData: LoaderData = {
    studentUser,
    studentProfile: studentUser.studentProfile
  };

  return loaderData;
};

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  if (caught.status === 404) {
    return (
      <div className="error-container">
        Could not find student user "{params.studentUserId}"?
      </div>
    );
  }
  throw new Error(`Unhandled error: ${caught.status}`);
}

export default function UserReportsRoute() {
  const data = useLoaderData<LoaderData>();

  type DailySongPractice = {
    date: string,
    numberOfSongsPracticed: number
  }
  
  type DailySongPracticeSeries = {
    label: string,
    data: DailySongPractice[]
  }
  
  const convertDateToString = (date: Date): string => {
    const stringDate = JSON.parse(JSON.stringify(date))
    return stringDate
  }

  const practiceDays = data.studentProfile.practiceDays.map(day => {
    return {
      date: DateTime.fromISO(convertDateToString(day.date)).toLocaleString({ month: 'long', day: 'numeric' }),
      minutesPracticed: day.minutesPracticed,
      numberOfSongsPracticed: day.songsPracticed.length
    }
  });

  const songsPracticedChartData: DailySongPracticeSeries[] = [{
    label: 'Songs practiced', // TODO separate songs practiced and minutes practiced into different chart data
    data: practiceDays
  }];

  const songsPracticedDates = useMemo(
    (): AxisOptions<DailySongPractice>[] => [{
      getValue: datum => datum.date,
    }],
    []
  );
  
  const songsPracticed = useMemo(
    (): AxisOptions<DailySongPractice> => (
      {
        getValue: datum => datum.numberOfSongsPracticed,
        scaleType: 'linear',
      }
    ),
    []
  );

  type DailyMinutePractice = {
    date: string,
    minutesPracticed: number,
  }
  
  type DailyMinutePracticeSeries = {
    label: string,
    data: DailyMinutePractice[]
  }
  
  const minutesPracticedChartData: DailyMinutePracticeSeries[] = [{
    label: 'Minutes practiced', // TODO separate songs practiced and minutes practiced into different chart data
    data: practiceDays
  }];
  
  const minutesPracticed = useMemo(
    (): AxisOptions<DailyMinutePractice> => (
      {
        getValue: datum => datum.minutesPracticed,
        scaleType: 'linear',
      }
    ),
    []
  );
  
  const minutesPracticedDates = useMemo(
    (): AxisOptions<DailyMinutePractice>[] => [
      {
        getValue: datum => datum.date,
      },
    ],
    []
  );
    
  const getAmountPracticed = (songId: string) => {
    let amountPracticed = 0;
    data.studentProfile.practiceDays.forEach(day => {
      day.songsPracticed.forEach(songPracticed => {
        if (songPracticed.id === songId) {
          amountPracticed += 1;
        }
      })
    });
    return amountPracticed;
  }
    
    // TODO: Use this data to determine which songs should be added to the daily list in case some songs are practiced less
    // If a song is practiced less than the average give it an edge in randomizer, if it practiced more than average give it a penalty in randomizer
    // Makes sure they are playing all the songs.
    // songs that they don't do well on they are expected to practice for longer not necessarily more often
    
    // TODO: find way to determine how long they spent per song and find a way to not blank out the clock if they refresh the page - save the time to the db for the day and continue where they left off when they restart on that day
    
    type PracticeDataPerSong = {
      song: Song,
      amountPracticed: number,
    }
    
    type SongPracticeAmountSeries = {
      label: string,
      data: PracticeDataPerSong[]
    }

    const practiceAmountForEachSong = data.studentProfile.listOfSongs.map(song => {
      console.log('song', song)
      return {
      song,
      amountPracticed: getAmountPracticed(song.id)
    }
  });

  const songPracticeAmountData: SongPracticeAmountSeries[] = [{
    label: 'Song Practice Amounts',
    data: practiceAmountForEachSong
  }];

  const songsForPracticeAmount = useMemo(
    (): AxisOptions<PracticeDataPerSong>[] => [{
      getValue: datum => datum.song.name,
      position: 'left',
    }],
    []
  );
  
  const amountPracticed = useMemo(
    (): AxisOptions<PracticeDataPerSong> => (
      {
        getValue: datum => datum.amountPracticed,
        position: 'bottom',
        scaleType: 'linear',
      }
    ),
    []
  );

  return (
    <div style={{ padding: 40 }}>
      <div style={{ zIndex: 1, position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 40, justifyContent: 'space-between' }}>
        <div>
          <Link prefetch="intent" style={{ marginRight: 20 }} className="button" to={'/teachers'}>&#10094;</Link>
          BACK
        </div>
      </div>
      <h2>{data.studentUser.name}{data.studentUser.name[data.studentUser.name.length - 1] === 's' ? `'` : `'s`} Minutes Practiced Per Day</h2>
      <p style={{ marginBottom: 30, marginTop: 0, fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>(Last 30 Days)</p>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 0, height: 550, width: '100%', border: '30px solid transparent' }}>
        {/* <Chart
          options={{
            data: minutesPracticedChartData,
            primaryAxis: minutesPracticed,
            secondaryAxes: minutesPracticedDates,
            dark: true
          }}
        /> */}
      </div>
      <br />
      <h2>{data.studentUser.name}{data.studentUser.name[data.studentUser.name.length - 1] === 's' ? `'` : `'s`} Number of Songs Practiced Per Day</h2>
      <p style={{ marginBottom: 30, marginTop: 0, fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>(Last 30 Days)</p>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 0, height: 550, width: '100%', border: '30px solid transparent' }}>
        {/* <Chart
          options={{
            data: songsPracticedChartData,
            primaryAxis: songsPracticed,
            secondaryAxes: songsPracticedDates,
            dark: true
          }}
        /> */}
      </div>
      <br />
      <h2>{data.studentUser.name}{data.studentUser.name[data.studentUser.name.length - 1] === 's' ? `'` : `'s`} Songs Practiced</h2>
      <p style={{ marginBottom: 30, marginTop: 0, fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>(Last 30 Days)</p>
      <table style={{ border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', padding: 30 }}>
          <thead style={{ border: '1px solid rgba(255,255,255,0.2)', height: '30px' }}>
            <tr>
              <th style={{ border: '1px solid rgba(255,255,255,0.2)', width: 'auto' }}></th>
              {data.studentProfile.practiceDays.map(day => {
                return (
                  <th key={day.id} style={{border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', width: '45px'}}>
                    {DateTime.fromISO(convertDateToString(day.date)).toLocaleString({ day: 'numeric' })}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {data.studentProfile.listOfSongs.map((songForRow, index) => {
              return (
                <tr key={songForRow.id} style={{ backgroundColor: index % 2 ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.2)', height: '30px' }}>
                  <td style={{ padding: '0 15px', border: '1px solid rgba(255,255,255,0.2)' }}>
                    {songForRow.name}
                  </td>
                  {data.studentProfile.practiceDays.map(day => {
                    return (
                      <td key={day.id} style={{ border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', width: '45px'}}>
                        {
                          day.songsPracticed.filter(practicedSong => {
                            return songForRow.id === practicedSong.id
                          }).length > 0 ? 'X' : ''
                        }
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr>
            </tr>
          </tbody>
      </table>
      <br />
      <h2>{data.studentUser.name}{data.studentUser.name[data.studentUser.name.length - 1] === 's' ? `'` : `'s`} Practice Amount for Each Song</h2>
      <p style={{ marginBottom: 30, marginTop: 0, fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>(Last 30 Days)</p>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 0, height: data.studentProfile.listOfSongs.length * 30, width: '100%', border: '30px solid transparent' }}>
        {/* <Chart
          options={{
            data: songPracticeAmountData,
            primaryAxis: amountPracticed,
            secondaryAxes: songsForPracticeAmount,
            dark: true
          }}
        /> */}
      </div>
    </div>
  );
}