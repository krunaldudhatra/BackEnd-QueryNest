const mongoose = require("mongoose");
const User = require("./Models/User"); // Adjust path as needed

async function removeExpiredUnverifiedUsers() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const result = await User.deleteMany({
      verified: false,
      otpExpires: { $lte: tenMinutesAgo }, // OTP expired + 10 minutes
    });
    if (result.deletedCount) {
      console.log(`🗑️ Deleted ${result.deletedCount} expired, unverified users.`
      );
    }
  } catch (error) {
    console.error("❌ Error removing expired users:", error);
  }
}

// Schedule the cleanup to run every 5 minutes
function startCleanupJob() {
  console.log("🛡️ Starting user cleanup job...");

  // Initial run
  removeExpiredUnverifiedUsers();

  // Repeat every 5 minutes
  setInterval(removeExpiredUnverifiedUsers, 5 * 60 * 1000);
}

module.exports = startCleanupJob; // Export the function
