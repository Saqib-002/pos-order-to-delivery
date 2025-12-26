import React, { useMemo } from 'react';
import { FinancialAnalyticsType } from '@/types/report';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { StatsCard } from '../shared/StatsCard.order';
import { ChartPieIcon, CircleDollarSign, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface FinancialReportProps {
  data: FinancialAnalyticsType | null;
}

export const FinancialReport: React.FC<FinancialReportProps> = ({ data }) => {
  const { t } = useTranslation();

  const pieData = useMemo(() => {
    if (!data) return null;
    return {
      labels: [
        t('reports.financial.vehicles'), 
        t('reports.financial.workers'), 
        t('reports.financial.market')
      ],
      datasets: [
        {
          data: [
            data.summary.breakdown.vehicleExpenses,
            data.summary.breakdown.workerExpenses,
            data.summary.breakdown.marketExpenses
          ],
          backgroundColor: [
            '#F87171',
            '#60A5FA',
            '#34D399'
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [data, t]);

  const barData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.graphData.map(d => d.date),
      datasets: [
        {
          label: t('reports.financial.income'),
          data: data.graphData.map(d => d.income),
          backgroundColor: '#34D399',
        },
        {
          label: t('reports.financial.expenses'),
          data: data.graphData.map(d => d.expense),
          backgroundColor: '#F87171',
        }
      ]
    };
  }, [data, t]);

  if (!data) return <div className="p-4 text-center text-gray-500">{t('common.loading')}</div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
                title={t('reports.financial.totalIncome')}
                value={data.summary.income}
                icon={<CircleDollarSign className="h-8 w-8 text-green-600" />}
                bgColor="bg-green-100"
                format={(val: number) => `$${val.toFixed(2)}`}
            />
             <StatsCard
                title={t('reports.financial.totalExpenses')}
                value={data.summary.totalExpenses}
                icon={<TrendingDownIcon className="h-8 w-8 text-red-600" />}
                bgColor="bg-red-100"
                format={(val: number) => `$${val.toFixed(2)}`}
            />
             <StatsCard
                title={t('reports.financial.netProfit')}
                value={data.summary.netProfit}
                icon={<TrendingUpIcon className="h-8 w-8 text-blue-600" />}
                bgColor="bg-blue-100"
                format={(val: number) => `$${val.toFixed(2)}`}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart: Expense Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <ChartPieIcon className="w-5 h-5 text-gray-500" />
                    {t('reports.financial.expenseBreakdown')}
                </h3>
                <div className="h-64 flex justify-center">
                    {pieData && <Pie data={pieData} options={{ maintainAspectRatio: false }} />}
                </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    {t('reports.financial.incomeVsExpense')}
                </h3>
                <div className="h-64">
                    {barData && <Bar data={barData} options={{ maintainAspectRatio: false, responsive: true }} />}
                </div>
            </div>
        </div>
    </div>
  );
};