const db = require("../config/database");
const Product = require("./Product");

const Report = {
  getAll() {
    return db("reports")
      .join("products", "reports.product_id", "products.id")
      .select(
        "reports.id",
        "products.name as product_name",
        "reports.sold",
        "reports.damaged",
        "reports.missing",
        "reports.created_at",
        "reports.updated_at"
      )
      .orderBy("reports.created_at", "desc");
  },

  findById(id) {
    return db("reports")
      .join("products", "reports.product_id", "products.id")
      .select(
        "reports.id",
        "reports.product_id",
        "products.name as product_name",
        "reports.sold",
        "reports.damaged",
        "reports.missing",
        "reports.created_at",
        "reports.updated_at"
      )
      .where("reports.id", id)
      .first();
  },

  async create(data) {
    const trx = await db.transaction();

    try {
      // Validate required fields
      if (!data.product_id) {
        throw new Error("Product ID is required");
      }

      // Extract quantities with default values
      const sold = parseInt(data.sold) || 0;
      const damaged = parseInt(data.damaged) || 0;
      const missing = parseInt(data.missing) || 0;

      // Check if product exists and has sufficient stock
      const product = await trx("products")
        .where("id", data.product_id)
        .first();
      if (!product) {
        throw new Error("Product not found");
      }

      const totalDecrease = sold + damaged + missing;
      if (totalDecrease > product.stock) {
        throw new Error(
          `Insufficient stock. Available: ${product.stock}, Required: ${totalDecrease}`
        );
      }

      // Create the report
      const [reportId] = await trx("reports").insert(data);

      // Update product stock if there are any quantities to decrease
      if (totalDecrease > 0) {
        const newStock = Math.max(0, product.stock - totalDecrease);
        await trx("products").where("id", data.product_id).update({
          stock: newStock,
          updated_at: trx.fn.now(),
        });
      }

      await trx.commit();
      return [reportId];
    } catch (error) {
      await trx.rollback();
      console.error("Error creating report:", error);
      throw error;
    }
  },

  async update(id, data) {
    const trx = await db.transaction();

    try {
      // Get the original report data
      const originalReport = await trx("reports").where({ id }).first();
      if (!originalReport) {
        throw new Error("Report not found");
      }

      // Get product information
      const product = await trx("products")
        .where("id", originalReport.product_id)
        .first();
      if (!product) {
        throw new Error("Product not found");
      }

      // Calculate the difference in quantities
      const originalTotal =
        (originalReport.sold || 0) +
        (originalReport.damaged || 0) +
        (originalReport.missing || 0);
      const newTotal =
        (parseInt(data.sold) || 0) +
        (parseInt(data.damaged) || 0) +
        (parseInt(data.missing) || 0);
      const stockDifference = newTotal - originalTotal;

      // Check if we have sufficient stock for the increase
      if (stockDifference > 0 && stockDifference > product.stock) {
        throw new Error(
          `Insufficient stock for update. Available: ${product.stock}, Additional required: ${stockDifference}`
        );
      }

      // Update the report
      const result = await trx("reports").where({ id }).update(data);

      // Update product stock if there's a difference
      if (stockDifference !== 0) {
        const newStock = Math.max(0, product.stock - stockDifference);
        await trx("products").where("id", originalReport.product_id).update({
          stock: newStock,
          updated_at: trx.fn.now(),
        });
      }

      await trx.commit();
      return result;
    } catch (error) {
      await trx.rollback();
      console.error("Error updating report:", error);
      throw error;
    }
  },

  async delete(id) {
    const trx = await db.transaction();

    try {
      // Get the report data before deletion to restore stock
      const report = await trx("reports").where({ id }).first();
      if (!report) {
        throw new Error("Report not found");
      }

      // Calculate total quantity to restore to stock
      const totalToRestore =
        (report.sold || 0) + (report.damaged || 0) + (report.missing || 0);

      // Delete the report
      const result = await trx("reports").where({ id }).del();

      // Restore stock if there were quantities in the report
      if (totalToRestore > 0 && result > 0) {
        await trx("products")
          .where("id", report.product_id)
          .increment("stock", totalToRestore)
          .update("updated_at", trx.fn.now());
      }

      await trx.commit();
      return result;
    } catch (error) {
      await trx.rollback();
      console.error("Error deleting report:", error);
      throw error;
    }
  },

  // Get today's sales and orders statistics
  async getTodayStats() {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    const result = await db("reports")
      .join("products", "reports.product_id", "products.id")
      .select(
        db.raw("SUM(reports.sold * products.price) as total_sales"),
        db.raw("COUNT(DISTINCT reports.id) as total_orders"),
        db.raw("SUM(reports.sold) as total_items_sold")
      )
      .whereRaw("DATE(reports.created_at) = ?", [today])
      .first();

    // Get yesterday's stats for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];

    const yesterdayResult = await db("reports")
      .join("products", "reports.product_id", "products.id")
      .select(
        db.raw("SUM(reports.sold * products.price) as total_sales"),
        db.raw("COUNT(DISTINCT reports.id) as total_orders")
      )
      .whereRaw("DATE(reports.created_at) = ?", [yesterdayDate])
      .first();

    const todaySales = parseFloat(result.total_sales) || 0;
    const todayOrders = parseInt(result.total_orders) || 0;
    const yesterdaySales = parseFloat(yesterdayResult.total_sales) || 0;
    const yesterdayOrders = parseInt(yesterdayResult.total_orders) || 0;

    // Calculate percentage changes
    const salesChange =
      yesterdaySales > 0
        ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
        : 0;
    const ordersChange =
      yesterdayOrders > 0 ? todayOrders - yesterdayOrders : 0;

    return {
      todaySales: todaySales.toFixed(2),
      todayOrders,
      salesChange: {
        percentage: salesChange.toFixed(1),
        direction: salesChange >= 0 ? "up" : "down",
      },
      ordersChange: {
        value: Math.abs(ordersChange),
        direction: ordersChange >= 0 ? "up" : "down",
        comparison:
          ordersChange >= 0 ? "more than yesterday" : "less than yesterday",
      },
    };
  },

  // Get market trends by category
  async getMarketTrends() {
    const today = new Date().toISOString().split("T")[0];
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekDate = lastWeek.toISOString().split("T")[0];

    // Get current week sales by category
    const currentWeekSales = await db("reports")
      .join("products", "reports.product_id", "products.id")
      .join("categories", "products.category_id", "categories.id")
      .select(
        "categories.id as category_id",
        "categories.name as category_name",
        "categories.icon as category_icon",
        "categories.color as category_color",
        db.raw("SUM(reports.sold * products.price) as total_sales"),
        db.raw("SUM(reports.sold) as total_quantity")
      )
      .whereRaw("DATE(reports.created_at) >= ?", [lastWeekDate])
      .groupBy(
        "categories.id",
        "categories.name",
        "categories.icon",
        "categories.color"
      )
      .orderBy("total_sales", "desc");

    // Get previous week sales by category for comparison
    const previousWeekStart = new Date();
    previousWeekStart.setDate(previousWeekStart.getDate() - 14);
    const previousWeekEnd = new Date();
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

    const previousWeekSales = await db("reports")
      .join("products", "reports.product_id", "products.id")
      .join("categories", "products.category_id", "categories.id")
      .select(
        "categories.id as category_id",
        db.raw("SUM(reports.sold * products.price) as total_sales")
      )
      .whereRaw(
        "DATE(reports.created_at) >= ? AND DATE(reports.created_at) < ?",
        [
          previousWeekStart.toISOString().split("T")[0],
          previousWeekEnd.toISOString().split("T")[0],
        ]
      )
      .groupBy("categories.id");

    // Create a map for easier lookup
    const previousWeekMap = {};
    previousWeekSales.forEach((item) => {
      previousWeekMap[item.category_id] = parseFloat(item.total_sales) || 0;
    });

    // Calculate trends
    const trends = currentWeekSales.map((current) => {
      const currentSales = parseFloat(current.total_sales) || 0;
      const previousSales = previousWeekMap[current.category_id] || 0;

      let changePercentage = 0;
      let direction = "neutral";

      if (previousSales > 0) {
        changePercentage =
          ((currentSales - previousSales) / previousSales) * 100;
        direction =
          changePercentage > 0
            ? "positive"
            : changePercentage < 0
              ? "negative"
              : "neutral";
      } else if (currentSales > 0) {
        changePercentage = 100;
        direction = "positive";
      }

      return {
        category_id: current.category_id,
        category_name: current.category_name,
        category_icon: current.category_icon || "fas fa-shopping-cart",
        category_color: current.category_color || "#6B7280",
        current_sales: currentSales.toFixed(2),
        total_quantity: current.total_quantity,
        change_percentage: Math.abs(changePercentage).toFixed(1),
        direction: direction,
        trend_icon:
          direction === "positive"
            ? "fas fa-arrow-up"
            : direction === "negative"
              ? "fas fa-arrow-down"
              : "fas fa-minus",
      };
    });

    return trends.slice(0, 10); // Return top 10 categories for better scrolling
  },

  // Get inventory turnover data by category
  async getInventoryTurnover() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoDate = thirtyDaysAgo.toISOString().split("T")[0];

    // Calculate turnover for each category (last 30 days)
    const turnoverData = await db("reports")
      .join("products", "reports.product_id", "products.id")
      .join("categories", "products.category_id", "categories.id")
      .select(
        "categories.id as category_id",
        "categories.name as category_name",
        "categories.icon as category_icon",
        "categories.color as category_color",
        db.raw("SUM(reports.sold) as total_sold"),
        db.raw("AVG(products.stock) as avg_stock"),
        db.raw("COUNT(DISTINCT reports.created_at) as days_with_sales")
      )
      .whereRaw("DATE(reports.created_at) >= ?", [thirtyDaysAgoDate])
      .groupBy(
        "categories.id",
        "categories.name",
        "categories.icon",
        "categories.color"
      )
      .having("total_sold", ">", 0)
      .orderBy("category_name", "asc");

    // Calculate turnover rate for each category
    const processedData = turnoverData.map((item) => {
      const totalSold = parseInt(item.total_sold) || 0;
      const avgStock = parseFloat(item.avg_stock) || 1;
      const daysWithSales = parseInt(item.days_with_sales) || 1;

      // Turnover rate = Average Stock / (Total Sold / Days)
      // This gives us how many days it takes to sell the average stock
      const dailySalesRate = totalSold / 30; // Average daily sales over 30 days
      const turnoverDays =
        dailySalesRate > 0 ? (avgStock / dailySalesRate).toFixed(1) : 999;

      return {
        category_id: item.category_id,
        category_name: item.category_name,
        category_icon: item.category_icon || "fas fa-box",
        category_color: item.category_color || "#6B7280",
        total_sold: totalSold,
        avg_stock: avgStock.toFixed(0),
        turnover_days: parseFloat(turnoverDays),
        days_with_sales: daysWithSales,
        daily_sales_rate: dailySalesRate.toFixed(1),
      };
    });

    // Sort by turnover days (fastest turnover first)
    processedData.sort((a, b) => a.turnover_days - b.turnover_days);

    // Calculate overall statistics
    const validTurnovers = processedData.filter(
      (item) => item.turnover_days < 999
    );
    const avgTurnover =
      validTurnovers.length > 0
        ? (
            validTurnovers.reduce((sum, item) => sum + item.turnover_days, 0) /
            validTurnovers.length
          ).toFixed(1)
        : 0;

    const fastestCategory =
      validTurnovers.length > 0 ? validTurnovers[0] : null;

    return {
      categories: processedData.slice(0, 8), // Return top 8 categories
      statistics: {
        average_turnover: avgTurnover,
        fastest_category: fastestCategory
          ? {
              name: fastestCategory.category_name,
              turnover_days: fastestCategory.turnover_days,
            }
          : null,
        total_categories: processedData.length,
      },
    };
  },
};

module.exports = Report;