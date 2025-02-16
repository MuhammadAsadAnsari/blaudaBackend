let io;

module.exports = {
  init: (httpServer) => {
    // io = require('socket.io')
    (
      httpServer,
      /*   {
        path: '/custom',
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 20000,
        autoConnect: true,
        query: {},
        // options of the Engine.IO client
        upgrade: true,
        forceJSONP: false,
        jsonp: true,
        forceBase64: false,
        enablesXDR: false,
        timestampRequests: true,
        timestampParam: 't',
        policyPort: 843,
        transports: ['polling', 'websocket'],
        transportOptions: {},
        rememberUpgrade: false,
        onlyBinaryUpgrades: false,
        requestTimeout: 0,
        protocols: [],
        // options for Node.js
        agent: false,
        pfx: null,
        key: null,
        passphrase: null,
        cert: null,
        ca: null,
        ciphers: [],
        rejectUnauthorized: false,
        perMessageDeflate: true,
        forceNode: false,
        localAddress: null,
      } */
      {
        cors: {
          origin: '*',
        },
      }
    );
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};

