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
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/utils/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, noteId }) => {
    const {api} = useApi();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleShare = async () => {
    if (!validateEmail(email)) {
      setIsEmailValid(false);
      return;
    }
    setIsEmailValid(true);
    setIsLoading(true);
    setErrorMessage(null); // Reset error message

    try {
      await api(`/notes/${noteId}/share_note_with_user/`, {
        method: 'POST',
        data: {
            email,
        },
      });
      alert('Note shared successfully!');
      setEmail('');
      onClose();
    } catch  {
      setErrorMessage('Failed to share the note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='p-6 max-w-sm mx-auto'>
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Enter an email to share this note with others.
          </DialogDescription>
        </DialogHeader>

        {/* Email Input */}
        <Input
          type='email'
          placeholder='Enter email to share'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='mb-2'
          onBlur={() => setIsEmailValid(validateEmail(email))}
          disabled={isLoading} // Disable input while loading
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
          <Button onClick={onClose} variant='ghost' disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={!email || isLoading}
            variant='default'>
            {isLoading ? (
              <Skeleton className='h-5 w-16' /> // Loading skeleton for button text
            ) : (
              'Share'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
