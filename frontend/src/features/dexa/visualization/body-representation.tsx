import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BodyPart } from "../dexa";
import { DEXAScan } from "@/store/dexa-definitions";
import ReusableTooltip from "@/components/reusable/reusable-tooltip";

export default function BodyRepresentation({
  data,
  title = "Body Composition",
  className = "",
}: {
  data: DEXAScan;
  title?: string;
  className?: string;
}) {
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return "N/A";
    return value < 1 ? (value * 100).toFixed(1) : value.toFixed(1);
  };

  const formatWeight = (value: number | undefined) => {
    return value !== undefined ? value.toFixed(1) : "N/A";
  };

  const getColorForBodyFat = (value: number | undefined) => {
    if (value === undefined) return "#8884d8";

    const percentage = value < 1 ? value * 100 : value;

    if (percentage < 10) return "#82ca9d";
    if (percentage < 20) return "#8884d8";
    if (percentage < 25) return "#ffc658";
    if (percentage < 30) return "#ff8042";
    return "#d32f2f";
  };

  const bodyParts: BodyPart[] = [
    {
      id: "right-arm",
      name: "Right Arm",
      x: 120,
      y: 150,
      dataPoints: [
        {
          label: "Fat %",
          value: data.right_arm_total_region_fat_percentage,
          unit: "%",
          color: getColorForBodyFat(data.right_arm_total_region_fat_percentage),
        },
        {
          label: "Lean Mass",
          value: data.right_arm_lean_tissue_lbs,
          unit: "lbs",
        },
        {
          label: "Fat Mass",
          value: data.right_arm_fat_tissue_lbs,
          unit: "lbs",
        },
      ],
    },
    {
      id: "left-arm",
      name: "Left Arm",
      x: 280,
      y: 150,
      dataPoints: [
        {
          label: "Fat %",
          value: data.left_arm_total_region_fat_percentage,
          unit: "%",
          color: getColorForBodyFat(data.left_arm_total_region_fat_percentage),
        },
        {
          label: "Lean Mass",
          value: data.left_arm_lean_tissue_lbs,
          unit: "lbs",
        },
        {
          label: "Fat Mass",
          value: data.left_arm_fat_tissue_lbs,
          unit: "lbs",
        },
      ],
    },
    {
      id: "trunk",
      name: "Trunk",
      x: 200,
      y: 150,
      dataPoints: [
        {
          label: "Fat %",
          value: data.trunk_total_region_fat_percentage,
          unit: "%",
          color: getColorForBodyFat(data.trunk_total_region_fat_percentage),
        },
        {
          label: "Lean Mass",
          value: data.trunk_lean_tissue_lbs,
          unit: "lbs",
        },
        {
          label: "Fat Mass",
          value: data.trunk_fat_tissue_lbs,
          unit: "lbs",
        },
      ],
    },
    {
      id: "android",
      name: "Android (Abdominal)",
      x: 200,
      y: 190,
      dataPoints: [
        {
          label: "Fat %",
          value: data.android_total_region_fat_percentage,
          unit: "%",
          color: getColorForBodyFat(data.android_total_region_fat_percentage),
        },
        {
          label: "Lean Mass",
          value: data.android_lean_tissue_lbs,
          unit: "lbs",
        },
        {
          label: "Fat Mass",
          value: data.android_fat_tissue_lbs,
          unit: "lbs",
        },
      ],
    },
    {
      id: "gynoid",
      name: "Gynoid (Hip)",
      x: 200,
      y: 230,
      dataPoints: [
        {
          label: "Fat %",
          value: data.gynoid_total_region_fat_percentage,
          unit: "%",
          color: getColorForBodyFat(data.gynoid_total_region_fat_percentage),
        },
        {
          label: "Lean Mass",
          value: data.gynoid_lean_tissue_lbs,
          unit: "lbs",
        },
        {
          label: "Fat Mass",
          value: data.gynoid_fat_tissue_lbs,
          unit: "lbs",
        },
      ],
    },
    {
      id: "right-leg",
      name: "Right Leg",
      x: 160,
      y: 320,
      dataPoints: [
        {
          label: "Fat %",
          value: data.right_leg_total_region_fat_percentage,
          unit: "%",
          color: getColorForBodyFat(data.right_leg_total_region_fat_percentage),
        },
        {
          label: "Lean Mass",
          value: data.right_leg_lean_tissue_lbs,
          unit: "lbs",
        },
        {
          label: "Fat Mass",
          value: data.right_leg_fat_tissue_lbs,
          unit: "lbs",
        },
      ],
    },
    {
      id: "left-leg",
      name: "Left Leg",
      x: 240,
      y: 320,
      dataPoints: [
        {
          label: "Fat %",
          value: data.left_leg_total_region_fat_percentage,
          unit: "%",
          color: getColorForBodyFat(data.left_leg_total_region_fat_percentage),
        },
        {
          label: "Lean Mass",
          value: data.left_leg_lean_tissue_lbs,
          unit: "lbs",
        },
        {
          label: "Fat Mass",
          value: data.left_leg_fat_tissue_lbs,
          unit: "lbs",
        },
      ],
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="text-center mb-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Body Fat %</p>
              <p className="text-xl font-bold text-foreground">
                {formatPercentage(data.total_body_fat_percentage)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Lean Mass</p>
              <p className="text-xl font-bold text-foreground">
                {formatWeight(data.lean_tissue_lbs)} lbs
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Fat Mass</p>
              <p className="text-xl font-bold text-foreground">
                {formatWeight(data.fat_tissue_lbs)} lbs
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-md h-[450px] mt-4">
          {/* Simple Geometric Human Body SVG */}
          <svg viewBox="0 0 400 500" className="w-full h-full">
            {/* Simple body outline using basic geometric shapes */}
            <g stroke="#d1d5db" strokeWidth="2" fill="none">
              {/* Head - Simple Circle */}
              <circle cx="200" cy="60" r="30" />
              {/* Neck - Simple Line */}
              <line x1="200" y1="90" x2="200" y2="110" />
              {/* Body - Rectangle */}
              <rect x="150" y="110" width="100" height="150" rx="4" />
              {/* Arms - Simple Lines */}
              <line x1="150" y1="130" x2="80" y2="180" /> {/* Right Arm */}
              <line x1="250" y1="130" x2="320" y2="180" /> {/* Left Arm */}
              {/* Legs - Simple Lines */}
              <line x1="170" y1="260" x2="150" y2="390" /> {/* Right Leg */}
              <line x1="230" y1="260" x2="250" y2="390" /> {/* Left Leg */}
            </g>

            {bodyParts.map((part) => (
              <ReusableTooltip
                key={part.id}
                delayDuration={1}
                renderTrigger={
                  <circle
                    cx={part.x}
                    cy={part.y}
                    r={8}
                    fill={part.dataPoints[0].color || "#8884d8"}
                    opacity={0.7}
                    stroke="#fff"
                    strokeWidth="2"
                    style={{
                      cursor: "pointer",
                      transition: "r 0.2s, opacity 0.2s",
                    }}
                  />
                }
                renderContent={
                  <div className="bg-background border rounded-md shadow-md p-3 min-w-[150px]">
                    <h4 className="font-medium text-sm mb-2 text-foreground">
                      {part.name}
                    </h4>
                    <div className="space-y-1">
                      {part.dataPoints.map((dataPoint, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {dataPoint.label}:
                          </span>
                          <span className="font-medium text-foreground">
                            {dataPoint.label.includes("Fat %")
                              ? formatPercentage(dataPoint.value)
                              : formatWeight(dataPoint.value)}
                            {dataPoint.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                }
                contentClassName="p-0 z-2"
                side="right"
                align="center"
              />
            ))}
          </svg>

          <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-2 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#82ca9d] mr-1"></div>
              <span className="text-foreground">&lt;10%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#8884d8] mr-1"></div>
              <span className="text-foreground">10-20%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#ffc658] mr-1"></div>
              <span className="text-foreground">20-25%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#ff8042] mr-1"></div>
              <span className="text-foreground">25-30%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#d32f2f] mr-1"></div>
              <span className="text-foreground">&gt;30%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-center text-foreground">
          Hover over the dots to see body composition details for each region
        </div>
      </CardContent>
    </Card>
  );
}
