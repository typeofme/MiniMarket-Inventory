// Modular Report Logic for MiniMarket (ES module version)
// This script is intended to be imported as a module

// Remove all sample data and report rendering logic from this file.
// All report data and rendering is handled in report-list.html via fetch from backend.

// Toast Notifications
window.addProductNotification = function (report) {
  const displayName = report.product_name || report.name || "Report";
  if (typeof window.toast !== 'undefined') {
    window.toast.success(`Report "${displayName}" has been added successfully`);
  }
};

window.editProductNotification = function (report) {
  const displayName = report.product_name || report.name || "Report";
  if (typeof window.toast !== 'undefined') {
    window.toast.info(`Report "${displayName}" has been updated successfully`);
  }
};

window.deleteProductNotification = function (report) {
  const displayName = report.product_name || report.name || "Report";
  if (typeof window.toast !== 'undefined') {
    window.toast.warning(`Report "${displayName}" has been removed from your inventory`);
  }
};

// Export function for any additional initialization needed after components load
export function afterComponentsLoaded() {
  // Any additional initialization can go here
  console.log('Report module components loaded');
}
