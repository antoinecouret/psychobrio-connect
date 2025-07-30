import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ThemeManager from './ThemeManager';
import SubthemeManager from './SubthemeManager';
import ItemManager from './ItemManager';

const CatalogManager = () => {
  return (
    <Tabs defaultValue="themes" className="space-y-4">
      <TabsList>
        <TabsTrigger value="themes">Thèmes</TabsTrigger>
        <TabsTrigger value="subthemes">Sous-thèmes</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
      </TabsList>

      <TabsContent value="themes">
        <ThemeManager />
      </TabsContent>

      <TabsContent value="subthemes">
        <SubthemeManager />
      </TabsContent>

      <TabsContent value="items">
        <ItemManager />
      </TabsContent>
    </Tabs>
  );
};

export default CatalogManager;