import { Markup } from "telegraf";
import { songs } from "../songs.js";
import { searchTrackByName } from "./search-track-by-name.js";
import fetch from "node-fetch";
import fs from "fs";
import { pipeline } from "stream/promises";

export const playGuessGame = async (ctx) => {
  const track = await searchTrackByName(
    songs[Math.floor(Math.random() * songs.length)]
  );

  if (!track || !track.previewUrl) {
    return ctx.reply("We couldn't find a song for you.");
  }

  let options = songs.filter(
    (name) => name !== `${track.name} - ${track.artist}`
  );
  options = shuffleArray(options).slice(0, 3);

  options.push(`${track.name} - ${track.artist}`);
  options = shuffleArray(options);

  const userId = ctx.from.id;
  const filepath = `./temp_${userId}.mp3`;
  const response = await fetch(track.previewUrl);
  await pipeline(response.body, fs.createWriteStream(filepath));
  await ctx.replyWithAudio(
    { source: fs.createReadStream(filepath) },
    { title: "Guess this one", performer: "It's a secret!" }
  );

  ctx.session = ctx.session || {};
  ctx.session.correctAnswer = `${track.name} - ${track.artist}`;
  ctx.session.guessOptions = options;
  ctx.session.attempts = 0;

  await ctx.reply(
    "Choose the correct song:",
    Markup.inlineKeyboard(
      options.map((option, i) => Markup.button.callback(option, `guess_${i}`))
    )
  );
};

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
