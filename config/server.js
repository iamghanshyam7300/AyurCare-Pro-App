// Change this IP ONLY here
const IP = "192.168.137.92";
const PORT = "5000";

// Base HTTP URL for REST API
export const BASE_URL = `http://${IP}:${PORT}`;

// Socket URL
export const SOCKET_URL = `http://${IP}:${PORT}`;

// Old server() function for backward compatibility (optional)
export function server() {
  return BASE_URL;
}
