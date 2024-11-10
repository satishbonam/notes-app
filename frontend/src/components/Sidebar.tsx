import React from 'react';
import { Button } from '@/components/ui/button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/skeleton';

interface SidebarProps {
  categories: string[];
  onSelectCategory: (category: string) => void;
  onClose: () => void;
  isLoading: boolean; // Accept isLoading prop for skeletons
}

const ResponsiveSidebar: React.FC<SidebarProps> = ({
  categories,
  onSelectCategory,
  onClose,
  isLoading,
}) => {
  // Fake category skeletons
  const fakeCategories = Array.from(
    { length: 5 },
    (_, index) => `fake-${index}`
  );

  return (
    <div className='flex flex-col h-full bg-gray-50 shadow-md p-4'>
      {/* Close button for mobile */}
      <div className='flex items-center justify-between mb-4 md:hidden'>
        <h2 className='text-lg font-bold'>Categories</h2>
        <Button variant='ghost' onClick={onClose}>
          <XMarkIcon className='w-6 h-6 text-gray-600' />
        </Button>
      </div>

      {/* Category Buttons or Skeletons */}
      {isLoading
        ? fakeCategories.map((fakeCategory) => (
            <Skeleton key={fakeCategory} className='w-full h-10 mb-2' />
          ))
        : categories.map((category) => (
            <Button
              key={category}
              onClick={() => {
                onSelectCategory(category);
                onClose(); // Close sidebar after selection on mobile
              }}
              variant='ghost'
              className='w-full text-left mb-2'>
              {category}
            </Button>
          ))}
    </div>
  );
};

export default ResponsiveSidebar;
