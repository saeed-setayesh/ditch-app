import type { ChecklistSchemaV1 } from "./checklistSchema";

/**
 * Example starter checklist for commercial motor vehicle circles (brakes, tires, lights, etc.).
 * Fleets should customize with legal/compliance review — not certified NSC/MTO content.
 */
export const exampleOntarioStarterChecklist: ChecklistSchemaV1 = {
  version: 1,
  sections: [
    {
      title: "Documents & cab",
      items: [
        {
          id: "doc-registration",
          label: "Registration / insurance papers present",
          allowNa: false,
          defectLabels: ["Missing", "Expired"],
        },
        {
          id: "cab-horn-wipers",
          label: "Horn, wipers/washers operational",
          defectLabels: ["Horn inoperative", "Wipers defective"],
        },
        {
          id: "cab-gauges",
          label: "Gauges/warning lamps — air, oil, coolant check",
          defectLabels: ["Warning lamp on", "Gauge defective"],
        },
      ],
    },
    {
      title: "Brakes",
      items: [
        {
          id: "brake-parking",
          label: "Parking brake holds vehicle",
          requirePhotoOnDefect: true,
          defectLabels: ["Does not hold", "Binding"],
        },
        {
          id: "brake-service",
          label: "Service brakes — pedal feel, air pressure / hydraulic",
          requirePhotoOnDefect: true,
          defectLabels: ["Low air warning", "Pedal spongy", "Pulling"],
        },
      ],
    },
    {
      title: "Steering & suspension",
      items: [
        {
          id: "steering-play",
          label: "Steering — excessive free play, linkage secure",
          defectLabels: ["Excessive play", "Loose component"],
        },
        {
          id: "suspension-springs",
          label: "Springs / air bags — cracks, leaks, shifted",
          defectLabels: ["Air leak", "Spring cracked"],
        },
      ],
    },
    {
      title: "Lights & reflectors",
      items: [
        {
          id: "lights-head-tail",
          label: "Head, tail, clearance, marker lamps",
          defectLabels: ["Inoperative lamp", "Lens damaged"],
        },
        {
          id: "lights-turn-hazard",
          label: "Turn signals & four-way flashers",
          defectLabels: ["Inoperative"],
        },
      ],
    },
    {
      title: "Tires & wheels",
      items: [
        {
          id: "tires-condition",
          label: "Tires — inflation, tread depth, damage",
          requirePhotoOnDefect: true,
          defectLabels: ["Under-inflated", "Flat spot", "Cord visible"],
        },
        {
          id: "wheels-lugs",
          label: "Wheels / fasteners — cracks, loose lugs",
          defectLabels: ["Cracked wheel", "Loose fastener"],
        },
      ],
    },
    {
      title: "Coupling / trailer (if applicable)",
      items: [
        {
          id: "coupling-fifth",
          label: "Fifth wheel / coupling — secure, wear within limits",
          allowNa: true,
          defectLabels: ["Lock defective", "Excessive wear"],
        },
        {
          id: "trailer-brakes-lights",
          label: "Trailer brakes & ABS lamp (if equipped)",
          allowNa: true,
          defectLabels: ["ABS lamp on", "Glad-hand leak"],
        },
      ],
    },
  ],
};
