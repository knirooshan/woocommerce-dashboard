const ActivityLog = require("../ActivityLog");
const { getContext } = require("../../utils/requestContext");

const auditPlugin = (schema) => {
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

  schema.post("save", async function (doc) {
    try {
      if (doc.constructor.modelName === "ActivityLog") return;

      const user = getContext("user");
      const ip = getContext("ip");
      const userAgent = getContext("userAgent");

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
        await ActivityLog.create({
          user: user ? user._id : null,
          action,
          collectionName: doc.constructor.modelName,
          documentId: doc._id,
          changes,
          ip,
          userAgent,
        });
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

      // For query middleware, 'this' is the query, 'doc' is the result
      // We can't easily get the diff here without pre-query fetch.
      // We'll log the fact that an update happened.

      await ActivityLog.create({
        user: user ? user._id : null,
        action: "update",
        collectionName: doc.constructor.modelName,
        documentId: doc._id,
        changes: { _note: "Update via query (diff not available)" }, // Placeholder
        ip,
        userAgent,
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

      await ActivityLog.create({
        user: user ? user._id : null,
        action: "delete",
        collectionName: doc.constructor.modelName,
        documentId: doc._id,
        ip,
        userAgent,
      });
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

        await ActivityLog.create({
          user: user ? user._id : null,
          action: "delete",
          collectionName: doc.constructor.modelName,
          documentId: doc._id,
          ip,
          userAgent,
        });
      } catch (error) {
        console.error("Audit Plugin Error (deleteOne):", error);
      }
    }
  );
};

module.exports = auditPlugin;
