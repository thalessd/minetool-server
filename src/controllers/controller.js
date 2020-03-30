import filesize from "filesize";

export class Controller {
  isStoppedManually = true;

  constructor(io, minecraftServer) {
    this.io = io;
    this.minecraftServer = minecraftServer;
  }

  onSay(socket, str) {
    socket.on(str, (message, flags = "") => {
      this.minecraftServer.sendSay(message, flags);
    });
  }

  onKick(socket, str) {
    socket.on(str, (message, reason = "") => {
      this.minecraftServer.sendKick(message, reason);
    });
  }

  onTp(socket, str) {
    socket.on(str, (user, to) => {
      this.minecraftServer.sendTp(user, to);
    });
  }

  onCommand(socket, str) {
    socket.on(str, (command) => {
      this.minecraftServer.sendCommand(command);
    });
  }

  onServerStatus(socket, onStr, emitStr) {
    socket.on(onStr, () => {
      let serverName = this.minecraftServer.getServerProp("motd");
      serverName = serverName ? serverName : "";

      let serverDifficulty = this.minecraftServer.getServerProp("difficulty");
      serverDifficulty = serverDifficulty ? serverDifficulty : "";

      const serverStatus = {
        serverStatus: this.minecraftServer.serverStatus,
        serverName,
        serverDifficulty,
        playersOnline: this.minecraftServer.getListOnlineUser(),
      };

      socket.emit(emitStr, serverStatus);
    });
  }

  onServerRun(socket, str) {
    socket.on(str, () => {
      this.isStoppedManually = false;
      this.minecraftServer.run();
    });
  }

  onServerStop(socket, str) {
    socket.on(str, () => {
      this.isStoppedManually = true;
      this.minecraftServer.kill();
    });
  }

  onServerRestart(socket, str) {
    socket.on(str, () => {
      this.isStoppedManually = false;
      this.minecraftServer.restart();
    });
  }

  emitServerRun(str) {
    this.minecraftServer.onServerStart(() => {
      this.io.emit(str);
    });
  }

  emitServerDone(str) {
    this.minecraftServer.onServerDone(() => {
      this.io.emit(str);
    });
  }

  emitServerStop(str) {
    this.minecraftServer.onServerKill(() => {
      this.io.emit(str);
    });
  }

  emitServerError(str) {
    this.minecraftServer.onServerError(() => {
      this.io.emit(str);
    });
  }

  emitUserLogged(str) {
    this.minecraftServer.onUserLogged((data) => {
      this.io.emit(str, data);
    });
  }

  emitUserLoggedOut(str) {
    this.minecraftServer.onUserLoggedOut((data) => {
      this.io.emit(str, data);
    });
  }

  emitUserMessage(str) {
    this.minecraftServer.onMessage((data) => {
      this.io.emit(str, data);
    });
  }

  emitUserMessageWithCode(str, code) {
    this.minecraftServer.onMessageWithCode(code, (data) => {
      this.io.emit(str + code, data);
    });
  }

  emitServerStats(str) {
    this.minecraftServer.onServerStats((data) => {
      const { cpu, memory } = data;

      const memoryStr = filesize(memory, { round: 0 }); // "259 KB";
      const cpuStr = `${Math.round(cpu)}%`;

      this.io.emit(str, {
        memory: memoryStr,
        cpu: cpuStr,
      });
    });
  }

  emitServerData(str) {
    this.minecraftServer.onServerData((data) => {
      this.io.emit(str, data);
    });
  }

  cronServerRestart(cronTime, CronJob) {
    const job = new CronJob(
      cronTime,
      () => {
        if (!this.isStoppedManually) {
          this.minecraftServer.restart();
        }
      },
      null,
      false,
      "America/Fortaleza"
    );

    job.start();
  }

  inGameRestart(code, userWhiteList) {
    this.minecraftServer.onMessageWithCode(code, ({ user }) => {
      const userFinded = userWhiteList.find((uwl) => uwl === user);

      if (userFinded) {
        return this.minecraftServer.restart();
      }

      this.minecraftServer.sendSay(
        "O seu usuário não tem permissão para isso!"
      );
    });
  }
}
