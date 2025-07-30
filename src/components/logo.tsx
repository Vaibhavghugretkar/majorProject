// src/components/logo.tsx
import type { FC } from 'react';

interface FigmaticLogoProps extends React.SVGProps<SVGSVGElement> {
  // Any specific props if needed
}

const FigmaticLogo: FC<FigmaticLogoProps> = (props) => (
  <svg
    width="36" // Adjusted size for header
    height="36"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>Figmatic Logo</title>
    {/* Main F shape - vertical bar */}
    <rect x="25" y="20" width="15" height="60" rx="5" className="fill-primary group-hover:fill-accent transition-colors duration-200"/>
    {/* Top horizontal bar of F */}
    <rect x="25" y="20" width="45" height="15" rx="5" className="fill-primary group-hover:fill-accent transition-colors duration-200"/>
    {/* Middle horizontal bar of F */}
    <rect x="25" y="42.5" width="35" height="15" rx="5" className="fill-primary group-hover:fill-accent transition-colors duration-200"/>

    {/* Accent dot/node - representing a connection point or a 'figure' */}
    <circle cx="78" cy="27.5" r="10" className="fill-accent group-hover:fill-primary transition-colors duration-200"/>
    <style jsx>{`
      svg:hover .fill-primary {
        fill: hsl(var(--accent));
      }
      svg:hover .fill-accent {
        fill: hsl(var(--primary));
      }
    `}</style>
  </svg>
);

export default FigmaticLogo;
