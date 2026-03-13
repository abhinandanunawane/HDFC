export function createRouter(rootEl, routes) {
  function getPath() {
    const raw = location.hash || "#/";
    const path = raw.replace(/^#/, "");
    return path || "/";
  }

  function render() {
    const path = getPath();
    const handler = routes[path] || routes["/"];
    rootEl.innerHTML = "";
    handler(rootEl);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function go(path) {
    location.hash = `#${path}`;
  }

  function start() {
    window.addEventListener("hashchange", render);
    render();
  }

  return { start, go, render };
}

