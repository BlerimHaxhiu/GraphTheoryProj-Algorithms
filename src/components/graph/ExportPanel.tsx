'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Download, Image as ImageIcon, Printer } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface ExportPanelProps {
  onSaveGraph: () => void;
  onExportJSON: () => void;
  onExportPNG: () => void;
  onPrint: () => void;
}

export function ExportPanel({
  onSaveGraph,
  onExportJSON,
  onExportPNG,
  onPrint,
}: ExportPanelProps) {
  const { t } = useLanguage();

  return (
    <Card className="flex h-full flex-col shadow-lg">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="flex items-center text-lg">
          <Download className="mr-2 h-5 w-5 text-primary" />
          {t('export.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <Button onClick={onSaveGraph} className="w-full justify-start" variant="outline">
          <Save className="mr-2 h-4 w-4" />
          {t('export.saveLocal')}
        </Button>
        <Button onClick={onExportJSON} className="w-full justify-start" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t('export.exportJson')}
        </Button>
        <Button onClick={onExportPNG} className="w-full justify-start" variant="outline">
          <ImageIcon className="mr-2 h-4 w-4" />
          {t('export.exportPng')}
        </Button>
        <Button onClick={onPrint} className="w-full justify-start" variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          {t('export.print')}
        </Button>
      </CardContent>
    </Card>
  );
}
