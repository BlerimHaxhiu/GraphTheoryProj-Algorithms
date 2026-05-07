'use client';

import type { Node, Edge, DegreeDistribution } from '@/types/graph';
import { calculateDegreeDistribution } from '@/lib/graph-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface DegreeDistributionChartProps {
  nodes: Node[];
  edges: Edge[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

export function DegreeDistributionChart({ nodes, edges }: DegreeDistributionChartProps) {
  const { t } = useLanguage();
  const data: DegreeDistribution[] = useMemo(
    () => calculateDegreeDistribution(nodes, edges),
    [nodes, edges]
  );

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-lg flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          {t('degreeDistribution.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4 h-[250px] sm:h-[300px]">
        {nodes.length === 0 || data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 h-full flex items-center justify-center">
            {t('degreeDistribution.empty')}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="degree"
                label={{ value: t('degreeDistribution.degree'), position: 'insideBottom', offset: -5, fontSize: 12 }}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                label={{ value: t('degreeDistribution.nodeCount'), angle: -90, position: 'insideLeft', offset: 10, fontSize: 12 }}
                allowDecimals={false}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="count" name={t('degreeDistribution.nodesNumber')}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
