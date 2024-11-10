import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import NoteList from '../components/NoteList';
import { Note } from '../types';
import { useApi } from '../utils/api';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import {
  PlusIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useAuth0 } from '@auth0/auth0-react';

const NotesPage: React.FC = () => {
  const { logout } = useAuth0();
  const { api } = useApi();
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(
    router.query.category
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api('/categories/');
        setCategories([
          'All Notes',
          ...response.data.map((cat: { name: string }) => cat.name),
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [api]);

  // Fetch notes based on selected category
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const endpoint =
          selectedCategory === 'All Notes' || !selectedCategory
            ? '/notes'
            : `/notes?category=${selectedCategory}`;
        const response = await api(endpoint);
        setNotes(response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [api, selectedCategory]);

  // Update selected category in state and URL query parameter
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    router.push({ query: { category } }, undefined, { shallow: true });
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleDelete = async (noteId: string) => {
    await api(`/notes/${noteId}/`, { method: 'DELETE' });
    setNotes(notes.filter((note) => note.id !== noteId));
  };

  const handleCreateNote = () => {
    router.push(`/note/new`);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Sidebar for larger screens, toggleable on mobile */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gray-50 shadow-md z-20 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 md:relative md:translate-x-0`}>
        <Sidebar
          categories={categories}
          onSelectCategory={handleCategoryChange}
          onClose={() => setIsSidebarOpen(false)}
          isLoading={categoriesLoading}
        />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black opacity-50 z-10 md:hidden'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col overflow-y-auto p-6'>
        {/* Top Navigation */}
        <div className='flex justify-between items-center mb-6'>
          {/* Hamburger Icon for Mobile */}
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            variant='ghost'
            className='flex items-center md:hidden'>
            <Bars3Icon className='w-6 h-6 text-gray-600' />
          </Button>

          <Button
            onClick={handleCreateNote}
            variant='default'
            className='flex items-center'>
            <span className='mr-2'>Create</span>
            <PlusIcon className='w-6 h-6 text-gray-600' />
          </Button>

          {selectedCategory && (
            <h1 className='text-2xl font-bold'>Category: {selectedCategory}</h1>
          )}

          <Button
            onClick={handleLogout}
            variant='ghost'
            className='flex items-center'>
            <ArrowRightOnRectangleIcon className='w-6 h-6 text-gray-600' />
          </Button>
        </div>

        <NoteList
          notes={notes}
          onDelete={handleDelete}
          isLoading={loading || categoriesLoading}
        />
      </div>
    </div>
  );
};

export default NotesPage;
