const { networkInterfaces } = require("os");
const { spawn } = require("child_process");

// 1. Detect local IPv4 address of the Wi-Fi network interface
function getLocalIp() {
  const nets = networkInterfaces();
  
  // First pass: look specifically for Wi-Fi or Wireless adapters
  for (const name of Object.keys(nets)) {
    if (name.toLowerCase().includes("wi-fi") || name.toLowerCase().includes("wireless")) {
      for (const net of nets[name]) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
  }

  // Second pass: fallback to any active non-internal IPv4 address
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "127.0.0.1";
}

const localIp = getLocalIp();
console.log(`\n🔍 Auto-detecting Wi-Fi Hotspot IP...`);
console.log(`🚀 Found IP: ${localIp}\n`);

// 2. Set the Expo packager environment variable
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = localIp;

// 3. Start Expo with LAN enabled
const child = spawn("npx", ["expo", "start", "--lan"], {
  stdio: "inherit",
  shell: true,
});

child.on("close", (code) => {
  process.exit(code);
});
