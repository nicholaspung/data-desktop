// src/features/dexa/visualization/symmetry-tab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DexaScan } from "../dexa-visualization";

interface SymmetryTabProps {
  data: DexaScan[];
}

const SymmetryTab = ({ data }: SymmetryTabProps) => {
  // Get limb symmetry data (right vs left comparison)
  const getLimbSymmetryData = () => {
    if (data.length === 0) return [];

    const latest = data[data.length - 1];

    return [
      {
        category: "Arms Fat %",
        Right: latest.right_arm_total_region_fat_percentage || 0,
        Left: latest.left_arm_total_region_fat_percentage || 0,
      },
      {
        category: "Arms Lean (lbs)",
        Right: latest.right_arm_lean_tissue_lbs || 0,
        Left: latest.left_arm_lean_tissue_lbs || 0,
      },
      {
        category: "Legs Fat %",
        Right: latest.right_leg_total_region_fat_percentage || 0,
        Left: latest.left_leg_total_region_fat_percentage || 0,
      },
      {
        category: "Legs Lean (lbs)",
        Right: latest.right_leg_lean_tissue_lbs || 0,
        Left: latest.left_leg_lean_tissue_lbs || 0,
      },
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Left vs Right Symmetry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={getLimbSymmetryData()}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Right" fill="#8884d8" name="Right Side" />
              <Bar dataKey="Left" fill="#82ca9d" name="Left Side" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SymmetryTab;
