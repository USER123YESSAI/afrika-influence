'use client';

import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export default function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm text-left ${className}`}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={`bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider ${className}`}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return <tbody className={className}>{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return <td className={`px-6 py-4 whitespace-nowrap ${className}`}>{children}</td>;
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export function TableHead({ children, className = '' }: TableHeadProps) {
  return <th className={`px-6 py-3 ${className}`}>{children}</th>;
}
