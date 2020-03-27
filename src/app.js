import "moment/locale/pt-br";
import env from "dotenv";
import { MinecraftServer } from "./services/minecraft-server";
import { Constants } from "./constants/constants";
import readline from "readline";

env.config();

function blueLog(str) {
  console.log(`\u001b[36m${str}\u001b[0m`);
}

console.bLog = blueLog;

async function app() {
  try {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    const minecraftServer = new MinecraftServer(
      Constants.MINECRAFT_SERVER_PATH()
    );

    minecraftServer.logs = true;

    // Test Events
    minecraftServer.onServerStart(() => {
      console.log("O Servidor abriu");
    });

    minecraftServer.onServerDone(() => {
      console.log("O Servidor está rodando");
    });

    minecraftServer.onUserLogged((data) => {
      console.log("Dados do Usuário Logado", data);
    });

    minecraftServer.onUserLoggedOut((data) => {
      console.log("Dados do Usuário Deslogado", data);
    });

    minecraftServer.onMessageWithCode("nota", (data) => {
      console.log("Mensagem com código vinda do jogo", data);
    });

    minecraftServer.onMessage((data) => {
      console.log("Mensagem vinda do jogo", data);
    });

    minecraftServer.onServerKill(() => {
      console.log("O Servidor foi morto");
    });

    minecraftServer.onServerError(() => {
      console.log("O Servidor está com erro.");
    });

    minecraftServer.run();

    // Test Interface
    process.stdin.on("keypress", (str, key) => {
      if (key.ctrl && key.name === "c") {
        return process.exit();
      }

      switch (key.name) {
        case "1":
          console.bLog("Iniciou o Server");
          minecraftServer.run();
          return;
        case "2":
          console.bLog("Reiniciou o Server");
          minecraftServer.restart();
          return;
        case "3":
          console.bLog("Matou o Server");
          minecraftServer.kill();
          process.exit();
          return;
        case "4":
          console.bLog("Enviar Mensagem");
          minecraftServer.sendSay("Teste de Say em jogo");
          return;
        case "5":
          console.bLog("Mostrar Lista de Usuários Online");
          console.log(minecraftServer.getListOnlineUser());
          return;
        case "6":
          console.bLog("Kickar usuário do Server");
          minecraftServer.sendKick("thalessd", "Usuário Insano");
          return;
        default:
          return;
      }
    });
  } catch (e) {
    throw e;
  }
}

app().catch(console.error);
