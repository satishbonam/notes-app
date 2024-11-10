import React from 'react';
import { Note } from '../types';
import NoteItem from './NoteItem';

interface NoteListProps {
  notes: Note[];
  onDelete: (noteId: string) => void;
  isLoading: boolean; // Loading state to control skeletons
}

const NoteList: React.FC<NoteListProps> = ({
  notes,
  onDelete,
  isLoading,
}) => {
  const fakeNotes = Array.from({ length: 3 }, (_, index) => ({
    id: `fake-${index}`,
    title: '',
    content: '',
  })) as Note[]; // Array of fake notes for skeletons

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading
        ? fakeNotes.map((fakeNote) => (
            <NoteItem
              key={fakeNote.id}
              note={fakeNote}
              onDelete={() => {
                // Do nothing
              }}
              isLoading={true} // Enable skeleton mode
            />
          ))
        : notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onDelete={() => onDelete(note.id)}
              isLoading={false} // Disable skeleton mode
            />
          ))}
    </div>
  );
};

export default NoteList;