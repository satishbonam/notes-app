import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { validateEmail } from '@/utils/validateEmail';
import { Skeleton } from '@/components/ui/skeleton'; // Skeleton for loading state
import { useApi } from '@/utils/api';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
}

const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  noteId,
}) => {
  const { api } = useApi();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!validateEmail(email)) {
      setIsEmailValid(false);
      return;
    }
    setIsEmailValid(true);
    setIsLoading(true);
    setErrorMessage(null); // Reset error message
    try {
      await api(`/notes/${noteId}/invite_guest/`, {
        method: 'POST',
        data: {
            email,
        },
      });
      alert('Invitation sent successfully!');
      setEmail('');
      onClose();
    } catch  {
      setErrorMessage('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='p-6 max-w-sm mx-auto'>
        <DialogHeader>
          <DialogTitle>Invite Collaborator</DialogTitle>
          <DialogDescription>
            Enter an email to invite a collaborator.
          </DialogDescription>
        </DialogHeader>

        {/* Input with validation */}
        <Input
          type='email'
          placeholder='Enter email to invite'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='mb-2'
          onBlur={() => setIsEmailValid(validateEmail(email))}
        />
        {!isEmailValid && (
          <p className='text-red-500 text-sm mb-2'>
            Please enter a valid email address.
          </p>
        )}

        {/* Display error message */}
        {errorMessage && (
          <p className='text-red-500 text-sm mb-2'>{errorMessage}</p>
        )}

        {/* Actions */}
        <div className='flex justify-end space-x-2'>
          <Button onClick={onClose} variant='ghost'>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!email || isLoading}
            variant='default'>
            {isLoading ? (
              <Skeleton className='h-5 w-16' /> // Loading skeleton for button text
            ) : (
              'Invite'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
