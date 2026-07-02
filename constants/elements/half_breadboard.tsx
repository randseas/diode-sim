import { Element } from "@/types/elements";

const half_breadboard: Element = {
  id: "generic:board:breadboard_half",
  name: "Half-Size Breadboard",
  description: "Standard 30-column breadboard with power rails",
  type: "breadboard",
  position: { x: 0, y: 0 },
  rotation: 0,
  runtime: { voltage: 0, current: 0 },
  properties: {},
  pins: [],
  ui: {
    width: 320,
    height: 180,
  },
  renderIcon: ({
    el,
    isDragging,
    isHovered,
  }: {
    el: Element;
    isDragging: boolean;
    isHovered: boolean;
  }) => {
    const cols = 30;
    const step = 9.6;
    return (
      <g>
        <rect
          x={0}
          y={0}
          width={310}
          height={165}
          rx={4}
          fill="#f4f4f2"
          stroke="#d1d1cf"
          strokeWidth={1.5}
        />
        <rect x={5} y={78} width={300} height={8} fill="#e2e2df" />
        {Array.from({ length: cols }).map((_, i) => {
          const xPos = 15 + i * step;
          return (
            <g key={`power-top-${i}`} fill="#3a3a3a">
              <circle cx={xPos} cy={15} r={1.2} />
              <circle cx={xPos} cy={27} r={1.2} />
            </g>
          );
        })}
        <line
          x1={12}
          y1={19}
          x2={300}
          y2={19}
          stroke="#b6a156"
          strokeWidth={0.8}
          opacity={0.6}
        />
        <line
          x1={12}
          y1={31}
          x2={300}
          y2={31}
          stroke="#0055ff"
          strokeWidth={0.8}
          opacity={0.6}
        />
        {Array.from({ length: cols }).map((_, colIdx) => {
          const xPos = 15 + colIdx * step;
          return (
            <g key={`cols-${colIdx}`} fill="#2b2b2b">
              <circle cx={xPos} cy={45} r={1.4} />
              <circle cx={xPos} cy={51.4} r={1.4} />
              <circle cx={xPos} cy={57.8} r={1.4} />
              <circle cx={xPos} cy={64.2} r={1.4} />
              <circle cx={xPos} cy={70.6} r={1.4} />
              <circle cx={xPos} cy={95} r={1.4} />
              <circle cx={xPos} cy={101.4} r={1.4} />
              <circle cx={xPos} cy={107.8} r={1.4} />
              <circle cx={xPos} cy={114.2} r={1.4} />
              <circle cx={xPos} cy={120.6} r={1.4} />
            </g>
          );
        })}
        {Array.from({ length: cols }).map((_, i) => {
          const xPos = 15 + i * step;
          return (
            <g key={`power-bottom-${i}`} fill="#3a3a3a">
              <circle cx={xPos} cy={138} r={1.2} />
              <circle cx={xPos} cy={150} r={1.2} />
            </g>
          );
        })}
        <line
          x1={12}
          y1={142}
          x2={300}
          y2={142}
          stroke="#b6a156"
          strokeWidth={0.8}
          opacity={0.6}
        />
        <line
          x1={12}
          y1={154}
          x2={300}
          y2={154}
          stroke="#0055ff"
          strokeWidth={0.8}
          opacity={0.6}
        />
      </g>
    );
  },
};

export default half_breadboard;
