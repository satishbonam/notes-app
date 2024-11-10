import React from 'react';
import { Note } from '../types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import InviteButton from './InviteButton';
import ShareButton from './ShareButton';
import { Skeleton } from '@/components/ui/skeleton';

interface NoteItemProps {
  note: Note;
  onDelete: () => void;
  isLoading: boolean; // Accept isLoading as a prop
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  onDelete,
  isLoading,
}) => {
  const router = useRouter();

  const handleEdit = () => {
    if (!isLoading) {
      router.push(`/note/${note.id}`);
    }
  };

  return (
    <Card className='relative shadow-md hover:shadow-lg transition-shadow duration-200 p-4 flex flex-col justify-between'>
      {/* Edit Button in Top Right */}
      {isLoading ? (
        <Skeleton className='absolute top-2 right-2 w-6 h-6 rounded-full' />
      ) : (
        <Button
          onClick={handleEdit}
          variant='ghost'
          className='absolute top-2 right-2 p-1'>
          <PencilIcon className='w-5 h-5 text-gray-600' />
        </Button>
      )}

      {/* Note Title and Content */}
      <CardContent className='flex flex-col space-y-2' onClick={handleEdit}>
        {isLoading ? (
          <>
            <Skeleton className='h-6 w-3/4 mb-2' /> {/* Title Skeleton */}
            <Skeleton className='h-16 w-full' /> {/* Content Skeleton */}
          </>
        ) : (
          <>
            <h3 className='text-lg font-semibold text-gray-900'>
              {note.title}
            </h3>
            <div
              className='text-gray-600 text-sm max-h-24 overflow-hidden'
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
                overflow: 'hidden',
              }}
              dangerouslySetInnerHTML={{
                __html: note.content,
              }}
            />
          </>
        )}
      </CardContent>

      {/* Footer Actions */}
      {note?.is_owner &&<CardFooter className='flex justify-between items-center mt-0'>
        <ShareButton noteId={note.id} isLoading={isLoading} />

        <InviteButton noteId={note.id} isLoading={isLoading} />

        {isLoading ? (
          <Skeleton className='w-8 h-8 rounded-md' /> // Delete button skeleton
        ) : (
          <Button
            variant='ghost'
            onClick={onDelete}
            className='flex items-center space-x-1'>
            <TrashIcon className='w-5 h-5 text-gray-600' />
          </Button>
        )}
      </CardFooter>}
    </Card>
  );
};

export default NoteItem;
