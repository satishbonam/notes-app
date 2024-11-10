import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Category {
  label: string;
  value: string;
}

interface AsyncCategorySelectProps {
  categories: Category[];
  selectedCategory?: object;
  onCategoryChange: (value: string) => void;
  onAddCategory?: (newCategory: string) => void; // Optional callback to handle new category
}

const AsyncCategorySelect: React.FC<AsyncCategorySelectProps> = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  onAddCategory,
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [localSelectedCategory, setLocalSelectedCategory] =
    useState(selectedCategory);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLocalSelectedCategory(selectedCategory);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [selectedCategory]);

  const handleAddCategory = () => {
    if (newCategory) {
      onAddCategory?.(newCategory);
      setNewCategory('');
    }
  };

  return (
    <div className='space-y-4'>
      <Select
        onValueChange={(value) => onCategoryChange(value)}
        defaultValue={localSelectedCategory?.value}>
        <SelectTrigger className='w-32 text-sm border-gray-300'>
          <SelectValue placeholder='Select Category' />
        </SelectTrigger>
        <SelectContent>
          {categories.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Input for Adding a New Category */}
      <div className='flex space-x-2'>
        <Input
          type='text'
          placeholder='New Category'
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className='w-full'
        />
        <Button onClick={handleAddCategory} disabled={!newCategory}>
          Add
        </Button>
      </div>
    </div>
  );
};

export default AsyncCategorySelect;
