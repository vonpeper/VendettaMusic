import { db } from "./src/lib/db";

async function test() {
  try {
    const songs = await db.song.findMany({ take: 1 });
    console.log("Songs table exists, found:", songs.length);
    
    const setlists = await db.setlist.findMany({ take: 1 });
    console.log("Setlists table exists, found:", setlists.length);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
