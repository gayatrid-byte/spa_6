// Dashboard module
export async function render(container) {
  // Use the new Premium Integrated BI Dashboard
  if (window.BIDashboard) {
    window.BIDashboard.init();
  } else {
    container.innerHTML = '<p class="text-center">Loading BI Dashboard...</p>';
    // Fallback or wait for it to load
    setTimeout(() => {
      if (window.BIDashboard) window.BIDashboard.init();
    }, 500);
  }
}