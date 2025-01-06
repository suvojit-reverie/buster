import { useMemo } from 'react';
import { BusterChartConfigProps, ChartEncodes } from '../interfaces';
import { formatLabel } from '@/utils/columnFormatter';
import { AXIS_TITLE_SEPARATOR } from './axisHelper';

interface UseXAxisTitleProps {
  xAxis: string[];
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  isSupportedChartForAxisTitles: boolean;
  xAxisAxisTitle: BusterChartConfigProps['xAxisAxisTitle'];
  xAxisShowAxisTitle: BusterChartConfigProps['xAxisShowAxisTitle'];
  selectedAxis: ChartEncodes;
}

export const useXAxisTitle = ({
  xAxis,
  columnLabelFormats,
  isSupportedChartForAxisTitles,
  xAxisAxisTitle,
  xAxisShowAxisTitle,
  selectedAxis
}: UseXAxisTitleProps): string => {
  const xAxisColumnLabelFormats = useMemo(() => {
    return xAxis.map((x) => columnLabelFormats[x]);
  }, [xAxis, isSupportedChartForAxisTitles, columnLabelFormats]);

  const xAxisTitle = useMemo(() => {
    if (!isSupportedChartForAxisTitles || xAxisAxisTitle === '' || !xAxisShowAxisTitle) return '';
    return (
      xAxisAxisTitle ||
      selectedAxis.x
        .map((x) => formatLabel(x, columnLabelFormats[x], true))
        .join(AXIS_TITLE_SEPARATOR)
    );
  }, [
    xAxisAxisTitle,
    isSupportedChartForAxisTitles,
    xAxisShowAxisTitle,
    xAxis,
    xAxisColumnLabelFormats
  ]);

  return xAxisTitle;
};
