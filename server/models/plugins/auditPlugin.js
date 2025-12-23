const { getContext } = require("../../utils/requestContext");

const auditPlugin = (schema) => {
  // Helper to get ActivityLog model from connection
  const getActivityLogModel = (doc) => {
    const conn = doc.constructor.db || doc.db;
    if (!conn) return null;
    return (
      conn.models.ActivityLog ||
      conn.model("ActivityLog", require("../ActivityLog"))
    );
  };

  schema.pre("save", async function (next) {
    this.$locals.wasNew = this.isNew;
    this.$locals.modifiedPaths = this.modifiedPaths();
    this.$locals.originalValues = {};

    // For updates, fetch the original document from database to get true old values
    if (!this.isNew && this.$locals.modifiedPaths.length > 0) {
      try {
        const original = await this.constructor.findById(this._id).lean();
        if (original) {
          this.$locals.modifiedPaths.forEach((path) => {
            this.$locals.originalValues[path] = original[path];
          });
        }
      } catch (error) {
        console.error("Error fetching original values for audit:", error);
      }
    }
    next();
  });

  // Capture original document before update for query middleware
  schema.pre(/findOneAnd(Update|Replace)/, async function () {
    try {
      const query = this.getQuery();
      this._originalDoc = await this.model.findOne(query).lean();
    } catch (error) {
      console.error("Error fetching original doc in pre-update:", error);
    }
  });

  schema.post("save", async function (doc) {
    try {
      if (doc.constructor.modelName === "ActivityLog") return;

      const user = getContext("user");
      const ip = getContext("ip");
      const userAgent = getContext("userAgent");
      const method = getContext("method");
      const url = getContext("url");

      const action = this.$locals.wasNew ? "create" : "update";
      const changes = {};

      if (action === "update") {
        this.$locals.modifiedPaths.forEach((path) => {
          // Skip internal fields
          if (path.startsWith("_") || path === "updatedAt") return;

          // Store both old and new values
          changes[path] = {
            old: this.$locals.originalValues[path],
            new: doc.get(path),
          };
        });
      } else {
        // For create, log the whole doc (excluding internal fields if needed)
        Object.keys(doc.toObject()).forEach((key) => {
          if (key.startsWith("_") || key === "createdAt" || key === "updatedAt")
            return;
          changes[key] = { new: doc.get(key) };
        });
      }

      // Only log if there are changes or it's a create
      if (Object.keys(changes).length > 0 || action === "create") {
        const ActivityLog = getActivityLogModel(doc);
        if (ActivityLog) {
          await ActivityLog.create({
            user: user ? user._id : null,
            action,
            collectionName: doc.constructor.modelName,
            documentId: doc._id,
            changes,
            ip,
            userAgent,
            method,
            url,
          });
        }
      }
    } catch (error) {
      console.error("Audit Plugin Error:", error);
    }
  });

  // Handle findOneAndUpdate, findByIdAndUpdate, etc.
  schema.post(/findOneAnd(Update|Replace)/, async function (doc) {
    try {
      if (!doc || doc.constructor.modelName === "ActivityLog") return;

      const user = getContext("user");
      const ip = getContext("ip");
      const userAgent = getContext("userAgent");
      const method = getContext("method");
      const url = getContext("url");

      const ActivityLog = getActivityLogModel(doc);
      if (!ActivityLog) return;

      let changes = { _note: "Update via query (diff not available)" };

      if (this._originalDoc) {
        // Fetch the updated document to compare
        const updatedDoc = await this.model
          .findById(this._originalDoc._id)
          .lean();
        if (updatedDoc) {
          const diff = {};
          const allKeys = new Set([
            ...Object.keys(this._originalDoc),
            ...Object.keys(updatedDoc),
          ]);

          allKeys.forEach((key) => {
            if (
              key.startsWith("_") ||
              key === "updatedAt" ||
              key === "createdAt"
            )
              return;

            const oldVal = this._originalDoc[key];
            const newVal = updatedDoc[key];

            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              diff[key] = {
                old: oldVal,
                new: newVal,
              };
            }
          });

          if (Object.keys(diff).length > 0) {
            changes = diff;
          }
        }
      }

      await ActivityLog.create({
        user: user ? user._id : null,
        action: "update",
        collectionName: doc.constructor.modelName,
        documentId: doc._id,
        changes,
        ip,
        userAgent,
        method,
        url,
      });
    } catch (error) {
      console.error("Audit Plugin Error (query):", error);
    }
  });

  // Handle delete
  schema.post(/findOneAnd(Delete|Remove)/, async function (doc) {
    try {
      if (!doc || doc.constructor.modelName === "ActivityLog") return;

      const user = getContext("user");
      const ip = getContext("ip");
      const userAgent = getContext("userAgent");
      const method = getContext("method");
      const url = getContext("url");

      const ActivityLog = getActivityLogModel(doc);
      if (ActivityLog) {
        await ActivityLog.create({
          user: user ? user._id : null,
          action: "delete",
          collectionName: doc.constructor.modelName,
          documentId: doc._id,
          ip,
          userAgent,
          method,
          url,
        });
      }
    } catch (error) {
      console.error("Audit Plugin Error (delete):", error);
    }
  });

  schema.post(
    "deleteOne",
    { document: true, query: false },
    async function (doc) {
      try {
        if (!doc || doc.constructor.modelName === "ActivityLog") return;

        const user = getContext("user");
        const ip = getContext("ip");
        const userAgent = getContext("userAgent");
        const method = getContext("method");
        const url = getContext("url");

        const ActivityLog = getActivityLogModel(doc);
        if (ActivityLog) {
          await ActivityLog.create({
            user: user ? user._id : null,
            action: "delete",
            collectionName: doc.constructor.modelName,
            documentId: doc._id,
            ip,
            userAgent,
            method,
            url,
          });
        }
      } catch (error) {
        console.error("Audit Plugin Error (deleteOne):", error);
      }
    }
  );
};

module.exports = auditPlugin;
