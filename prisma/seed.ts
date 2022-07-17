import { PrismaClient, Role } from "@prisma/client";
const db = new PrismaClient();

async function seed() {
  // await Promise.all(
  //   getAllSongs().map(song => {
  //     return db.song.create({ data: song });
  //   })
  // );
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
    {name: 'Chester Chills Out'},
    {name: 'Alma Mater Blues'},
    {name: 'Family Dreams'},
    {name: 'Night Storm'},
    {name: 'Dreams Come True'},
    {name: 'Honey Dew'},
    {name: 'Christowel'},
    {name: 'Auld Lang Syne'},
    {name: 'Danny Boy'},
    {name: 'Amazing Grace'},
    {name: 'Star Spangled Banner'},
  ];
}

function getAllUsers() {
    return [
      {
        name: 'Owen',
        username: 'owendyck',
        studentProfile: {
          create: {
            numberOfSongsToPracticePerDay: 15,
            durationOfPracticeSessionInMinutes: 20,
          },
        },
        role: Role.STUDENT,
        passwordHash: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u",
      },
      {
        name: 'Super Teacher',
        username: 'superteacher',
        role: Role.TEACHER,
        passwordHash: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u",
        teacherProfile: {
          create: {
            // students: {
            //     connect: [{
            //       id: '3849391e-e139-4fa1-bb04-a8e238bd4ff4'
            //     }],
            // },
          }
        },
      },
      {
        name: 'Smart Teacher',
        username: 'smartteacher',
        role: Role.TEACHER,
        passwordHash: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u",
        teacherProfile: {
          create: {
          
          }
        },
      },
      {
        name: 'Lucas',
        username: 'lucasdyck',
        studentProfile: {
          create: {
            numberOfSongsToPracticePerDay: 15,
            durationOfPracticeSessionInMinutes: 20,
          },
        },
        role: Role.STUDENT,
        passwordHash: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u",
      },
      {
        name: 'Enessa',
        username: 'enessadyck',
        studentProfile: {
          create: {
            numberOfSongsToPracticePerDay: 15,
            durationOfPracticeSessionInMinutes: 20,
          },
        },
        role: Role.STUDENT,
        passwordHash: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u",
      },
      {
        name: 'Allia',
        username: 'alliadyck',
        studentProfile: {
          create: {
            numberOfSongsToPracticePerDay: 15,
            durationOfPracticeSessionInMinutes: 20,
          },
        },
        role: Role.STUDENT,
        passwordHash: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u",
      },
      {
        name: 'Ethan',
        username: 'ethandyck',
        studentProfile: {
          create: {
            numberOfSongsToPracticePerDay: 15,
            durationOfPracticeSessionInMinutes: 20,
          },
        },
        role: Role.STUDENT,
        passwordHash: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u",
      },
      {
        name: 'Daddy',
        username: 'daddy',
        studentProfile: {
          create: {
            numberOfSongsToPracticePerDay: 15,
            durationOfPracticeSessionInMinutes: 20,
          },
        },
        role: Role.STUDENT,
        passwordHash: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u",
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