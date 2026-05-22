module.exports = {
  apps: [
    {
      name: "vendetta",
      script: "node",
      args: "dist/server.js",
      cwd: "/home/jose/apps/vendetta",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
