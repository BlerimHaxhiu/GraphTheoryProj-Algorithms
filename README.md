# Graph Algorithm Visualization Tool

A modern web application for visualizing and analyzing graph algorithms, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Interactive graph construction and customization
- Support for both directed and undirected graphs
- Real-time algorithm visualization
- Comprehensive set of graph algorithms:
  - Search/Traversal: BFS, DFS
  - Shortest Path: Dijkstra, Bellman-Ford, A*, Floyd-Warshall
  - Minimum Spanning Tree: Kruskal, Prim
- Step-by-step algorithm execution
- Graph statistics and adjacency matrix visualization
- Export functionality (JSON, PNG)
- Modern, responsive UI with dark mode

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Animation**: Framer Motion
- **Graph Visualization**: Custom implementation
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd graphishqipp
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── graph/          # Graph-related components
│   └── ui/             # UI components
├── lib/                # Utility functions and algorithms
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## Usage

1. **Creating a Graph**:
   - Click on the canvas to add nodes
   - Drag from one node to another to create edges
   - Use the control panel to customize node and edge properties

2. **Running Algorithms**:
   - Select an algorithm from the control panel
   - Configure algorithm parameters
   - Click "Run" to start visualization
   - Use step controls to navigate through the algorithm execution

3. **Exporting**:
   - Save your graph as JSON for later use
   - Export the current view as PNG
   - Copy graph data to clipboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- Blerim Haxhiu
- Kushtrim Zogaj

## Acknowledgments

- Developed for Prof.Dr Ekrem Halimi
- Built with modern web technologies
- Inspired by the need for better graph algorithm visualization tools
