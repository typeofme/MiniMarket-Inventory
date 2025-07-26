// Modular Report Logic for MiniMarket (ES module version)
// This script is intended to be imported as a module

// Remove all sample data and report rendering logic from this file.
// All report data and rendering is handled in report-list.html via fetch from backend.

// Notification
window.addProductNotification = function (report) {
  const displayName = report.product_name || report.name || "Report";
  if (typeof NotificationModal !== "undefined" && window.notificationSystem) {
    window.notificationSystem.add({
      title: "New Report Added",
      message: `${displayName} has been added to your inventory`,
      type: "success",
      time: new Date(),
    });
  } else if (window.Toast) {
    window.Toast.success(
      `Report created: ${displayName} has been added successfully and stock updated`
    );
  }
};

window.editProductNotification = function (report) {
  const displayName = report.product_name || report.name || "Report";
  if (typeof NotificationModal !== "undefined" && window.notificationSystem) {
    window.notificationSystem.add({
      title: "Reports Updated",
      message: `${displayName} has been updated in your inventory`,
      type: "info",
      time: new Date(),
    });
  } else if (window.Toast) {
    window.Toast.success(
      `Report updated: ${displayName} has been updated successfully`
    );
  }
};

window.deleteProductNotification = function (report) {
  const displayName = report.product_name || report.name || "Report";
  if (typeof NotificationModal !== "undefined" && window.notificationSystem) {
    window.notificationSystem.add({
      title: "Reports Deleted",
      message: `${displayName} has been removed from your inventory`,
      type: "error",
      time: new Date(),
    });
  } else if (window.Toast) {
    window.Toast.success(
      `Report deleted: ${displayName} has been removed and stock restored`
    );
  }
};

function setupNotifications() {
  if (typeof NotificationModal !== "undefined") {
    window.notificationSystem = new NotificationModal({
      position: "top-right",
      maxNotifications: 10,
      autoHideTimeout: 3000,
    });
    setTimeout(() => {
      const notificationButton = document.getElementById("notification-btn");
      if (notificationButton) {
        window.notificationSystem.setTrigger("#notification-btn");
        window.notificationSystem.add({
          title: "New Order Received",
          message: "Customer Adit placed an order for 5 items",
          type: "success",
          time: new Date(Date.now() - 15 * 60 * 1000),
        });
        window.notificationSystem.add({
          title: "Low Stock Alert",
          message: "Indomie Goreng is running low on stock (5 remaining)",
          type: "warning",
          time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        });
      }
    }, 500);
  }
}

function loadNotifications() {
  const script = document.createElement("script");
  script.src = "/components/dashboard/notification-modal.js";
  script.onload = function () {
    setupNotifications();
  };
  script.onerror = function () {};
  document.head.appendChild(script);
}

export function afterComponentsLoaded() {
  setTimeout(() => {
    loadNotifications();
  }, 0);
}

// --- Report Page Utility Functions ---
export function initSidebarToggle() {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
      const sidebar = document.querySelector(".sidebar");
      const overlay = document.getElementById("sidebar-overlay");
      if (window.innerWidth <= 640) {
        sidebar.classList.toggle("mobile-active");
        overlay.classList.toggle("active");
      } else {
        document.body.classList.toggle("sidebar-closed");
      }
    });
  }
  const overlay = document.getElementById("sidebar-overlay");
  if (overlay) {
    overlay.addEventListener("click", function () {
      document.querySelector(".sidebar").classList.remove("mobile-active");
      this.classList.remove("active");
    });
  }
  window.addEventListener("resize", function () {
    if (window.innerWidth <= 640) {
      document.body.classList.remove("sidebar-closed");
    } else if (window.innerWidth <= 1024) {
      document.querySelector(".sidebar")?.classList.remove("mobile-active");
      document.getElementById("sidebar-overlay")?.classList.remove("active");
    }
  });
}

export async function loadReportStats() {
  try {
    // Fetch all reports
    const res = await fetch("/api/reports");
    const reports = await res.json();
    // Get today's date in YYYY-MM-DD
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    let totalDailySales = 0;
    let totalSalesAllTime = 0;
    let allRows = "";
    reports.forEach((r) => {
      totalSalesAllTime += Number(r.sold);
      // Only count today's sales for totalDailySales
      const reportDate = r.created_at ? r.created_at.slice(0, 10) : "";
      if (reportDate === todayStr) {
        totalDailySales += Number(r.sold);
      }
      allRows += `<tr><td class='px-4 py-2'>${reportDate}</td><td class='px-4 py-2'>${r.product_name}</td><td class='px-4 py-2 text-center'>${r.sold}</td><td class='px-4 py-2 text-center'>${r.damaged}</td><td class='px-4 py-2 text-center'>${r.missing}</td></tr>`;
    });
    document.getElementById("total-daily-sales").textContent = totalDailySales;
    document.getElementById("total-sales-all-time").textContent =
      totalSalesAllTime;
    document.getElementById("all-report-table-body").innerHTML =
      allRows ||
      `<tr><td colspan='5' class='text-center text-gray-400 py-4'>No reports found.</td></tr>`;
  } catch (err) {
    console.error("Failed to load report stats", err);
  } finally {
    // Dispatch event when table data is loaded
    document.dispatchEvent(new Event("report-tables-loaded"));
  }
}