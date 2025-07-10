// models/SupportRequest.js
const db = require("../config/database");

const SupportRequest = {
  async create({ name, email, message }) {
    const [id] = await db("support_requests").insert({ name, email, message });
    return { id, name, email, message };
  },
};

module.exports = SupportRequest;