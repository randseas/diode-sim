import { Element } from "@/types/elements";

/* Power Sources */
export const GENERIC_SOURCES: Array<Element> = [
  {
    id: "generic:power:dc_source_linear_5v",
    name: "5VDC Linear Source",
    description: "Linear Regulated DC Power Supply (5V)",
    type: "battery",
    position: { x: 0, y: 0 },
    rotation: 0,
    runtime: { voltage: 5.0, current: 0 },
    properties: {
      nominalVoltage: 5.0,
      isPolarized: true,
      maxCurrent: 3.0,
    },
    pins: [
      {
        id: "positive",
        name: "+",
        color: "#ff4444",
        relX: -38,
        relY: 12.5,
        nodeId: null,
      },
      {
        id: "negative",
        name: "-",
        color: "#454545",
        relX: 38,
        relY: 12.5,
        nodeId: null,
      },
    ],
    ui: {
      width: 40,
      height: 30
    },
    renderIcon: (el: Element, isDragging: boolean, isHovered: boolean) => {
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
          <line
            x1={-20}
            y1={0}
            x2={-35}
            y2={0}
            stroke="#555555"
            strokeWidth={1.5}
            className="transition-all duration-200"
          />
          <line
            x1={20}
            y1={0}
            x2={35}
            y2={0}
            stroke="#555555"
            strokeWidth={1.5}
            className="transition-all duration-200"
          />
          {/* Body */}
          <rect
            x={-15}
            y={0}
            width={40}
            height={30}
            rx={3}
            strokeWidth={1.5}
            className={`${bodyFill} ${bodyStroke} transition-all duration-200 ease-in-out`}
          />
          {/* Screen background */}
          <rect
            x={-14}
            y={1}
            width={38}
            height={28}
            rx={1}
            className="fill-[#0d0d0d] stroke-[#222222] stroke-[0.5]"
          />
          <text
            x={20}
            y={16}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[#ffffff] text-[10px] font-bold"
          >
            5VDC
          </text>
        </g>
      );
    },
  },
  {
    id: "generic:power:dc_source_linear_3.3v",
    name: "3.3VDC Linear Source",
    description: "Linear Regulated DC Power Supply (3.3V)",
    type: "battery",
    position: { x: 0, y: 0 },
    rotation: 0,
    runtime: { voltage: 3.3, current: 0 },
    properties: {
      nominalVoltage: 3.3,
      isPolarized: true,
      maxCurrent: 3.0,
    },
    pins: [
      {
        id: "positive",
        name: "+",
        color: "#ff4444",
        relX: -35,
        relY: 0,
        nodeId: null,
      },
      {
        id: "negative",
        name: "-",
        color: "#454545",
        relX: 35,
        relY: 0,
        nodeId: null,
      },
    ],
    ui: {},
    renderIcon: (el: Element, isDragging: boolean, isHovered: boolean) => {
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
          <line
            x1={-20}
            y1={0}
            x2={-35}
            y2={0}
            stroke="#555555"
            strokeWidth={1.5}
            className="transition-all duration-200"
          />
          <line
            x1={20}
            y1={0}
            x2={35}
            y2={0}
            stroke="#555555"
            strokeWidth={1.5}
            className="transition-all duration-200"
          />
          <rect
            x={-20}
            y={-15}
            width={40}
            height={30}
            rx={3}
            strokeWidth={1.5}
            className={`${bodyFill} ${bodyStroke} transition-all duration-200 ease-in-out`}
          />
          <rect
            x={-12}
            y={-11}
            width={32}
            height={24}
            rx={1}
            className="fill-[#0d0d0d] stroke-[#222222] stroke-[0.5]"
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[#ffffff] text-[10px] font-bold"
          >
            3.3VDC
          </text>
        </g>
      );
    },
  },
];
