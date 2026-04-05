(function () {
  if (document.getElementById("ai-grid")) return;

  const grid = document.createElement("canvas");
  grid.id = "ai-grid";

  grid.style.position = "fixed";
  grid.style.top = "0";
  grid.style.left = "0";
  grid.style.width = "100vw";
  grid.style.height = "100vh";
  grid.style.zIndex = "999999997";
  grid.style.pointerEvents = "none";
  grid.style.opacity = "0.3";
  grid.style.display = "none"; // Hidden by default

  document.body.appendChild(grid);

  function drawGrid() {
    const ctx = grid.getContext("2d");
    grid.width = window.innerWidth;
    grid.height = window.innerHeight;

    ctx.clearRect(0, 0, grid.width, grid.height);
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 0.5;
    ctx.font = "10px monospace";
    ctx.fillStyle = "#00ffcc";

    const step = 50;

    for (let x = 0; x <= grid.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, grid.height);
      ctx.stroke();
      if (x % 100 === 0) ctx.fillText(x, x + 2, 10);
    }

    for (let y = 0; y <= grid.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(grid.width, y);
      ctx.stroke();
      if (y % 100 === 0) ctx.fillText(y, 2, y - 2);
    }
  }

  window.addEventListener("resize", drawGrid);
  drawGrid();

  // Listen for messages to toggle grid
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TOGGLE_GRID") {
      grid.style.display = grid.style.display === "none" ? "block" : "none";
      if (grid.style.display === "block") drawGrid();
    }
  });
})();
