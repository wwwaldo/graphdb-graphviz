# Interactive Graph Visualization

A D3.js-based force-directed graph visualization with interactive features.

## Features

- Force-directed graph layout with adjustable parameters
- Interactive node dragging and positioning
- Node highlighting with connected nodes and edges
- Node size based on connection count
- Dynamic force control panel
- Smooth transitions and animations

## Usage

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Interact with the graph:
   - Drag nodes to reposition them
   - Double-click nodes to fix/unfix their position
   - Hover over nodes to highlight connections
   - Use the control panel to adjust force parameters

## Structure

- `index.html`: Main visualization file with D3.js implementation
- `data.js`: Graph data structure with nodes and links

## Technical Details

- Built with D3.js v7
- Pure frontend implementation (no server required)
- SVG-based rendering
- Force simulation with configurable parameters:
  - Node repulsion
  - Link distance
  - Center gravity
  - Collision radius
