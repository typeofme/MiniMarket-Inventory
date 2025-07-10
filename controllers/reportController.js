const Report = require("../models/Report");

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.getAll();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReport = async (req, res) => {
  try {
    const [id] = await Report.create(req.body);
    const newReport = await Report.findById(id);
    res.status(201).json(newReport);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (report) {
      res.json(report);
    } else {
      res.status(404).json({ message: "Report not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const affectedRows = await Report.update(req.params.id, req.body);
    if (affectedRows > 0) {
      const updatedReport = await Report.findById(req.params.id);
      res.json(updatedReport);
    } else {
      res.status(404).json({ message: "Report not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const affectedRows = await Report.delete(req.params.id);
    if (affectedRows > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Report not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTodayStats = async (req, res) => {
  try {
    const todayStats = await Report.getTodayStats();
    res.json(todayStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// New method to get market trends
exports.getMarketTrends = async (req, res) => {
  try {
    const marketTrends = await Report.getMarketTrends();
    res.json(marketTrends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// New method to get inventory turnover data
exports.getInventoryTurnover = async (req, res) => {
  try {
    const turnoverData = await Report.getInventoryTurnover();
    res.json(turnoverData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};