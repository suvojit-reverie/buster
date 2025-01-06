import { ITooltipItem } from '@/components/charts/BusterChartTooltip/interfaces';
import { BusterChartConfigProps, BusterChartProps } from '@/components/charts/interfaces';
import type { Chart, ChartDataset, TooltipItem, ChartTypeRegistry } from 'chart.js';
import { formatChartLabelDelimiter, formatChartValueDelimiter } from '../../../../commonHelpers';
import { percentageFormatter } from './helper';

export const pieTooltipHelper = (
  datasets: ChartDataset[],
  dataPoints: TooltipItem<keyof ChartTypeRegistry>[],
  chart: Chart,
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>,
  keyToUsePercentage: string[]
): ITooltipItem[] => {
  const dataPointDataIndex = dataPoints[0]!.dataIndex;
  const dataPointDatasetIndex = dataPoints[0]!.datasetIndex;
  const dataPointDataset = datasets[dataPointDatasetIndex!];
  const tooltipDatasets = datasets.filter((dataset) => dataset.hidden);

  const dataPointIsInTooltip = tooltipDatasets.some(
    (dataset) => dataset.label === dataPointDataset.label
  );

  if (!dataPointIsInTooltip) {
    return [];
  }

  return tooltipDatasets.map<ITooltipItem>((tooltipDataset) => {
    const isActiveDataset = tooltipDataset.label === dataPointDataset.label;
    const color = isActiveDataset
      ? (dataPointDataset.backgroundColor as string[])[dataPointDataIndex]
      : undefined;

    const formattedLabel = formatChartLabelDelimiter(
      tooltipDataset.label as string,
      columnLabelFormats
    );
    const rawValue = tooltipDataset.data[dataPointDataIndex] as number;
    const formattedValue = formatChartValueDelimiter(
      rawValue,
      tooltipDataset.label as string,
      columnLabelFormats
    );

    const usePercentage = keyToUsePercentage.includes(tooltipDataset.label as string);

    const formattedPercentage = usePercentage
      ? getPiePercentage(
          dataPointDataIndex,
          datasets.findIndex((dataset) => dataset.label === tooltipDataset.label && dataset.hidden),
          tooltipDataset.data,
          tooltipDataset.label as string,
          columnLabelFormats,
          chart
        )
      : undefined;

    return {
      usePercentage,
      color,
      seriesType: 'pie',
      formattedLabel,
      values: [{ formattedValue, formattedLabel, formattedPercentage }]
    };
  });
};

export const getPiePercentage = (
  dataPointDataIndex: number,
  datasetIndex: number,
  datasetData: Chart['data']['datasets'][number]['data'],
  label: string,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  chart: Chart
): string => {
  const compareValue = datasetData[dataPointDataIndex] as number;
  const totalizer = chart.$totalizer;
  const total = totalizer.seriesTotals[datasetIndex];
  const percentage = (compareValue / total) * 100;
  return percentageFormatter(percentage, label, columnLabelFormats);
};
