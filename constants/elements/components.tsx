import { Element } from "@/types/elements";

// Prototyping
import half_breadboard from "./half_breadboard";

// Display
import oled_128x64_0_96 from "./oled_128x64_0_96";

// Diode
import diode_1n4007 from "./diode_1n4007";
import led_5mm_red from "./led_5mm_red";

// Raspberry Pi
import raspberry_pi_pico_2 from "./raspberry_pi_pico_2";

export const GENERIC_COMPONENTS: Array<Element> = [
  half_breadboard,
  oled_128x64_0_96,
  diode_1n4007,
  led_5mm_red,
  raspberry_pi_pico_2,
];
