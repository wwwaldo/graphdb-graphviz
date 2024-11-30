export class SearchPanel {
    constructor(container, graph) {
        this.container = container;
        this.graph = graph;
        this.init();
    }

    init() {
        this.createSearchPanel();
        this.setupEventListeners();
    }

    createSearchPanel() {
        this.searchPanel = d3.select(this.container)
            .append("div")
            .attr("id", "search-container");

        this.searchInput = this.searchPanel.append("input")
            .attr("type", "number")
            .attr("id", "node-search")
            .attr("placeholder", "Node ID")
            .attr("min", 0);

        this.searchButton = this.searchPanel.append("button")
            .attr("id", "search-button")
            .text("Focus");

        this.clearButton = this.searchPanel.append("button")
            .attr("id", "clear-button")
            .text("Clear");
    }

    setupEventListeners() {
        this.searchButton.on("click", () => this.handleSearch());
        
        this.clearButton.on("click", () => {
            this.graph.resetHighlight();
            this.searchInput.property("value", "");
        });

        this.searchInput.on("keyup", (event) => {
            if (event.key === "Enter") {
                this.handleSearch();
            }
        });
    }

    handleSearch() {
        const searchId = this.searchInput.property("value");
        if (searchId !== "") {
            if (!this.graph.focusNode(searchId)) {
                alert(`Node ${searchId} not found`);
            }
        }
    }
}
