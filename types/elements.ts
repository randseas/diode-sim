import { JSX } from "react";

export interface Element {
  // Default parameters
  id: string; // Unique identifier for the element
  name: string;
  description?: string;
  type: "diode" | "resistor" | "capacitor" | "battery" | string;
  position: { x: number; y: number }; // Location of the element in the canvas
  rotation?: number; // Rotation of the element in degrees
  // Electrical status (Runtime data)
  runtime?: {
    voltage: number;
    current: number;
  };
  // Type-specific properties
  properties?: {
    resistance?: number; // Ohms (For resistor)
    capacitance?: number; // Microfarads (For capacitor)
    nominalVoltage?: number; // Volts (For battery)
    forwardVoltage?: number; // Volts (For diode)
    forwardCurrent?: number; // Amps (For diode)
    reverseLeakage?: number; // Amps (For diode)
    isPolarized?: boolean; // Capacitor/Diode polarity
    maxVoltage?: number; // Volts
    maxCurrent?: number; // Amps
    maxPowerDissipation?: number; // Watts
  };
  // UI parameters
  pins: Array<Pin>;
  ui?: {
    width?: number;
    height?: number;
    zeroPoint?: { x: number; y: number };
    isHovered?: boolean;
    isClicked?: boolean;
    isSelected?: boolean;
    isDragging?: boolean;
    isRotating?: boolean;
    isBlown?: boolean; // For components that can fail (like resistors, capacitors, diodes)
  };
  renderIcon: (
    el: Element,
    isDragging: boolean,
    isHovered: boolean,
  ) => React.ReactNode;
}

export type Pin = {
  id: string;
  name: string;
  orientation?: "top" | "bottom" | "left" | "right";
  color: string;
  relX: number;
  relY: number;
  nodeId: string | null; // ID of the node this pin is connected to
};

export interface Node {
  id: string; // Unique identifier for the node
  voltage: number; // The electrical potential at this node
  connectedPins: Array<{
    elementId: string;
    pinId: string;
  }>; // List of pins connected to this node
}
