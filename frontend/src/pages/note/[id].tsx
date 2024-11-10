/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback,ForwardedRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Delta } from 'quill';
import { debounce } from 'lodash';
import { useApi } from '@/utils/api';
import { v4 as uuidv4 } from 'uuid';
import ShareButton from '@/components/ShareButton';
import InviteButton from '@/components/InviteButton';
import { Skeleton } from '@/components/ui/skeleton';
import AsyncCategorySelect from '@/components/AsyncCategorySelect';
import { useFetchCategories } from '@/hooks/useFetchCategories';

const clientId = uuidv4();

interface QuillProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forwardedRef?: ForwardedRef<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow other props
}

const QuillNoSSRWrapper = dynamic<QuillProps>(
  async () => {
    const { default: RQ } = await import('react-quill');
    // eslint-disable-next-line react/display-name
    return ({ forwardedRef, ...props }: QuillProps) => <RQ ref={forwardedRef} {...props} />;
  },
  { ssr: false }
);

import 'react-quill/dist/quill.snow.css';

const NoteEditorPage: React.FC = () => {
  const router = useRouter();
  const { id: noteId } = router.query as { id: string };
  const { api, authToken ,isAuthenticated,isLoading:isAuthLoading} = useApi();
  const {
    categories,
    fetchCategories,
    createCategory,
    loading: categoriesLoading,
  } = useFetchCategories();

  const [socket, setSocket] = useState<WebSocket>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef = useRef<any>(null);
  const [noteContent, setNoteContent] = useState('');
  const noteTitleRef = useRef<string>(''); // Ref for note title
  const selectedCategoryRef = useRef<object>({
    label: '',
    value: '',
  }); // Ref for selected category
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true); // Loading state for note data
  const [noteFetchError, setNoteFetchError] = useState<string | null>(null);
  const [isNoteOwner, setIsNoteOwner] = useState<boolean>(false);

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch note data if editing an existing note
  useEffect(() => {
    if (noteId !== 'new' && noteId) {
      const fetchNote = async () => {
        try {
          const token = router.query.token;
          const response = token?await api(`/notes/${noteId}/?token=${token}`, { method: 'GET' },true):await api(`/notes/${noteId}/`, { method: 'GET' });

          setNoteContent(response.data.content);
          setIsNoteOwner(response.data.is_owner);
          noteTitleRef.current = response.data.title || '';
          selectedCategoryRef.current = {
            label: response.data?.user_updated_category?.name,
            value: String(response.data?.user_updated_category?.id),
          };
        } catch  {
          setNoteFetchError('Failed to fetch note data');
        } finally {
          setLoading(false);
        }
      };
      fetchNote();
    } else {
      setLoading(false); // No loading state needed for a new note
    }
  }, [noteId, api, router.query.token]);

  // Set up WebSocket for real-time collaboration
  useEffect(() => {
    if (noteId !== 'new' && noteId) {
      const token = router.query.token;
      const socket = token
        ? new WebSocket(`${process.env.NEXT_WS_URL}/notes/${noteId}/${token}/`)
        : new WebSocket(
            `${process.env.NEXT_WS_URL}/notes/${noteId}/?authToken=${authToken}`
          );

      socket.onopen = () => console.log('WebSocket connected');
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data?.type === 'user_count') {
          setActiveUsers(data?.count);
        } else if (
          data?.type === 'message' &&
          data?.clientId !== clientId &&
          quillRef.current &&
          data?.delta
        ) {
          quillRef.current?.getEditor()?.updateContents(data?.delta, 'api');
        }
      };

      socket.onerror = (error) => console.error('WebSocket error:', error);
      socket.onclose = () => console.log('WebSocket connection closed');
      setSocket(socket);

      return () => {
        socket.close();
      };
    }
  }, [authToken, noteId, router.query.token]);

  // Debounced function to save the note
  const saveNote = useCallback(
    debounce(async (content: string) => {
      try {
        if (noteId === 'new') {
          const response = await api('/notes/', {
            method: 'POST',
            data: {
              title: noteTitleRef.current || 'Untitled',
              content,
              user_updated_category_id: parseInt(
                (selectedCategoryRef.current as any)?.value
              ),
            },
          });
          router.replace(`/note/${response.data.id}`);
        } else {
          const url=router.query.token?`/notes/${noteId}/?token=${router.query.token}`:`/notes/${noteId}/`
          await api(url, {
            method: 'PUT',
            data: {
              title: noteTitleRef.current || 'Untitled',
              content,
              user_updated_category_id: parseInt(
                (selectedCategoryRef.current as any)?.value
              ),
            },
          },!!router.query.token);
        }
      } catch {
        //
      }
    }, 1000),
    [noteId, api]
  );

  // Handle text change in the editor and save note
  const handleTextChange = (content: string, delta: Delta, source: string) => {
    if (source === 'user') {
      socket?.send(JSON.stringify({ delta, clientId }));
      saveNote(content);
    }
  };

  // Handle title change and save note
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    noteTitleRef.current = event.target.value;
    saveNote(noteContent);
  };

  // Handle category change, including async creation if it doesn’t exist
  const handleCategoryChange = async (category: string) => {
    const existingCategory = categories.find((cat) => cat?.value === category);
    if (existingCategory) {
      selectedCategoryRef.current = existingCategory;
    }
    saveNote(noteContent); // Save note with updated category
  };

  if ((!isAuthenticated && !router.query.token) && !isAuthLoading) {
    router.push('/');
  }

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between mb-4'>
        {/* Editable title or skeleton */}
        {loading ? (
          <Skeleton className='h-8 w-3/4 mb-2' />
        ) : (
          <input
            type='text'
            defaultValue={noteTitleRef.current}
            onChange={handleTitleChange}
            placeholder='Untitled Note'
            className='text-xl font-semibold mb-2 focus:outline-none border-b border-transparent focus:border-blue-400 transition-all duration-200'
          />
        )}

        <div className='flex items-center space-x-2'>
          {loading ? (
            <>
              <Skeleton className='h-10 w-10 rounded-full' />
              <Skeleton className='h-10 w-10 rounded-full' />
              <Skeleton className='h-8 w-32 rounded-md' />
            </>
          ) : (
            isNoteOwner && (
              <>
                <ShareButton noteId={noteId} isLoading={loading} />
                <InviteButton noteId={noteId} isLoading={loading} />
                {categoriesLoading ? (
                  <Skeleton className='h-8 w-32 rounded-md' />
                ) : (
                  <AsyncCategorySelect
                    categories={categories}
                    selectedCategory={selectedCategoryRef.current}
                    onCategoryChange={handleCategoryChange}
                    onAddCategory={createCategory}
                  />
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* Active users and skeleton */}
      <div className='text-gray-500 mb-4'>
        {loading ? (
          <Skeleton className='h-4 w-1/4' />
        ) : (
          `Active users editing: ${activeUsers}`
        )}
      </div>

      {/* Content editor or skeleton */}
      {loading ? (
        <Skeleton className='h-64 w-full rounded-md' />
      ) : (
        <QuillNoSSRWrapper
          forwardedRef={quillRef}
          theme='snow'
          value={noteContent}
          onChange={handleTextChange}
        />
      )}
      {noteFetchError && <p className='text-red-500'>{noteFetchError}</p>}
    </div>
  );
};

export default NoteEditorPage;
