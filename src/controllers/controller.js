import { CronJob } from "cron";

export class Controller {
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

  onServerStatus(socket, onStr, emitStr) {
    socket.on(onStr, () => {
      const serverStatus = {
        serverOnline: this.minecraftServer.isOnline,
        playersOnline: this.minecraftServer.getListOnlineUser(),
      };

      socket.emit(emitStr, serverStatus);
    });
  }

  onServerRun(socket, str) {
    socket.on(str, () => {
      this.minecraftServer.run();
    });
  }

  onServerStop(socket, str) {
    socket.on(str, () => {
      this.minecraftServer.kill();
    });
  }

  onServerRestart(socket, str) {
    socket.on(str, () => {
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

  cronServerRestart(cronTime, CronJob) {
    const job = new CronJob(
      cronTime,
      () => {
        this.minecraftServer.restart();
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

      if (userFinded.length) {
        return this.minecraftServer.restart();
      }

      this.minecraftServer.sendSay(
        "O seu usuário não tem permissão para isso!"
      );
    });
  }
}
