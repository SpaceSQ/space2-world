// 螺旋式编号拓扑结构
// 对应关系:
// [2] [3] [4]  (Row 0)
// [9] [1] [5]  (Row 1)
// [8] [7] [6]  (Row 2)

export const SPIRAL_MATRIX = [
  [2, 3, 4],
  [9, 1, 5],
  [8, 7, 6]
];

// 获取格子的物理坐标描述 (用于显示)
export const getGridDescription = (gridId: number) => {
  switch (gridId) {
    case 1: return "CENTER HALL (Host Core)";
    case 2: return "NORTH-WEST WING";
    case 3: return "NORTH HALL";
    case 4: return "NORTH-EAST WING";
    case 5: return "EAST HALL";
    case 6: return "SOUTH-EAST WING";
    case 7: return "SOUTH HALL";
    case 8: return "SOUTH-WEST WING";
    case 9: return "WEST HALL";
    default: return "VOID";
  }
};

// 检查是否拥挤 (SSSU 规则)
export const checkCrowding = (occupants: number) => {
  if (occupants <= 1) return { status: 'OPTIMAL', color: 'text-emerald-500' };
  if (occupants === 2) return { status: 'FULL (Standard)', color: 'text-blue-500' };
  if (occupants > 2 && occupants <= 4) return { status: 'OVERCROWDED (5min Timer)', color: 'text-red-500 animate-pulse' };
  return { status: 'CRITICAL', color: 'text-red-900' };
};