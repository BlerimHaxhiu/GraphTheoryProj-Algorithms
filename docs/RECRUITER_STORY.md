# Recruiter Story

This project solves a common learning problem: graph algorithms are difficult to understand when they are taught only through static diagrams, pseudocode, or final answers. Algorithms like Dijkstra, BFS, DFS, Bellman-Ford, Floyd-Warshall, Kruskal, and Prim are easier to learn when students can build a graph, run the algorithm, and watch each decision unfold.

The platform turns graph theory into an interactive learning experience. A user can create weighted, directed, undirected, curved, and parallel-edge graphs, then run algorithms with visual feedback, an adjacency matrix, and a readable execution report. This makes the system useful not only as a simulator, but as a teaching and demonstration tool.

Bilingual support matters because technical education becomes more accessible when students can learn in the language they are most comfortable with. The app supports English and Albanian, which shows attention to real learners rather than only technical features.

The chatbot exists as an educational and automation layer. It can answer graph algorithm questions, explain concepts, compare algorithms, describe the current step, and parse commands that trigger algorithm runs. This demonstrates automation thinking: the app does not only display data, it interprets user intent and connects language to action.

What engineering challenges were solved? The project combines an interactive SVG editor, graph data modeling, algorithm visualization, execution animation, localization, export flows, report generation, local persistence, and chatbot command parsing. Users can edit graph structure directly, run algorithms from controlled UI or chatbot commands, and see the same graph state reflected across canvas highlights, matrix views, reports, history, comparison, and printable output.

From a software engineering perspective, the work required separating algorithm logic, graph utilities, UI panels, translations, and chatbot behavior into distinct modules. It also required validating graph constraints, turning algorithm output into reusable visual steps, and keeping English/Albanian educational content aligned through tests.

This project demonstrates that the developer can build an interactive technical product, explain complex computer science concepts through UI, think about accessibility and localization, and connect automation-style interfaces to real application behavior.
