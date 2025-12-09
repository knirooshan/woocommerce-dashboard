const { getCentralConnection } = require("./connectionManager");
const EmailQueueSchema = require("../models/central/EmailQueue");
const { transportSystemEmail } = require("./emailService");

let isProcessing = false;

const processQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const conn = getCentralConnection();
    // Ensure model is registered
    const EmailQueue =
      conn.models.EmailQueue || conn.model("EmailQueue", EmailQueueSchema);

    // Find one pending email
    // checking for pending or retrying failed ones (if we implemented retry logic properly)
    // For now, simple pending
    const job = await EmailQueue.findOne({
      status: "pending",
      nextAttempt: { $lte: new Date() },
    }).sort({ createdAt: 1 });

    if (job) {
      // Update to processing
      job.status = "processing";
      await job.save();

      try {
        await transportSystemEmail(
          job.to,
          job.subject,
          job.text,
          job.html,
          job.attachments
        );

        job.status = "completed";
        await job.save();
      } catch (error) {
        console.error(`Job ${job._id} failed:`, error.message);
        job.status = "failed";
        job.error = error.message;
        job.attempts += 1;

        // Simple retry logic: try up to 3 times
        if (job.attempts < 3) {
          job.status = "pending";
          job.nextAttempt = new Date(Date.now() + 5 * 60 * 1000); // retry in 5 mins
        }

        await job.save();
      }
    }
  } catch (error) {
    console.error("Queue processor error:", error);
  } finally {
    isProcessing = false;
  }
};

const initQueueProcessor = () => {
  setInterval(processQueue, 5000);
};

module.exports = { initQueueProcessor };
