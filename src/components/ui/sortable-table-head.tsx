import React from 'react';
import { TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SortConfig, SortDirection } from '@/hooks/useSortableData';

interface SortableHeaderProps<T> {
  children: React.ReactNode;
  sortKey: keyof T | string;
  onSort: (key: keyof T | string) => void;
  sortConfig: SortConfig<T> | null;
  className?: string;
}

function getSortIcon(direction: SortDirection) {
  if (direction === 'asc') return <ArrowUp className="h-4 w-4" />;
  if (direction === 'desc') return <ArrowDown className="h-4 w-4" />;
  return <ArrowUpDown className="h-4 w-4" />;
}

export function SortableTableHead<T>({ 
  children, 
  sortKey, 
  onSort, 
  sortConfig, 
  className 
}: SortableHeaderProps<T>) {
  const isActive = sortConfig?.key === sortKey;
  const direction = isActive ? sortConfig.direction : null;

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        onClick={() => onSort(sortKey)}
        className="h-auto p-0 font-medium hover:bg-transparent flex items-center gap-2"
      >
        {children}
        {getSortIcon(direction)}
      </Button>
    </TableHead>
  );
}