import { Telegraf, Markup, session } from "telegraf";
import { playGuessGame } from "./functions/play-guess-game.js";
import { loadUserScores, updateUserScore } from "./functions/user-score.js";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

bot.command("guess", async (ctx) => {
  await playGuessGame(ctx);
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (!data.startsWith("guess_")) return;

  ctx.session = ctx.session || {};
  ctx.session.attempts = ctx.session.attempts ?? 0;

  const idx = parseInt(data.slice(6), 10);
  const options = ctx.session.guessOptions || [];
  const userAnswer = options[idx];
  const correctAnswer = ctx.session.correctAnswer;

  if (!correctAnswer || !options.length) {
    await ctx.answerCbQuery("No active game. Try /guess again.");
    return;
  }

  ctx.session.attempts += 1;
  if (!ctx.session.score) ctx.session.score = 0;

  if (userAnswer === correctAnswer) {
    let scoreToAdd = 0;
    if (ctx.session.attempts === 1) scoreToAdd = 3;
    else if (ctx.session.attempts === 2) scoreToAdd = 2;
    else if (ctx.session.attempts === 3) scoreToAdd = 1;

    ctx.session.score += scoreToAdd;

    updateUserScore(ctx.from.id, ctx.session.score, {
      username: ctx.from.username,
      first_name: ctx.from.first_name,
    });

    const updatedKeyboard = options.map((option) =>
      Markup.button.callback(
        option === correctAnswer ? `✅ ${option}` : `❌ ${option}`,
        "disabled"
      )
    );
    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(updatedKeyboard));

    await ctx.answerCbQuery(
      `That's right! 🎉 You earned ${scoreToAdd} point(s).`
    );

    await playGuessGame(ctx);
  } else {
    await ctx.answerCbQuery("❌ Wrong! Try again.");
  }
});

bot.command("stop", async (ctx) => {
  if (!ctx.session) return await ctx.reply("No active game to stop.");
  ctx.session = null;
  await ctx.reply("Quiz stopped.");
});

bot.command("score", async (ctx) => {
  const scores = loadUserScores();
  const score = scores[ctx.from.id] || 0;
  await ctx.reply(`Your score: ${score.score} points🏆`);
});

import { getTopScores } from "./functions/user-score.js";

bot.command("leaderboard", async (ctx) => {
  const top = getTopScores(10);

  if (top.length === 0) {
    await ctx.reply("🏆 Leaderbord is empty. Play to get in top!");
    return;
  }

  let message = "🏆 Top 10 players:\n\n";

  top.forEach(([userId, score], index) => {
    const isCurrentUser = userId === ctx.from.id;
    message += `${index + 1}. ${isCurrentUser ? "👉" : ""}${score.name} — ${
      score.score
    } points\n`;
  });

  await ctx.reply(message);
});

bot.launch();

const app = express();
app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
