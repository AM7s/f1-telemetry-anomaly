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
import type { TimeCompareResponse } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const COLORS = [
  '#00d2be', '#e10600', '#0600ef', '#ff8700', '#005aff', 
  '#006f62', '#ffffff', '#900000', '#f596c8', '#f1c40f'
];

interface Props {
  data: TimeCompareResponse;
}

export function TimeCompareChart({ data }: Props) {
  const maxLen = Math.max(...Object.values(data.data).map(p => p.length), 0);
  const labels = Array.from({ length: maxLen }, (_, i) => i);

  const datasets = Object.entries(data.data).map(([driverNum, points], idx) => ({
    label: `Пилот #${driverNum}`,
    data: labels.map(i => points[i]?.speed ?? null),
    borderColor: COLORS[idx % COLORS.length],
    backgroundColor: COLORS[idx % COLORS.length],
    pointRadius: 0,
    borderWidth: 2,
    tension: 0.1,
    spanGaps: true,
  }));

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
        grid: { 
          color: 'rgba(128, 128, 128, 0.2)',
        },
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
        grid: { 
          color: 'rgba(128, 128, 128, 0.2)',
        },
      },
    },
  };

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
}