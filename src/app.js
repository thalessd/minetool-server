import "moment/locale/pt-br";
import env from "dotenv";
import socketIO from "socket.io";
import { CronJob } from "cron";
import { MinecraftServer } from "./services/minecraft-server";
import { Constants } from "./constants/constants";
import { Controller } from "./controllers/controller";

env.config();

async function app() {
  try {
    const serverPort = Constants.SERVER_PORT();

    const io = socketIO(serverPort);

    const minecraftServer = new MinecraftServer(
      Constants.MINECRAFT_SERVER_PATH()
    );

    minecraftServer.logs = true;

    const controller = new Controller(io, minecraftServer);

    // IO Emitters
    controller.emitServerRun("server_running");
    controller.emitServerDone("server_is_done");
    controller.emitServerStop("server_stopped");
    controller.emitServerError("server_errored");
    controller.emitUserLogged("user_logged");
    controller.emitUserLoggedOut("user_logged_out");
    controller.emitUserMessage("user_message");
    // controller.emitUserMessageWithCode("user_message_#", "note");
    controller.emitServerStats("server_stats");

    // IO Listners
    io.on("connection", (socket) => {
      controller.onServerRun(socket, "server_run");
      controller.onServerStop(socket, "server_stop");
      controller.onServerStatus(socket, "server_status", "server_status_data");
      controller.onServerRestart(socket, "server_restart");
      controller.onSay(socket, "say");
      controller.onKick(socket, "kick");
    });

    // Cron Process
    controller.cronServerRestart(Constants.CRON_TIME_OF_RESTART(), CronJob);

    // In Game Actions
    const userWhiteList = Constants.USERS_WITH_PERMISSION();

    controller.inGameRestart("server_restart", userWhiteList);

    //Run
    console.log(`RUNNING ON PORT ${serverPort}`);
  } catch (e) {
    throw e;
  }
}

app().catch(console.error);
