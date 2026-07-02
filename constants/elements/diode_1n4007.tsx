import { Element } from "@/types/elements";

const diode_1n4007: Element = {
  id: "generic:silicon_diode:1n4007",
  name: "1N4007 Silicon Diode",
  description: "Standard Silicon Rectifier Diode (1000V, 1A)",
  type: "diode",
  position: { x: 0, y: 0 },
  rotation: 0,
  runtime: { voltage: 0, current: 0 },
  properties: {
    forwardVoltage: 0.7, // volts
    reverseLeakage: 0.000005,
    isPolarized: true,
    maxVoltage: 1000, // volts
    maxCurrent: 1.0, // amps
    maxPowerDissipation: 3.0, // watts
  },
  pins: [
    {
      id: "anode",
      name: "A",
      color: "#b6a156",
      relX: -19.2,
      relY: 9.6,
      nodeId: null,
    },
    {
      id: "cathode",
      name: "C",
      color: "#777777",
      relX: 67.2,
      relY: 9.6,
      nodeId: null,
    },
  ],
  ui: {
    width: 48,
    height: 19.2,
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
    let bodyFill = "fill-[#141414]";
    let bodyStroke = "stroke-[#333333]";
    if (isDragging) {
      bodyFill = "fill-[#2d2d2d]";
      bodyStroke = "stroke-[#444444]";
    } else if (isHovered) {
      bodyFill = "fill-[#222222]";
      bodyStroke = "stroke-[#444444]";
    }
    return (
      <g>
        {/* Left pin */}
        <line
          x1={0}
          y1={10}
          x2={-15}
          y2={10}
          stroke="#555555"
          strokeWidth={1.5}
          className="transition-all duration-200"
        />
        {/* Right pin */}
        <line
          x1={0}
          y1={10}
          x2={65}
          y2={10}
          stroke="#555555"
          strokeWidth={1.5}
          className="transition-all duration-200"
        />
        {/* Diode body */}
        <rect
          x={0}
          y={0}
          width={50}
          height={20}
          rx={2}
          strokeWidth={1.5}
          className={`${bodyFill} ${bodyStroke} transition-all duration-200 ease-in-out`}
        />
        {/* Cathode stripe (Gray strip) */}
        <rect
          x={41}
          y={1}
          width={4}
          height={18}
          className="fill-[#aaaaaa] transition-all duration-200"
        />
        {/* Component Code */}
        <text
          textAnchor="middle"
          x={22}
          y={13}
          className={`font-bold font-mono pointer-events-none select-none tracking-wide text-[9px] transition-all duration-200 ${
            isHovered || isDragging ? "fill-[#eeeeee]" : "fill-[#aaaaaa]"
          }`}
        >
          1N4007
        </text>
      </g>
    );
  },
};
export default diode_1n4007;
