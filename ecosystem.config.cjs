module.exports = {
  apps: [
    {
      name: "renamailer",
      script: "./app.js",
      instances: 1,
      exec_mode: "fork",
      // exec_mode: "cluster",
      watch: ["routes", "models", "config", "./app.js"],
      ignore_watch: [
        "node_modules",
        "logs",
        "dist",
        ".idea",
        ".vscode",
        ".git/*",
        "public",
        "test",
        "Dockerfile",
      ],
      env: {
        TZ: "Asia/Seoul",
      },
    },
  ],
};
