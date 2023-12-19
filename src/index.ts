import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from "dotenv";
dotenv.config();
const { ACCESS_KEY_ID_R2, SECRET_ACCESS_KEY } = process.env;

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://fa43f69e990ae1f4e09957574ec9e738.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID_R2 || '',
    secretAccessKey: SECRET_ACCESS_KEY || '',
  },
});

async function asyncCall() {
  console.log(
    await S3.send(
      new ListBucketsCommand('')
    )
  );
}

asyncCall();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
});

client.once("ready", () => {
  console.log("Discord bot is ready! 🤖");
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

client.login(config.DISCORD_TOKEN);