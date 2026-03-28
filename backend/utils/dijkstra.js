function dijkstra(graph, start, end) {
  start = start.toLowerCase();
  end = end.toLowerCase();

  const distances = {};
  const previous = {};
  const visited = new Set();
  const pq = new Map();

  for (const station in graph) distances[station] = Infinity;
  distances[start] = 0;
  pq.set(start, 0);

  while (pq.size > 0) {
    let current = null;

    for (const [node, dist] of pq) {
      if (!current || dist < pq.get(current)) current = node;
    }

    if (current === end) break;

    pq.delete(current);
    visited.add(current);

    if (!graph[current]) continue;

    for (const neighbor of graph[current]) {
      if (visited.has(neighbor.to)) continue;

      const newDist = distances[current] + neighbor.weight;

      if (newDist < distances[neighbor.to]) {
        distances[neighbor.to] = newDist;
        previous[neighbor.to] = { station: current, trainId: neighbor.trainId };
        pq.set(neighbor.to, newDist);
      }
    }
  }

  if (!previous[end]) return null;

  const path = [];
  let node = end;

  while (node !== start) {
    const prev = previous[node];
    path.push({
      from: prev.station,
      to: node,
      trainId: prev.trainId
    });
    node = prev.station;
  }

  return path.reverse();
}

module.exports = dijkstra;
