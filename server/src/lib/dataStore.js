// new connection get added here, if matched find, removed from waiting pool
export const waitingPool = [];

// ws -> parter's ws
export const partners = new Map();

export function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}
