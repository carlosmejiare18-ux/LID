let knownIds = null;
let isFirstLoad = true;
let intervalId = null;

async function checkForNewRuts() {
  try {
    const res = await fetch("/api/admin/queries");
    if (!res.ok) return;
    const queries = await res.json();
    const currentIds = new Set(queries.map((q) => q.id));

    if (isFirstLoad) {
      isFirstLoad = false;
      knownIds = currentIds;
      return;
    }

    const newOnes = queries.filter((q) => !knownIds.has(q.id));
    if (newOnes.length > 0) {
      self.postMessage({ type: "new_ruts", ruts: newOnes });
    }
    knownIds = currentIds;
  } catch (_) {}
}

self.onmessage = (e) => {
  if (e.data === "start") {
    isFirstLoad = true;
    knownIds = null;
    checkForNewRuts();
    intervalId = setInterval(checkForNewRuts, 2000);
  } else if (e.data === "stop") {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
