import json
import random

# Generate 1024 nodes
nodes = [{"id": i, "name": f"Node {i}"} for i in range(1024)]

# Generate edges
links = []
for node in nodes:
    # Random number of edges (0-5) for this node
    num_edges = random.randint(0, 5)
    
    # Create edges to random nodes
    possible_targets = list(range(1024))
    possible_targets.remove(node["id"])  # Remove self from possible targets
    
    # Remove already connected nodes to avoid duplicates
    existing_connections = {link["source"] for link in links if link["target"] == node["id"]}
    existing_connections.update({link["target"] for link in links if link["source"] == node["id"]})
    possible_targets = [t for t in possible_targets if t not in existing_connections]
    
    # Create the edges
    for _ in range(min(num_edges, len(possible_targets))):
        target = random.choice(possible_targets)
        possible_targets.remove(target)
        links.append({
            "source": node["id"],
            "target": target
        })

# Save to JSON file
with open('graph_data.json', 'w') as f:
    json.dump({"nodes": nodes, "links": links}, f)
