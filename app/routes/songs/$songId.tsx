import { LoaderFunction, useCatch } from "remix";
import { Link, useLoaderData } from "remix";
import type { Song } from '@prisma/client';
import { db } from "~/utils/db.server";

type LoaderData = {song: Song};

export const loader: LoaderFunction = async ({
    params,
}) => {
    const song = await db.song.findUnique({
        where: { id: params.songId },
    });

    if (!song) {
      throw new Response("Sorry, we could not find your selected song.", {
        status: 404
      })
    }

    const loaderData: LoaderData = { song };

    return loaderData;
};

export default function SongRoute() {
    const data = useLoaderData<LoaderData>();
  
    return (
      <div>
        <p>This is a song:</p>
        <p>{data.song.name}</p>
        <Link prefetch="intent" to=".">{data.song.name} Permalink</Link>
      </div>
    );
  }

  export function CatchBoundary() {
    const caught = useCatch();
  
    if (caught.status === 404) {
      return (
        <div className="error-container">
          Selected song could not be found.
        </div>
      );
    }
    throw new Error(
      `Unexpected caught response with status: ${caught.status}`
    );
  }