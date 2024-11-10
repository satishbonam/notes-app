// src/components/InviteButton.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import InviteModal from './InviteModal';
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton for loading state

interface InviteButtonProps {
  noteId: string;
  isLoading: boolean; // Accepts isLoading as a prop from parent
}

const InviteButton: React.FC<InviteButtonProps> = ({ noteId, isLoading }) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsInviteModalOpen(true);
  };

  return (
    <>
      {isLoading ? (
        <Skeleton className="w-10 h-10 rounded-md" /> // Show skeleton when loading
      ) : (
        <Button
          variant="ghost"
          onClick={handleOpenModal}
          className="flex items-center space-x-1"
        >
          <UserPlusIcon className="w-5 h-5 text-gray-600" />
        </Button>
      )}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        noteId={noteId}
      />
    </>
  );
};

export default InviteButton;