import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

const COLORS = ['#8b6f47', '#2e7d32', '#ed6c02', '#0288d1', '#9c27b0', '#f44336', '#00bcd4', '#ff9800'];

/**
 * ReportCharts Component
 * Displays various chart types for reports
 * 
 * @param {Object} props
 * @param {string} props.type - Chart type: 'line', 'bar', 'pie'
 * @param {Array} props.data - Chart data array
 * @param {Object} props.config - Chart configuration
 * @param {string} props.title - Chart title
 */
export const ReportCharts = ({ type, data = [], config = {}, title }) => {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          No data available for chart
        </Typography>
      </Paper>
    );
  }

  const renderLineChart = () => {
    const { xKey = 'period', yKey = 'value', lines = [] } = config;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
            }}
          />
          <Legend />
          {lines.length > 0 ? (
            lines.map((line, index) => (
              <Line
                key={line.key || index}
                type="monotone"
                dataKey={line.key}
                stroke={line.color || COLORS[index % COLORS.length]}
                strokeWidth={2}
                name={line.name}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={COLORS[0]}
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = () => {
    const { xKey = 'name', yKey = 'value', bars = [] } = config;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
            }}
          />
          <Legend />
          {bars.length > 0 ? (
            bars.map((bar, index) => (
              <Bar
                key={bar.key || index}
                dataKey={bar.key}
                fill={bar.color || COLORS[index % COLORS.length]}
                name={bar.name}
              />
            ))
          ) : (
            <Bar dataKey={yKey} fill={COLORS[0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => {
    const { nameKey = 'name', valueKey = 'value' } = config;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={valueKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return <Typography>Unsupported chart type: {type}</Typography>;
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2c2416' }}>
          {title}
        </Typography>
      )}
      {renderChart()}
    </Paper>
  );
};

