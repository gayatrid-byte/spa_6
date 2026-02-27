// Minimal WebSocket accessor stub
// If real-time is wired up elsewhere, this can be replaced to return the actual Socket.IO server instance.
let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance; // may be null if not initialized; callers should guard
}

module.exports = { getIo, setIo };
