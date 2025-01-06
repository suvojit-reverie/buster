import React from 'react';
import { DEFAULT_CHART_COLORS, DISABLED_CHART_COLORS } from '../config';

export const ChartIcon_StackedBarRelative: React.FC<{ colors?: string[]; disabled?: boolean }> = ({
  colors: colorsProp = DEFAULT_CHART_COLORS,
  disabled
}) => {
  const colors = disabled ? DISABLED_CHART_COLORS : colorsProp;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="23" height="22" viewBox="0 0 23 22" fill="none">
      <path
        d="M11.334 16.5C11.8863 16.5 12.334 16.9477 12.334 17.5V19.5C12.334 20.0523 11.8863 20.5 11.334 20.5H0.333984V16.5H11.334Z"
        fill={colors[0]}
      />
      <path
        d="M17.334 16.5C17.8863 16.5 18.334 16.9477 18.334 17.5V19.5C18.334 20.0523 17.8863 20.5 17.334 20.5H14.334C13.7817 20.5 13.334 20.0523 13.334 19.5V17.5C13.334 16.9477 13.7817 16.5 14.334 16.5H17.334Z"
        fill={colors[1]}
      />
      <path
        d="M7.33398 11.5C7.88627 11.5 8.33398 11.9477 8.33398 12.5V14.5C8.33398 15.0523 7.88627 15.5 7.33398 15.5H0.333984V11.5H7.33398Z"
        fill={colors[0]}
      />
      <path
        d="M16.334 11.5C16.8863 11.5 17.334 11.9477 17.334 12.5V14.5C17.334 15.0523 16.8863 15.5 16.334 15.5H10.334C9.7817 15.5 9.33398 15.0523 9.33398 14.5V12.5C9.33398 11.9477 9.7817 11.5 10.334 11.5H16.334Z"
        fill={colors[1]}
      />
      <path
        d="M5.33398 6.5C5.88627 6.5 6.33398 6.94772 6.33398 7.5V9.5C6.33398 10.0523 5.88627 10.5 5.33398 10.5H0.333984V6.5L5.33398 6.5Z"
        fill={colors[0]}
      />
      <path
        d="M15.334 6.5C15.8863 6.5 16.334 6.94772 16.334 7.5V9.5C16.334 10.0523 15.8863 10.5 15.334 10.5H8.33398C7.7817 10.5 7.33398 10.0523 7.33398 9.5V7.5C7.33398 6.94772 7.7817 6.5 8.33398 6.5L15.334 6.5Z"
        fill={colors[1]}
      />
      <path
        d="M5.33398 1.5C5.88627 1.5 6.33398 1.94772 6.33398 2.5V4.5C6.33398 5.05228 5.88627 5.5 5.33398 5.5L0.333984 5.5V1.5L5.33398 1.5Z"
        fill={colors[0]}
      />
      <path
        d="M13.334 1.5C13.8863 1.5 14.334 1.94772 14.334 2.5V4.5C14.334 5.05228 13.8863 5.5 13.334 5.5H8.33398C7.7817 5.5 7.33398 5.05228 7.33398 4.5V2.5C7.33398 1.94772 7.7817 1.5 8.33398 1.5L13.334 1.5Z"
        fill={colors[1]}
      />
      <path
        d="M21.334 6.5C21.8863 6.5 22.334 6.94772 22.334 7.5V9.5C22.334 10.0523 21.8863 10.5 21.334 10.5H18.334C17.7817 10.5 17.334 10.0523 17.334 9.5V7.5C17.334 6.94772 17.7817 6.5 18.334 6.5H21.334Z"
        fill={colors[0]}
      />
      <path
        d="M21.334 11.5C21.8863 11.5 22.334 11.9477 22.334 12.5V14.5C22.334 15.0523 21.8863 15.5 21.334 15.5H19.334C18.7817 15.5 18.334 15.0523 18.334 14.5V12.5C18.334 11.9477 18.7817 11.5 19.334 11.5H21.334Z"
        fill={colors[0]}
      />
      <path
        d="M21.334 16.5C21.8863 16.5 22.334 16.9477 22.334 17.5V19.5C22.334 20.0523 21.8863 20.5 21.334 20.5H20.334C19.7817 20.5 19.334 20.0523 19.334 19.5V17.5C19.334 16.9477 19.7817 16.5 20.334 16.5H21.334Z"
        fill={colors[0]}
      />
      <path
        d="M21.334 1.5C21.8863 1.5 22.334 1.94772 22.334 2.5V4.5C22.334 5.05228 21.8863 5.5 21.334 5.5H16.334C15.7817 5.5 15.334 5.05228 15.334 4.5V2.5C15.334 1.94772 15.7817 1.5 16.334 1.5L21.334 1.5Z"
        fill={colors[0]}
      />
    </svg>
  );
};
