import { LinksFunction, LoaderFunction } from "remix";
import { Link, Outlet, useLoaderData } from "remix";
import { db } from "~/utils/db.server";
import React, { useState, useEffect, useRef } from 'react';
import {Song, User} from '@prisma/client';
import CountDownTimer from '@inlightmedia/react-countdown-timer';
import moment from 'moment';

type LoaderData = {
  songListItems: Array<Pick<Song, | 'id' | 'name'>>;
  users: User[];
};

export const loader: LoaderFunction = async () => {
  const data: LoaderData = {
    songListItems: await db.song.findMany({select: {
      id: true,
      name: true,
    }}),
    users: await db.user.findMany({
      orderBy: {
        name: "asc"
      }
    })
  };
  return data;
};



export default function Index() {
  const data: LoaderData = useLoaderData<LoaderData>();
  
  const getPracticeSongs = (numberOfSongsToPractice: number) => {
    const listOfFiveRandomSongs = data.songListItems.sort(() => 0.5 - Math.random()).slice(0, numberOfSongsToPractice);
    return listOfFiveRandomSongs;
  }
  
  const [ listOfFiveRandomSongs, setListOfFiveRandomSongs ] = useState<Song[]>([]);
  const [ shouldShowTimer, setShouldShowTimer ] = useState<boolean>(false);
  const [ currentCountDownTime, setCurrentCountDownTime ] = useState<string>('');
  const [ counterIsPaused, setCounterIsPaused ] = useState<boolean>(false);
  const [ selectedUser, setSelectedUser ] = useState<User>();

  const prevRef = useRef('');
  const prevCurrentCountDownTime = prevRef.current;

  useEffect(() => {
    prevRef.current = currentCountDownTime;

    if (!prevCurrentCountDownTime && currentCountDownTime) {
      setShouldShowTimer(true);
    }
  }, [currentCountDownTime, prevCurrentCountDownTime]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Select User Account</h1>
      {
        data.users.map(user => {
          return (
            <React.Fragment key={user.name}>
              <div 
                style={{
                  padding: 10,
                  minWidth: 400,
                  maxWidth: 500,
                  height: 40,
                  cursor: 'pointer',
                  border: '1px solid white !important',
                  backgroundColor: 'darkgrey',
                }}
                onClick={() => {
                  setSelectedUser(user);
                }}
              
              >
                {user.name}
              </div>
            </React.Fragment>
          )
        })      
      }      

    
        
      { selectedUser &&
        <>
          <h1>Keep Your Playlist Alive!</h1>
          <p>Fetch My Songs to Practice Today</p>
          <button onClick={() => setListOfFiveRandomSongs(getPracticeSongs(5))}>Fetch</button>

          <h2>List of Songs to Practice Today</h2>
          <ul>
            {listOfFiveRandomSongs.map(song => {
              return <li key={song.id}>{song.name}</li>
            })}
          </ul>

          <h2>Hi {selectedUser?.name}, Start Your Practice!</h2>
          
          <button onClick={() => { 
            setCurrentCountDownTime(moment().add(10, 'seconds').add(2, 'seconds').toISOString());
            setShouldShowTimer(true);
          }}>
            Start
          </button>
          { shouldShowTimer &&
            <>
            <CountDownTimer
              dateTime={currentCountDownTime}
              onCountdownCompletion={() => {
                setCurrentCountDownTime('');
                alert('DONE!');
                setShouldShowTimer(false);
              }}
              timerTextColor="white"
            />
          </>
          }
          {/* {  
            <button onClick={() => {
              setShouldShowTimer(false);
              setCurrentCountDownTime(moment(currentCountDownTime).add(6, 'seconds').toISOString())
              setTimeout(
                () => {
                  setCounterIsPaused(false);
                  setShouldShowTimer(true);
                }, 6000);
              setCounterIsPaused(true);
              }
            }
            >
            {counterIsPaused ? 'will unpause after one minute' : 'PAUSE FOR ONE MINUTE' }
          </button>
          } */}
        </>
      }
    </div>
      
  );
}

// PAUSE BUTTON STARTS A COUNTER AND ADDS TO THE TIME - WHEN UNPAUSED THE TIME GETS ADDED TO THE COUNTDOWN TIMER

// SELECT YOUR USER PAGE

// HAVE A CHECKBOX BY EACH SONG SO YOU CAN CHECK IT OFF IF YOU'VE PLAYED IT
// THE CHECKLIST COULD BE IN THE APP THIS WAY

// COULD HAVE TEAMS OF USERS AND A LEADER BOARD FOR WHO HAS PRACTICED THE MOST SONGS AND THE MOST CONSECUTIVE DAYS, LONGEST STREAK, ETC

// NEW PLAY BASED TIMER IDEA
// WHEN AUDIO IS DETECTED PAST A CERTAIN LEVEL THE TIMER TURNS GREEN AND STARTS COUNTING UP FOR 5 SECONDS - EACH TIME AUDIO IS DETECTED IT MARKS THE TIME AND EVERY 5 OR 10 SECONDS THE APP CHECKS TO SEE IF THERE WAS AUDIO IN THE LAST 5 TO 10 SECONDS AND IF SO IT KEEPS COUNTING
// IF NO AUDIO IS DETECTED FOR THE PAST 5 TO 10 SECONDS IT STOPS COUNTING AND TURNS RED

// HEADPHONES
// COULD HAVE AMAZON AFFILIATE LINKS ON HOW TO PURCHASE A SPLITTER SO HEADPHONES AND TABLET/PHONE/COMPUTER CAN BE PLUGGED IN TO THE PIANO AT THE SAME TIME

// finish every song per week? IF THE SONG HAS ALREADY BEEN PRACTICED THAT WEEK THEN DECREASE IT'S CHANCE OF BEING RESELECTED

// add a day off? SUNDAY?