import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useCallback } from 'react';

const DEFAULT_OPTIONS = {
  nodeSize: 3,
  linkDistance: 30,
  charge: -30,
  centerStrength: 0.1,
  minZoom: 0.1,
  maxZoom: 10,
};

export const ForceGraph = ({ data, width, height, options = {} }) => {
  const svgRef = useRef(null);
  const graphRef = useRef(null);
  const simulationRef = useRef(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  
  // Merge default options with provided options
  const graphOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Pre-compute node connections (memoized)
  const { nodeConnections, linksByNode } = useCallback(() => {
    const nodeConns = new Map();
    const linkMap = new Map();
    
    // Initialize maps
    data.nodes.forEach(node => {
      nodeConns.set(node.id, new Set());
      linkMap.set(node.id, new Set());
    });
    
    // Build connection maps
    data.links.forEach(link => {
      const sourceId = link.source.id || link.source;
      const targetId = link.target.id || link.target;
      
      nodeConns.get(sourceId).add(targetId);
      nodeConns.get(targetId).add(sourceId);
      
      linkMap.get(sourceId).add(link);
      linkMap.get(targetId).add(link);
    });
    
    return { nodeConnections: nodeConns, linksByNode: linkMap };
  }, [data]);

  // Node styling utilities
  const getNodeSize = useCallback((node) => {
    const connections = nodeConnections.get(node.id).size;
    return Math.sqrt(connections * 20) + graphOptions.nodeSize;
  }, [nodeConnections, graphOptions.nodeSize]);

  const getNodeColor = useCallback((node) => {
    const connections = nodeConnections.get(node.id).size;
    return d3.interpolateViridis(connections / 20);
  }, [nodeConnections]);

  // Zoom handling
  const handleZoom = useCallback((event) => {
    setTransform(event.transform);
  }, []);

  // Setup zoom behavior
  useEffect(() => {
    if (!svgRef.current) return;

    const zoom = d3.zoom()
      .scaleExtent([graphOptions.minZoom, graphOptions.maxZoom])
      .on('zoom', handleZoom);

    d3.select(svgRef.current).call(zoom);
  }, [graphOptions.minZoom, graphOptions.maxZoom, handleZoom]);

  // Setup and update simulation
  useEffect(() => {
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links)
        .id(d => d.id)
        .distance(graphOptions.linkDistance))
      .force('charge', d3.forceManyBody().strength(graphOptions.charge))
      .force('center', d3.forceCenter(width / 2, height / 2)
        .strength(graphOptions.centerStrength))
      .force('x', d3.forceX(width / 2))
      .force('y', d3.forceY(height / 2));

    simulationRef.current = simulation;

    return () => simulation.stop();
  }, [data, width, height, graphOptions]);

  // Handle node interactions
  const [selectedNode, setSelectedNode] = useState(null);
  
  const handleNodeClick = useCallback((event, node) => {
    if (event.detail === 2) { // Double click
      node.fixed = !node.fixed;
      if (!node.fixed) {
        node.fx = null;
        node.fy = null;
      } else {
        node.fx = node.x;
        node.fy = node.y;
      }
    }
  }, []);

  const handleNodeHover = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  // Drag handling
  const drag = useCallback(() => {
    const dragstarted = (event) => {
      if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragended = (event) => {
      if (!event.active) simulationRef.current.alphaTarget(0);
      if (!event.subject.fixed) {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    };

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(d3.zoom().scaleBy, 1.5);
  };

  const handleZoomOut = () => {
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(d3.zoom().scaleBy, 0.667);
  };

  const handleZoomReset = () => {
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(d3.zoom().transform, d3.zoomIdentity);
  };

  return (
    <div className="force-graph-container">
      <svg ref={svgRef} width={width} height={height}>
        <g ref={graphRef} transform={transform}>
          {/* Links */}
          {data.links.map((link) => (
            <line
              key={`${link.source.id || link.source}-${link.target.id || link.target}`}
              className="link"
              style={{
                opacity: selectedNode
                  ? linksByNode.get(selectedNode.id).has(link) ? 1 : 0.1
                  : 1,
                strokeWidth: 1 / transform.k
              }}
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
            />
          ))}
          
          {/* Nodes */}
          {data.nodes.map((node) => (
            <g
              key={node.id}
              className="node-group"
              style={{
                opacity: selectedNode
                  ? nodeConnections.get(selectedNode.id).has(node.id) || node.id === selectedNode.id
                    ? 1
                    : 0.1
                  : 1,
                transform: `translate(${node.x},${node.y})`
              }}
            >
              <circle
                className="node"
                r={getNodeSize(node) / transform.k}
                fill={node === selectedNode ? '#e15759' : getNodeColor(node)}
                onClick={(e) => handleNodeClick(e, node)}
                onMouseEnter={() => handleNodeHover(node)}
                onMouseLeave={() => handleNodeHover(null)}
                ref={(el) => el && d3.select(el).call(drag())}
              />
              <text
                style={{
                  opacity: node === selectedNode ? 1 : 0,
                  fontSize: 12 / transform.k
                }}
                dy=".35em"
                textAnchor="middle"
              >
                {node.id}
              </text>
            </g>
          ))}
        </g>
      </svg>
      
      <div className="zoom-controls">
        <button onClick={handleZoomIn}>+</button>
        <button onClick={handleZoomOut}>-</button>
        <button onClick={handleZoomReset}>⟲</button>
      </div>
    </div>
  );
};
