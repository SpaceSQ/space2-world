"use client";
import React from 'react';

// 雷达图的五个维度与最大值设定
const METRICS = [
  { label: 'Energy (活力)', key: 'energy', color: '#f97316' }, // Orange
  { label: 'Bravery (胆量)', key: 'bravery', color: '#ef4444' }, // Red
  { label: 'Appetite (算耗)', key: 'appetite', color: '#06b6d4' }, // Cyan
  { label: 'Intel (智力)', key: 'intel', color: '#10b981' }, // Emerald
  { label: 'Affection (粘人)', key: 'affection', color: '#a855f7' } // Purple
];

export default function NeuroRadarChart({ stats }: { stats: any }) {
  const size = 240;
  const center = size / 2;
  const radius = size * 0.35;

  // 将五维数据转换为多边形的顶点坐标
  const getCoordinatesForValue = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    // 数值0-100映射到半径
    const r = (value / 100) * radius; 
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // 生成雷达图的填充多边形坐标点串
  const points = METRICS.map((metric, i) => {
    const coord = getCoordinatesForValue(stats[metric.key], i, METRICS.length);
    return `${coord.x},${coord.y}`;
  }).join(' ');

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[300px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* 背景同心网格 (蛛网) */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, level) => (
          <polygon
            key={level}
            points={METRICS.map((_, i) => {
              const coord = getCoordinatesForValue(100 * scale, i, METRICS.length);
              return `${coord.x},${coord.y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray={level === 4 ? "0" : "4 4"}
          />
        ))}

        {/* 从中心发出的5条轴线 */}
        {METRICS.map((_, i) => {
          const coord = getCoordinatesForValue(100, i, METRICS.length);
          return <line key={i} x1={center} y1={center} x2={coord.x} y2={coord.y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />;
        })}

        {/* 动态数据多边形 (半透明填充 + 发光边框) */}
        <polygon
          points={points}
          fill="rgba(255, 107, 0, 0.2)"
          stroke="#FF6B00"
          strokeWidth="2"
          className="drop-shadow-[0_0_8px_rgba(255,107,0,0.8)] transition-all duration-1000 ease-out"
        />

        {/* 数据点与发光点 */}
        {METRICS.map((metric, i) => {
          const coord = getCoordinatesForValue(stats[metric.key], i, METRICS.length);
          return (
            <circle key={i} cx={coord.x} cy={coord.y} r="4" fill={metric.color} className="drop-shadow-[0_0_5px_currentColor]" />
          );
        })}

        {/* 外部雷达标签 */}
        {METRICS.map((metric, i) => {
          const coord = getCoordinatesForValue(115, i, METRICS.length); // 标签放远一点
          return (
            <text key={i} x={coord.x} y={coord.y} fill={metric.color} fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" className="drop-shadow-[0_0_2px_currentColor]">
              {metric.label} {stats[metric.key]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}