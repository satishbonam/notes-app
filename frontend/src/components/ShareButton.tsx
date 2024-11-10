import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShareIcon } from '@heroicons/react/24/outline';
import ShareModal from './ShareModal';
import { Skeleton } from '@/components/ui/skeleton';

interface ShareButtonProps {
  noteId: string;
  isLoading: boolean; // Accepts isLoading as a prop from parent
}

const ShareButton: React.FC<ShareButtonProps> = ({ noteId, isLoading }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <>
      {isLoading ? (
        <Skeleton className="w-10 h-10 rounded-md" /> // Skeleton while loading
      ) : (
        <Button
          variant="ghost"
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center space-x-1"
        >
          <ShareIcon className="w-5 h-5 text-gray-600" />
        </Button>
      )}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        noteId={noteId}
      />
    </>
  );
};

export default ShareButton;