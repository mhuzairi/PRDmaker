# PRD Maker

An AI-powered Product Requirements Document (PRD) generator with visual canvas and hierarchical PRD management.

## Features

- **Visual Canvas Interface**: Interactive canvas for organizing and managing product features
- **AI-Powered PRD Generation**: Generate comprehensive PRDs using AI assistance
- **Hierarchical PRD Management**: Organize PRDs in a tree structure with parent-child relationships
- **Project Planner Integration**: Start with project planning and seamlessly generate PRDs
- **Multiple Export Formats**: Download PRDs in various formats
- **Real-time Collaboration**: Visual feedback and interactive components

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: CSS3 with modern design patterns
- **Canvas**: React Flow for interactive diagrams
- **State Management**: React Context API
- **Build Tool**: Vite for fast development and building

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mhuzairi/PRDmaker.git
cd PRDmaker
```

2. Navigate to the webapp directory:
```bash
cd webapp
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Start with Project Planning**: Right-click on the canvas and select "Project Planner"
2. **Generate Initial PRD**: Use the project planner to create your first PRD
3. **Manage Hierarchy**: Create child PRDs and organize them in a tree structure
4. **Visual Organization**: Use the canvas to arrange and connect your PRD components
5. **Export**: Download your PRDs in various formats when ready

## Project Structure

```
webapp/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts
│   ├── utils/              # Utility functions
│   ├── models/             # Data models
│   └── config/             # Configuration files
├── public/                 # Static assets
└── dist/                   # Built files (generated)
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.