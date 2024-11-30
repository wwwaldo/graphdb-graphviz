export class ForceGraph {
    constructor(container, data, options = {}) {
        this.container = container;
        this.data = data;
        this.options = {
            nodeSize: 3,
            linkDistance: 30,
            charge: -30,
            centerStrength: 0.1,
            width: window.innerWidth,
            height: window.innerHeight,
            minZoom: 0.1,
            maxZoom: 10,
            ...options
        };
        
        // Pre-compute node connections
        this.nodeConnections = new Map();
        this.linksByNode = new Map();
        this.preComputeConnections();
        
        this.nodes = null;
        this.links = null;
        this.simulation = null;
        this.svg = null;
        this.init();
    }

    preComputeConnections() {
        // Initialize maps for each node
        this.data.nodes.forEach(node => {
            this.nodeConnections.set(node.id, new Set());
            this.linksByNode.set(node.id, new Set());
        });

        // Build connection maps
        this.data.links.forEach(link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            
            this.nodeConnections.get(sourceId).add(targetId);
            this.nodeConnections.get(targetId).add(sourceId);
            
            this.linksByNode.get(sourceId).add(link);
            this.linksByNode.get(targetId).add(link);
        });
    }

    init() {
        this.setupSVG();
        this.setupSimulation();
        this.setupZoom();
        this.render();
    }

    setupSVG() {
        this.svg = d3.select(this.container)
            .append("svg")
            .attr("width", this.options.width)
            .attr("height", this.options.height);

        // Add a background rect for registering zoom events
        this.background = this.svg.append("rect")
            .attr("width", this.options.width)
            .attr("height", this.options.height)
            .style("fill", "none")
            .style("pointer-events", "all");

        // Add a group for graph elements that will be transformed during zoom
        this.graphGroup = this.svg.append("g")
            .attr("class", "zoom-group");
    }

    setupZoom() {
        const zoom = d3.zoom()
            .scaleExtent([this.options.minZoom, this.options.maxZoom])
            .on("zoom", (event) => {
                this.graphGroup.attr("transform", event.transform);
                // Scale node sizes inversely with zoom to maintain relative size
                const scale = 1 / event.transform.k;
                this.circles.attr("r", d => this.getNodeSize(d) * scale);
                this.links.style("stroke-width", 1 * scale);
            });

        this.svg.call(zoom);
        
        // Add zoom controls
        const zoomControls = d3.select(this.container)
            .append("div")
            .attr("class", "zoom-controls")
            .style("position", "fixed")
            .style("bottom", "10px")
            .style("right", "10px")
            .style("display", "flex")
            .style("gap", "5px");

        zoomControls.append("button")
            .text("+")
            .style("width", "30px")
            .style("height", "30px")
            .style("font-size", "16px")
            .style("cursor", "pointer")
            .on("click", () => {
                this.svg.transition()
                    .duration(300)
                    .call(zoom.scaleBy, 1.5);
            });

        zoomControls.append("button")
            .text("-")
            .style("width", "30px")
            .style("height", "30px")
            .style("font-size", "16px")
            .style("cursor", "pointer")
            .on("click", () => {
                this.svg.transition()
                    .duration(300)
                    .call(zoom.scaleBy, 0.667);
            });

        zoomControls.append("button")
            .text("⟲")
            .style("width", "30px")
            .style("height", "30px")
            .style("font-size", "16px")
            .style("cursor", "pointer")
            .on("click", () => {
                this.svg.transition()
                    .duration(300)
                    .call(zoom.transform, d3.zoomIdentity);
            });
    }

    setupSimulation() {
        const linkForce = d3.forceLink(this.data.links)
            .id(d => d.id)
            .distance(this.options.linkDistance);

        this.simulation = d3.forceSimulation(this.data.nodes)
            .force("link", linkForce)
            .force("charge", d3.forceManyBody().strength(this.options.charge))
            .force("center", d3.forceCenter(this.options.width / 2, this.options.height / 2)
                .strength(this.options.centerStrength))
            .force("x", d3.forceX(this.options.width / 2))
            .force("y", d3.forceY(this.options.height / 2));
    }

    render() {
        this.renderLinks();
        this.renderNodes();
        this.setupSimulationTick();
    }

    renderLinks() {
        this.links = this.graphGroup.selectAll(".link")
            .data(this.data.links)
            .join("line")
            .attr("class", "link");
    }

    renderNodes() {
        this.nodeGroups = this.graphGroup.selectAll(".node")
            .data(this.data.nodes)
            .join("g")
            .attr("class", "node-group")
            .style("pointer-events", "none");

        this.circles = this.nodeGroups.append("circle")
            .attr("class", "node")
            .attr("r", d => this.getNodeSize(d))
            .style("fill", d => this.getNodeColor(d))
            .style("pointer-events", "all")
            .call(d3.drag()
                .on("start", (event) => this.dragstarted(event))
                .on("drag", (event) => this.dragged(event))
                .on("end", (event) => this.dragended(event)))
            .on("dblclick", (event, d) => this.toggleFixed(event, d))
            .on("mouseover", (event, d) => this.highlightConnections(event, d))
            .on("mouseout", () => this.resetHighlight());

        this.labels = this.nodeGroups.append("text")
            .text(d => d.id)
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .style("fill", "#000")
            .style("font-family", "sans-serif")
            .style("opacity", 0)
            .style("pointer-events", "none");
    }

    setupSimulationTick() {
        this.simulation.on("tick", () => {
            this.links
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            this.nodeGroups.attr("transform", d => `translate(${d.x},${d.y})`);
        });
    }

    getNodeSize(node) {
        const connections = this.nodeConnections.get(node.id).size;
        return Math.sqrt(connections * 20) + this.options.nodeSize;
    }

    getNodeColor(node) {
        const connections = this.nodeConnections.get(node.id).size;
        return d3.interpolateViridis(connections / 20);
    }

    dragstarted(event) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    dragended(event) {
        if (!event.active) this.simulation.alphaTarget(0);
        if (!event.subject.fixed) {
            event.subject.fx = null;
            event.subject.fy = null;
        }
    }

    toggleFixed(event, d) {
        d.fixed = !d.fixed;
        if (!d.fixed) {
            d.fx = null;
            d.fy = null;
        } else {
            d.fx = d.x;
            d.fy = d.y;
        }
    }

    highlightConnections(event, d) {
        const connectedNodes = this.nodeConnections.get(d.id);
        const connectedLinks = this.linksByNode.get(d.id);
        
        this.nodeGroups.style("opacity", node => 
            connectedNodes.has(node.id) || node.id === d.id ? 1 : 0.1
        );

        this.circles.style("fill", node => 
            node.id === d.id ? "#e15759" : this.getNodeColor(node)
        );

        this.links.style("opacity", link => 
            connectedLinks.has(link) ? 1 : 0.1
        );

        this.labels.style("opacity", node => 
            node.id === d.id ? 1 : 0
        );
    }

    resetHighlight() {
        this.nodeGroups.style("opacity", 1);
        this.circles.style("fill", d => this.getNodeColor(d));
        this.links.style("opacity", 1);
        this.labels.style("opacity", 0);
    }

    focusNode(nodeId) {
        const node = this.data.nodes.find(n => n.id === parseInt(nodeId));
        if (node) {
            this.highlightConnections({ type: "focus" }, node);
            return true;
        }
        return false;
    }
}
