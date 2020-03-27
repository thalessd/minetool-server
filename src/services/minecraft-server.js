import { spawn } from "child_process";
import path from "path";
import { EventEmitter } from "events";
import moment from "moment";

export class MinecraftServer {
  server = null;

  EVENT_TYPE = {
    KILLED: "KILLED",
    STARTED: "STARTED",
    RUNNING: "RUNNING",
    ERRORED: "ERRORED",
    USER_LOGGED: "USER_LOGGED",
    USER_LOGGED_OUT: "USER_LOGGED_OUT",
    USER_MESSAGE_WITH_CODE: "USER_MESSAGE_WITH_CODE",
    USER_MESSAGE: "USER_MESSAGE",
  };

  logs = false;

  isOnline = false;

  listOnlineUser = [];

  constructor(minecraftServerPath) {
    this.minecraftServerPath = minecraftServerPath;
    this.event = new EventEmitter();
  }

  run = () => {
    const serverFilePath = path.normalize(this.minecraftServerPath);
    const serverFolderPath = path.dirname(serverFilePath);

    if (this.server) return;

    this.server = spawn(`java`, ["-jar", serverFilePath, "nogui"], {
      cwd: serverFolderPath,
    });

    this.server.stdout.on("data", this._data);

    this.server.stderr.on("data", this._error);

    this.event.emit(this.EVENT_TYPE.STARTED);
  };

  kill = () => {
    if (this._processStopped()) return;

    this.server.stdin.pause();
    this.server.kill();

    this.event.emit(this.EVENT_TYPE.KILLED);

    this.server = null;

    this.isOnline = false;
  };

  restart = () => {
    if (this._processStopped()) {
      return this.run();
    }

    this.kill();
    this.run();
  };

  _processStopped = () => !this.server || this.server.connected;

  _error = (data) => {
    const strData = data.toString();

    if (this.logs) process.stdout.write(`\u001b[31m${strData}\u001b[0m`);

    this.event.emit(this.EVENT_TYPE.ERRORED, strData);

    this.isOnline = false;
  };

  _data = (data) => {
    const strData = data.toString();

    if (this.logs) process.stdout.write(`\u001b[33m${strData}\u001b[0m`);

    let logLine = strData.split("]: ")[1];

    logLine = logLine.trim();

    this._emitter(logLine);
  };

  _emitter = (logLine) => {
    const serverIsDone = (str) => str.match(/^Done \([\w.]*\)!.+$/);

    const userLogged = (str) =>
      str.match(
        /^([\w_ ]+)\[\/([\d.]+):([\d]+)] logged in with entity id ([\d]+) at \(([\d-.]+), ([\d-.]+), ([\d-.]+)\)$/
      );

    const userLoggedOut = (str) => str.match(/^([\w_ ]+) left the game$/);

    const userMessageWithCode = (str) =>
      str.match(/^<([\w_ ]+)>[ ](#[\w_]+)[ ]?(.*)$/);

    const userMessage = (str) => str.match(/^<([\w_ ]+)>[ ](.*)$/);

    const evt = this.event;
    const type = this.EVENT_TYPE;

    let result;

    result = serverIsDone(logLine);
    if (result) {
      this.isOnline = true;
      return evt.emit(type.RUNNING);
    }

    result = userLogged(logLine);
    if (result)
      return evt.emit(type.USER_LOGGED, {
        user: result[1],
        ip: result[2],
        port: result[3],
        entityId: result[4],
        coord: {
          x: Math.round(result[5]),
          y: Math.round(result[6]),
          z: Math.round(result[7]),
        },
        date: moment.now(),
      });

    result = userLoggedOut(logLine);
    if (result)
      return evt.emit(type.USER_LOGGED_OUT, {
        user: result[1],
        date: moment.now(),
      });

    result = userMessageWithCode(logLine);
    if (result)
      return evt.emit(type.USER_MESSAGE_WITH_CODE, {
        user: result[1],
        code: result[2],
        message: result[3],
      });

    result = userMessage(logLine);
    if (result)
      return evt.emit(type.USER_MESSAGE, {
        user: result[1],
        message: result[2],
      });
  };

  _sendCommand = (command) => {
    if (this._processStopped()) return;
    this.server.stdin.write(`${command}\n`);
  };

  // Senders

  sendSay = (message, flags = "") => {
    this._sendCommand(`say ${flags} ${message}`);
  };

  sendKick = (user, reason = "") => {
    this._sendCommand(`kick ${user} ${reason}`);
  };

  // Listeners

  onServerStart = (run) => {
    this.event.on(this.EVENT_TYPE.STARTED, run);
  };

  onServerDone = (run) => {
    this.event.on(this.EVENT_TYPE.RUNNING, run);
  };

  onUserLogged = (run) => {
    this.event.on(this.EVENT_TYPE.USER_LOGGED, (data) => {
      this.listOnlineUser.push(data);
      run(data);
    });
  };

  onUserLoggedOut = (run) => {
    this.event.on(this.EVENT_TYPE.USER_LOGGED_OUT, (data) => {
      const index = this.listOnlineUser.findIndex(
        (lou) => lou.user === data.user
      );
      this.listOnlineUser.splice(index, 1);
      run(data);
    });
  };

  onMessageWithCode = (codeStr, run) => {
    this.event.on(this.EVENT_TYPE.USER_MESSAGE_WITH_CODE, (data) => {
      if (data.code === `#${codeStr}`) run(data);
    });
  };

  onMessage = (run) => {
    this.event.on(this.EVENT_TYPE.USER_MESSAGE, run);
  };

  onServerError = (run) => {
    this.event.on(this.EVENT_TYPE.ERRORED, run);
  };

  onServerKill = (run) => {
    this.event.on(this.EVENT_TYPE.KILLED, run);
  };

  // Getters

  getListOnlineUser = () => {
    return this.listOnlineUser;
  };
}
