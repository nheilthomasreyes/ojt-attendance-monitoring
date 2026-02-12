export default function handler(req, res) {
  const forwarded = req.headers["x-forwarded-for"];
  let clientIP = forwarded
    ? forwarded.split(",")[0]
    : req.socket.remoteAddress;

  // Remove IPv6 prefix if exists
  if (clientIP && clientIP.startsWith("::ffff:")) {
    clientIP = clientIP.replace("::ffff:", "");
  }

  const CAMPUS_PUBLIC_IP = "122.53.28.50";

  if (clientIP !== CAMPUS_PUBLIC_IP) {
    return res.status(403).json({
      authorized: false,
      ip: clientIP,
    });
  }

  return res.status(200).json({
    authorized: true,
    ip: clientIP,
  });
}
