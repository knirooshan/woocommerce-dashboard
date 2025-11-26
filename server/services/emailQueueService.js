const EmailJob = require("../models/EmailJob");
const { sendEmail } = require("./emailService");

const addToQueue = async (emailData) => {
  try {
    const job = new EmailJob(emailData);
    await job.save();
    return job;
  } catch (error) {
    console.error("Error adding email to queue:", error);
    throw error;
  }
};

const processQueue = async () => {
  try {
    // Find one pending job, oldest first
    const job = await EmailJob.findOne({ status: "pending" }).sort({
      createdAt: 1,
    });

    if (!job) {
      // No jobs, wait for a bit
      setTimeout(processQueue, 5000);
      return;
    }

    // Mark as processing
    job.status = "processing";
    await job.save();

    try {
      await sendEmail(job.to, job.subject, job.text, job.html, job.attachments);

      job.status = "completed";
      await job.save();

      // Process next job immediately
      processQueue();
    } catch (error) {
      console.error(`Error processing email job ${job._id}:`, error);
      job.status = "failed";
      job.error = error.message;
      job.attempts += 1;
      await job.save();

      // Continue processing other jobs
      processQueue();
    }
  } catch (error) {
    console.error("Queue processor error:", error);
    // Retry after delay on system error
    setTimeout(processQueue, 5000);
  }
};

const initQueueProcessor = () => {
  console.log("Starting email queue processor...");
  processQueue();
};

module.exports = {
  addToQueue,
  initQueueProcessor,
};
