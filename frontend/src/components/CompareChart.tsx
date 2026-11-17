import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import type { CompareResponse } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

const COLORS = [
  '#00d2be', '#e10600', '#0600ef', '#ff8700', '#005aff', 
  '#006f62', '#ffffff', '#900000', '#f596c8', '#f1c40f'
];

interface Props {
  data: CompareResponse;
  showAnomalies: boolean; // <-- ДОБАВЛЯЕМ ПРОПС
}

export function CompareChart({ data, showAnomalies }: Props) {
  const maxLen = Math.max(...Object.values(data.data).map(d => d.points.length), 0);
  const labels = Array.from({ length: maxLen }, (_, i) => i);

  const datasets = Object.entries(data.data).map(([driverNum, driverData], index) => {
    const speedData = labels.map(i => {
      const point = driverData.points[i];
      return point && point.speed !== null ? point.speed : null;
    });

    return {
      label: `#${driverNum}`,
      data: speedData,
      borderColor: COLORS[index % COLORS.length],
      backgroundColor: COLORS[index % COLORS.length],
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      tension: 0.1,
      spanGaps: true,
    };
  });

  // Формируем аннотации только если showAnomalies === true
  const annotations: any = {};
  let annId = 0;

  if (showAnomalies) {
    Object.entries(data.data).forEach(([_, driverData]) => {
      driverData.anomalies.forEach((anomaly) => {
        annotations[`box-${annId++}`] = {
          type: 'box',
          xMin: anomaly.index - 3,
          xMax: anomaly.index + 3,
          backgroundColor: 'rgba(225, 6, 0, 0.2)',
          borderColor: 'rgba(225, 6, 0, 0.8)',
          borderWidth: 1,
          drawTime: 'beforeDatasetsDraw',
        };
      });
    });
  }

  const chartData = { labels, datasets };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          color: 'var(--text-main)',
          font: { family: 'Titillium Web', size: 14, weight: 'bold' },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { family: 'Titillium Web', size: 14 },
        bodyFont: { family: 'Titillium Web', size: 14 },
      },
      annotation: {
        annotations: annotations // <-- Передаем пустой объект, если аномалии выключены
      }
    },
    scales: {
      y: { 
        title: { 
          display: true, 
          text: 'SPEED (KM/H)', 
          color: 'var(--text-muted)',
          font: { family: 'Titillium Web', weight: 'bold' }
        },
        ticks: { color: 'var(--text-muted)' },
        grid: { color: 'rgba(128, 128, 128, 0.2)' },
        min: 0,
        max: 350,
      },
      x: { 
        title: { 
          display: true, 
          text: 'SAMPLE', 
          color: 'var(--text-muted)',
          font: { family: 'Titillium Web', weight: 'bold' }
        },
        ticks: { color: 'var(--text-muted)', maxTicksLimit: 20 },
        grid: { color: 'rgba(128, 128, 128, 0.2)' },
      },
    },
  };

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}