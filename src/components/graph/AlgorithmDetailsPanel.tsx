'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTree } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export function AlgorithmDetailsPanel() {
  const { t } = useLanguage();

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-lg flex items-center">
          <ListTree className="h-5 w-5 mr-2 text-primary" />
          {t('algorithmDetails.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('algorithmDetails.empty')}
        </p>
      </CardContent>
    </Card>
  );
}
