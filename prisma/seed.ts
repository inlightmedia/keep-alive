import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function seed() {
  await Promise.all(
    getAllSongs().map(song => {
      return db.song.create({ data: song });
    })
  );
  await Promise.all(
    getAllUsers().map(user => {
      return db.user.create({ data: user });
    })
  );
}

seed();

function getAllSongs() {
  return [
    {name: 'Ode to Joy'},
    {name: 'Dog'},
    {name: 'Jackson Blues'},
    {name: 'Alma Mater Blues'},
    {name: 'Light Blue'},
    {name: 'Night Storm'},
  ];
}

function getAllUsers() {
    return [
      {
        name: 'Owen',
        numberOfSongsToPracticePerDay: 15,
        durationOfPracticeSessionInMinutes: 20,
      },
      {
        name: 'Lucas',
        numberOfSongsToPracticePerDay: 15,
        durationOfPracticeSessionInMinutes: 20,
      },
      {
        name: 'Enessa',
        numberOfSongsToPracticePerDay: 15,
        durationOfPracticeSessionInMinutes: 20,
      },
      {
        name: 'Allia',
        numberOfSongsToPracticePerDay: 5,
        durationOfPracticeSessionInMinutes: 15,
      },
      {
        name: 'Ethan',
        numberOfSongsToPracticePerDay: 1,
        durationOfPracticeSessionInMinutes: 5,
      },
    ];
  }

    // {
    //   name: "Road worker",
    //   content: `I never wanted to believe that my Dad was stealing from his job as a road worker. But when I got home, all the signs were there.`
    // },
    // {
    //   name: "Frisbee",
    //   content: `I was wondering why the frisbee was getting bigger, then it hit me.`
    // },
    // {
    //   name: "Trees",
    //   content: `Why do trees seem suspicious on sunny days? Dunno, they're just a bit shady.`
    // },
    // {
    //   name: "Skeletons",
    //   content: `Why don't skeletons ride roller coasters? They don't have the stomach for it.`
    // },
    // {
    //   name: "Hippos",
    //   content: `Why don't you find hippopotamuses hiding in trees? They're really good at it.`
    // },
    // {
    //   name: "Dinner",
    //   content: `What did one plate say to the other plate? Dinner is on me!`
    // },
    // {
    //   name: "Elevator",
    //   content: `My first time using an elevator was an uplifting experience. The second time let me down.`
    // }