import { Client, GatewayIntentBits, Collection, REST, Routes } from "discord.js";
import { DisTube } from "distube";
import { SpotifyPlugin } from "@distube/spotify";
import { SoundCloudPlugin } from "@distube/soundcloud";
import ffmpeg from "ffmpeg-static";

// 🌟 CONFIG
const TOKEN = process.env.TOKEN; // from Render
const PREFIX = process.env.PREFIX || "!"; // default prefix
const CLIENT_ID = process.env.CLIENT_ID;

// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// DisTube setup
const distube = new DisTube(client, {
  emitNewSongOnly: true,
  leaveOnFinish: false,
  leaveOnStop: false,
  plugins: [new SpotifyPlugin(), new SoundCloudPlugin()]
});

// 🎵 Slash Commands
const commands = [
  {
    name: "play",
    description: "Play a song or playlist",
    options: [{ name: "query", type: 3, description: "Song name or link", required: true }]
  },
  { name: "skip", description: "Skip the current song" },
  { name: "stop", description: "Stop playing music" },
  { name: "pause", description: "Pause the music" },
  { name: "resume", description: "Resume the music" },
  { name: "queue", description: "Show current queue" }
];

// Register slash commands
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("❌ Error registering commands:", err);
  }
})();

// Event handlers
client.on("ready", () => console.log(`🎶 Logged in as ${client.user.tag}`));
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;
  const { commandName, options, member } = interaction;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) return interaction.reply("❗ You must be in a voice channel!");

  try {
    if (commandName === "play") {
      const query = options.getString("query");
      distube.play(voiceChannel, query, { textChannel: interaction.channel, member });
      return interaction.reply(`🎵 Searching: **${query}**`);
    }
    if (commandName === "skip") {
      distube.skip(interaction.guildId);
      return interaction.reply("⏭️ Skipped!");
    }
    if (commandName === "stop") {
      distube.stop(interaction.guildId);
      return interaction.reply("⏹️ Stopped!");
    }
    if (commandName === "pause") {
      distube.pause(interaction.guildId);
      return interaction.reply("⏸️ Paused!");
    }
    if (commandName === "resume") {
      distube.resume(interaction.guildId);
      return interaction.reply("▶️ Resumed!");
    }
    if (commandName === "queue") {
      const queue = distube.getQueue(interaction.guildId);
      if (!queue) return interaction.reply("🚫 No songs playing!");
      return interaction.reply(
        `🎶 **Queue:**\n${queue.songs.map((s, i) => `${i + 1}. ${s.name} (${s.formattedDuration})`).join("\n")}`
      );
    }
  } catch (err) {
    console.error(err);
    interaction.reply("⚠️ Error while processing command!");
  }
});

client.login(TOKEN);
