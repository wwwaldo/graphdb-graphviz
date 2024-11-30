import json
import random

# Generate 128 nodes
nodes = [{"id": str(i), "name": f"Node {i}"} for i in range(128)]

# Generate edges with string IDs
links = []
for _ in range(256):  # 2 connections per node on average
    source = random.randint(0, 127)
    target = random.randint(0, 127)
    if source != target:  # Avoid self-loops
        links.append({
            "source": str(source),
            "target": str(target)
        })

# Create graph data
graph_data = {
    "nodes": nodes,
    "links": links
}

# Write to file
with open('src/data/graph_data.json', 'w') as f:
    json.dump(graph_data, f, indent=2)
