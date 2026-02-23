# Rampart Sentinel

A modern web application for heritage preservation and monitoring, built with React and TypeScript.

## Features

- Interactive 3D visualization of heritage sites
- Heritage explorer with detailed monument information
- Risk assessment and analysis tools
- Analytics dashboard for monitoring heritage sites
- User management system
- Architecture documentation

## Technologies

This project is built with:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **React Router** - Client-side routing
- **shadcn-ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
- **Recharts** - Charting library
- **Vitest** - Testing framework

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd rampart-sentinel
```

2. Install dependencies:
```sh
npm install
```

3. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
rampart-sentinel/
├── src/
│   ├── components/     # React components
│   │   ├── 3D/        # 3D visualization components
│   │   ├── layout/    # Layout components
│   │   └── ui/        # UI components (shadcn)
│   ├── pages/         # Page components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   └── lib/           # Library configurations
├── public/            # Static assets
└── index.html         # HTML entry point
```

## Development

You can edit the code using any IDE or text editor. Changes will be automatically reflected in the development server thanks to Vite's hot module replacement.

## Building for Production

To create a production build:

```sh
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.


