require("dotenv").config();
const { Bot, HttpError, GrammyError } = require("grammy");
const { gfycat } = require("gfycat-api");
const regex = /(?:https?:\/\/)?(?:www\.)?(?:gfycat\.com)\/[^\s]+/gi;

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// Commands

bot.command("start", async (ctx) => {
  await ctx
    .reply("*Welcome!* ✨ Send a Gfycat link.", {
      parse_mode: "Markdown",
    })
    .then(console.log("New user added:", ctx.from))
    .catch((e) => console.error(e));
});

bot.command("help", async (ctx) => {
  await ctx
    .reply(
      "*@anzubo Project.*\n\n_This bot downloads gifs from Gfycat.\nSend a link to try it out!_",
      { parse_mode: "Markdown" }
    )
    .then(console.log("Help command sent to", ctx.from.id))
    .catch((e) => console.error(e));
});

bot.on("msg", async (ctx) => {
  try {
    console.log("Query received:", ctx.msg.text, "from", ctx.from.id);
    if (!regex.test(ctx.msg.text)) {
      await ctx.reply("*Send a valid Gfycat link.*", {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.msg.message_id,
      });
    } else {
      const status = await ctx.reply(`*Downloading*`, {
        parse_mode: "Markdown",
      });
      const urls = ctx.msg.text.match(regex);
      const urlsIndexed = urls.map((url, index) => `${index}: ${url}`);
      console.log(urls);
      for (let i = 0; i < urls.length; i++) {
        const id = ctx.msg.text.split("/").pop().split("-")[0];
        const post = await gfycat.getPost(id);
        const link = post.sources.find((obj) => obj.type === "mp4").url;
        await ctx.replyWithVideo(link, {
          reply_to_message_id: ctx.msg.message_id,
          caption: `[${post.title}](${urls})`,
          parse_mode: "Markdown",
        });
      }
      setTimeout(async () => {
        bot.api.deleteMessage(ctx.from.id, status.message_id);
      }, 3000);
    }
  } catch (error) {
    console.error(error);
    await ctx.reply("An error occured");
  }
});

// Error

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(
    "Error while handling update",
    ctx.update.update_id,
    "\nQuery:",
    ctx.msg.text
  );
  ctx.reply("An error occurred");
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

// Run

bot.start();
