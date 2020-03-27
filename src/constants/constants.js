export class Constants {
  static MINECRAFT_SERVER_PATH() {
    return process.env.MINECRAFT_SERVER_PATH;
  }

  static USERS_WITH_PERMISSION() {
    return process.env.USERS_WITH_PERMISSION.split(",");
  }

  static CRON_TIME_OF_RESTART() {
    return process.env.CRON_TIME_OF_RESTART;
  }

  static SERVER_PORT() {
    return process.env.SERVER_PORT;
  }
}
