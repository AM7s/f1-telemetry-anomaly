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
import type { TelemetryResponse } from '../types/telemetry';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface Props {
  data: TelemetryResponse;
}

export function TelemetryChart({ data }: Props) {
  const labels = data.points.map((_, i) => i);
  const speeds = data.points.map((p) => (p.speed !== null ? Number(p.speed) : null));

  const chartData = {
    labels,
    datasets: [
      {
        label: `Скорость (пилот #${data.driver_number})`,
        data: speeds,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        pointRadius: 0,
        tension: 0.1,
        spanGaps: true,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: `Телеметрия — сессия ${data.session_key}`,
      },
      annotation: {
        annotations: data.anomalies.map((a) => ({
          type: 'box',
          xMin: a.index - 2,
          xMax: a.index + 2,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 1)',
        })),
      },
    },
    scales: {
      y: { title: { display: true, text: 'Скорость (км/ч)' }, min: 0, max: 350 },
      x: { title: { display: true, text: 'Сэмпл' }, ticks: { maxTicksLimit: 20 } },
    },
  };

  return <Line data={chartData} options={options} />;
}