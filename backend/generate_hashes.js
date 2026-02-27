const bcrypt = require("bcryptjs");

async function main() {
  const ownerHash = await bcrypt.hash("owner@123", 10);
  const centerHash = await bcrypt.hash("center@123", 10);

  console.log("Owner Hash:", ownerHash);
  console.log("Center Hash:", centerHash);
}

main();
